// ===========================================================================>> Core Library
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

export interface SesSendResult {
    success: boolean;
    error?: string;
}

@Injectable()
export class SesService implements OnModuleInit, OnModuleDestroy {
    private readonly _logger = new Logger(SesService.name);
    private _transporter: nodemailer.Transporter | null = null;

    onModuleInit() {
        const host = appConfig.SES.SMTP_HOST;
        const port = Number(appConfig.SES.SMTP_PORT) || 465;
        const isGmail = (host || '').toLowerCase().includes('gmail');
        if (!isGmail) {
            this.getTransporter();
        } else {
            this._logger.log(`Gmail SMTP direct-transport initialized for ${host}:${port} (non-pooled to prevent idle timeout hangs)`);
        }
    }

    onModuleDestroy() {
        if (this._transporter) {
            try {
                this._transporter.close();
            } catch {}
            this._transporter = null;
        }
    }

    private isConfigured(): boolean {
        const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FROM } = appConfig.SES;
        return !!(SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD && FROM);
    }

    private getTransporter(): nodemailer.Transporter | null {
        if (!this.isConfigured()) return null;

        const host = appConfig.SES.SMTP_HOST;
        const port = Number(appConfig.SES.SMTP_PORT) || 465;
        const isSecure = port === 465;
        const isGmail = host.toLowerCase().includes('gmail');

        // For Gmail SMTP (smtp.gmail.com), connection pooling causes 30s hangs on idle sockets
        // because Google silently terminates half-open connections after 60-120s.
        // Direct non-pooled connections connect, authenticate, send, and close cleanly in ~1.2s.
        if (isGmail) {
            return nodemailer.createTransport({
                host,
                port,
                secure: isSecure,
                pool: false,
                auth: {
                    user: appConfig.SES.SMTP_USERNAME,
                    pass: appConfig.SES.SMTP_PASSWORD,
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                tls: {
                    rejectUnauthorized: false,
                },
            });
        }

        if (!this._transporter) {
            this._transporter = nodemailer.createTransport({
                host,
                port,
                secure: isSecure,
                pool: true,
                maxConnections: 5,
                maxMessages: 200,
                rateDelta: 1000,
                rateLimit: 5,
                auth: {
                    user: appConfig.SES.SMTP_USERNAME,
                    pass: appConfig.SES.SMTP_PASSWORD,
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 30000,
                tls: {
                    rejectUnauthorized: false,
                },
            });

            this._logger.log(`SMTP connection pool initialized for ${host}:${port}`);
        }

        return this._transporter;
    }

    async send(payload: SesEmailPayload): Promise<SesSendResult> {
        if (!this.isConfigured()) {
            const err = `SMTP is not configured — host=${appConfig.SES.SMTP_HOST || 'none'}, user=${appConfig.SES.SMTP_USERNAME ? 'set' : 'none'}, from=${appConfig.SES.FROM || 'none'}`;
            this._logger.warn(err);
            return { success: false, error: err };
        }

        const transporter = this.getTransporter();
        if (!transporter) {
            return { success: false, error: 'SMTP transporter could not be initialized' };
        }

        const attachments = (payload.inline_images || []).map((img) => ({
            filename: img.filename,
            content: img.content,
            cid: img.cid,
            contentType: img.mimetype,
            contentDisposition: 'inline' as const,
        }));

        const mailOptions: nodemailer.SendMailOptions = {
            from: `"WMS Digitech" <${appConfig.SES.FROM}>`,
            to: payload.to,
            replyTo: appConfig.SES.FROM,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            priority: 'high',
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high',
                'X-Auto-Response-Suppress': 'All',
            },
            envelope: {
                from: appConfig.SES.FROM,
                to: payload.to,
            },
            attachments,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            this._logger.log(`Email sent successfully to ${payload.to} (MessageId: ${info.messageId})`);
            return { success: true };
        } catch (firstErr: any) {
            this._logger.warn(`First send attempt to ${payload.to} failed: ${firstErr?.message}. Retrying once with fresh connection...`);
            try {
                this._transporter?.close();
            } catch {}
            this._transporter = null;
            const freshTransporter = this.getTransporter();

            if (!freshTransporter) {
                return { success: false, error: firstErr?.message || String(firstErr) };
            }

            try {
                const retryInfo = await freshTransporter.sendMail(mailOptions);
                this._logger.log(`Email sent on retry to ${payload.to} (MessageId: ${retryInfo.messageId})`);
                return { success: true };
            } catch (retryErr: any) {
                const errMsg = retryErr?.message || String(retryErr);
                this._logger.error(`Email send retry to ${payload.to} failed: ${errMsg}`);
                return { success: false, error: `${errMsg} (Host: ${appConfig.SES.SMTP_HOST}:${appConfig.SES.SMTP_PORT})` };
            }
        }
    }
}
