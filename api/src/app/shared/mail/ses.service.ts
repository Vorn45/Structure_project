// ===========================================================================>> Core Library
import { Injectable, Logger } from '@nestjs/common';
import * as net                 from 'net';
import * as tls                from 'tls';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from 'src/app.config';

// ======================================= >> Code Starts Here << ========================== //
/** An image embedded in the message itself, referenced from the HTML as `cid:<cid>`. */
export interface SesInlineImage {
    cid: string;
    filename: string;
    mimetype: string;
    content: Buffer;
}

export interface SesEmailPayload {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    inline_images?: SesInlineImage[];
}

@Injectable()
export class SesService {
    private readonly _logger = new Logger(SesService.name);

    private isConfigured(): boolean {
        const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FROM } = appConfig.SES;
        return !!(SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD && FROM);
    }

    async send(payload: SesEmailPayload): Promise<boolean> {
        if (!this.isConfigured()) {
            this._logger.warn('AWS SES SMTP is not configured — email sending is disabled.');
            return false;
        }

        try {
            await this.sendSmtpMail(payload);
            this._logger.log(`SES email sent to ${payload.to}`);
            return true;
        } catch (error) {
            this._logger.error(`SES send failed: ${String(error)}`);
            return false;
        }
    }

    /**
     * SES's SMTP endpoint offers implicit TLS on 465 and STARTTLS on 587/25 —
     * this connects plaintext and upgrades via STARTTLS, which works for both
     * (465 also accepts STARTTLS-over-TLS if ever pointed there).
     */
    private async sendSmtpMail(payload: SesEmailPayload) {
        const host = appConfig.SES.SMTP_HOST;
        const port = appConfig.SES.SMTP_PORT;
        const from = appConfig.SES.FROM;

        let socket: net.Socket = net.connect(port, host);
        let buffer = '';
        let onData: ((chunk: Buffer) => void) | null = null;

        const attachReader = () => {
            onData = (chunk: Buffer) => (buffer += chunk.toString('utf8'));
            socket.on('data', onData);
        };

        const read = () =>
            new Promise<string>((resolve, reject) => {
                const check = () => {
                    if (/\r?\n\d{3} /.test(`\n${buffer}`) || /^\d{3} /.test(buffer)) {
                        const response = buffer;
                        buffer = '';
                        resolve(response);
                        return true;
                    }
                    return false;
                };
                if (check()) return;
                const interval = setInterval(() => {
                    if (check()) clearInterval(interval);
                }, 20);
                socket.once('error', (err) => {
                    clearInterval(interval);
                    reject(err);
                });
            });

        const send = async (command: string, expected: number[]) => {
            socket.write(`${command}\r\n`);
            const response = await read();
            const code = Number(response.slice(0, 3));
            if (!expected.includes(code))
                throw new Error(`SES SMTP failed: ${response.trim()}`);
        };

        await new Promise<void>((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('error', reject);
        });
        attachReader();

        await read();
        await send(`EHLO ${appConfig.APP.SYSTEM_NAME}`, [250]);
        await send('STARTTLS', [220]);

        if (onData) socket.off('data', onData);
        socket = tls.connect({ socket, servername: host });
        buffer = '';
        await new Promise<void>((resolve, reject) => {
            (socket as tls.TLSSocket).once('secureConnect', resolve);
            socket.once('error', reject);
        });
        attachReader();

        await send(`EHLO ${appConfig.APP.SYSTEM_NAME}`, [250]);
        await send('AUTH LOGIN', [334]);
        await send(Buffer.from(appConfig.SES.SMTP_USERNAME).toString('base64'), [334]);
        await send(Buffer.from(appConfig.SES.SMTP_PASSWORD).toString('base64'), [235]);
        await send(`MAIL FROM:<${from}>`, [250]);
        await send(`RCPT TO:<${payload.to}>`, [250, 251]);
        await send('DATA', [354]);

        const content = this.buildMimeMessage(from, payload);

        await send(content, [250]);
        socket.write('QUIT\r\n');
        socket.end();
    }

    /**
     * Images have to travel inside the message as `cid:` parts rather than as
     * `<img src="https://…">` or a base64 `data:` URI — Gmail refuses to render
     * data URIs outright, and remote URLs are fetched through Google's image
     * proxy, which the file host's bot protection blocks. A `multipart/related`
     * wrapper around the usual `multipart/alternative` body is what every mail
     * client understands.
     */
    private buildMimeMessage(from: string, payload: SesEmailPayload): string {
        const images = payload.inline_images ?? [];
        const alt = [
            '--alt-boundary',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            ...this.encodeBody(payload.text ?? ''),
            '--alt-boundary',
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            ...this.encodeBody(payload.html ?? payload.text ?? ''),
            '--alt-boundary--',
        ];

        const headers = [
            `From: ${from}`,
            `To: ${payload.to}`,
            `Subject: ${payload.subject}`,
            'MIME-Version: 1.0',
        ];

        if (!images.length) {
            return [
                ...headers,
                'Content-Type: multipart/alternative; boundary="alt-boundary"',
                '',
                ...alt,
                '.',
            ].join('\r\n');
        }

        const imageParts = images.flatMap((image) => [
            '--rel-boundary',
            `Content-Type: ${image.mimetype}; name="${image.filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-ID: <${image.cid}>`,
            `Content-Disposition: inline; filename="${image.filename}"`,
            '',
            // SMTP caps a line at 1000 octets, so the payload is wrapped at the
            // 76 chars base64 conventionally uses.
            ...(image.content.toString('base64').match(/.{1,76}/g) ?? []),
        ]);

        return [
            ...headers,
            'Content-Type: multipart/related; type="multipart/alternative"; boundary="rel-boundary"',
            '',
            '--rel-boundary',
            'Content-Type: multipart/alternative; boundary="alt-boundary"',
            '',
            ...alt,
            ...imageParts,
            '--rel-boundary--',
            '.',
        ].join('\r\n');
    }

    /**
     * Bodies are base64'd rather than sent as-is: SMTP caps a line at 998
     * octets and the HTML carries inline styles well past that, so raw text
     * would be wrapped/mangled in transit. It also keeps the Khmer copy
     * intact over 7-bit transports, and sidesteps dot-stuffing entirely
     * since base64 output never starts a line with ".".
     */
    private encodeBody(body: string): string[] {
        const encoded = Buffer.from(body, 'utf8').toString('base64');
        return encoded.match(/.{1,76}/g) ?? [''];
    }
}
