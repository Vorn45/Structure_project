// ===========================================================================>> Core Library
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { randomBytes } from 'crypto';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    type AuthenticatorTransportFuture,
    type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { appConfig, resolveWebauthnRp } from 'src/app.config';
import { UserPayload }           from 'src/app/interface/jwt.interface';
import { PasskeyChallenge }      from 'src/app/model/user/passkey-challenge.entity';
import { PasskeyCredential }     from 'src/app/model/user/passkey-credential.entity';
import { DeviceTrackingService } from 'src/app/shared/device/device-tracking.service';
import { PasskeyRegistrationVerifyDto, RenamePasskeyDto } from './passkey.dto';

// ======================================= >> Code Starts Here << ========================== //
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PasskeyService {
    constructor(
        @InjectRepository(PasskeyCredential)
        private readonly credentialRepo: Repository<PasskeyCredential>,
        @InjectRepository(PasskeyChallenge)
        private readonly challengeRepo: Repository<PasskeyChallenge>,
        private readonly deviceTrackingService: DeviceTrackingService,
    ) {}

    async list(currentUser: UserPayload) {
        const rows = await this.credentialRepo.find({
            where: { user_id: currentUser.id },
            order: { created_at: 'DESC' },
        });

        return { response_code: 200, response_msg: 'Success', data: rows.map((row) => this.mapCredential(row)) };
    }

    async generateRegistrationOptions(currentUser: UserPayload, requestOrigin?: string) {
        const existing = await this.credentialRepo.find({ where: { user_id: currentUser.id } });

        const { rpID } = resolveWebauthnRp(requestOrigin);
        const options = await generateRegistrationOptions({
            rpID,
            rpName: appConfig.AUTH.WEBAUTHN_RP_NAME,
            userID: Buffer.from(String(currentUser.id), 'utf8'),
            userName: currentUser.email || currentUser.phone || String(currentUser.id),
            userDisplayName: currentUser.name_en || currentUser.name_kh || String(currentUser.id),
            attestationType: 'none',
            excludeCredentials: existing.map((row) => ({
                id: row.credential_id,
                transports: (row.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
            })),
            // residentKey 'required' is what makes the credential discoverable
            // later at login time, when no username is typed first.
            // userVerification 'required' must match login-options — verify*Response()
            // defaults to requiring the UV flag regardless of what was requested,
            // so 'preferred' here would let registration skip PIN/biometric and
            // then fail verification server-side (and at every future login).
            authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        });

        const challenge_token = randomBytes(32).toString('hex');
        await this.challengeRepo.save(
            this.challengeRepo.create({
                user_id: currentUser.id,
                challenge_token,
                challenge: options.challenge,
                purpose: 'registration',
                expires_at: new Date(Date.now() + CHALLENGE_TTL_MS),
            }),
        );

        return { response_code: 200, response_msg: 'Success', data: { options, challenge_token } };
    }

    async verifyRegistration(currentUser: UserPayload, dto: PasskeyRegistrationVerifyDto, userAgent?: string) {
        const challengeRow = await this.challengeRepo.findOne({
            where: { challenge_token: dto.challenge_token, purpose: 'registration', user_id: currentUser.id },
        });
        if (!challengeRow || challengeRow.expires_at < new Date()) {
            if (challengeRow) await this.challengeRepo.delete(challengeRow.id);
            throw new BadRequestException('Passkey registration request expired — please try again');
        }

        const response = dto.credential as unknown as RegistrationResponseJSON;
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: appConfig.AUTH.WEBAUTHN_ORIGIN,
            expectedRPID: appConfig.AUTH.WEBAUTHN_RP_ID,
        });

        await this.challengeRepo.delete(challengeRow.id);

        if (!verification.verified || !verification.registrationInfo) {
            throw new BadRequestException('Passkey registration could not be verified');
        }

        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        const deviceName =
            dto.device_name?.trim() ||
            this.deviceTrackingService.parseUserAgent(userAgent || '').device_name;

        const saved = await this.credentialRepo.save(
            this.credentialRepo.create({
                user_id: currentUser.id,
                credential_id: credential.id,
                public_key: Buffer.from(credential.publicKey).toString('base64'),
                counter: credential.counter,
                transports: credential.transports ?? null,
                device_type: credentialDeviceType,
                backed_up: credentialBackedUp,
                device_name: deviceName,
            }),
        );

        return { response_code: 200, response_msg: 'Passkey added', data: this.mapCredential(saved) };
    }

    async rename(currentUser: UserPayload, id: number, dto: RenamePasskeyDto) {
        const row = await this.credentialRepo.findOne({ where: { id, user_id: currentUser.id } });
        if (!row) throw new NotFoundException('Passkey not found');

        row.device_name = dto.device_name.trim();
        await this.credentialRepo.save(row);

        return { response_code: 200, response_msg: 'Passkey renamed', data: this.mapCredential(row) };
    }

    async remove(currentUser: UserPayload, id: number) {
        const row = await this.credentialRepo.findOne({ where: { id, user_id: currentUser.id } });
        if (!row) throw new NotFoundException('Passkey not found');

        await this.credentialRepo.softDelete(row.id);

        return { response_code: 200, response_msg: 'Passkey removed', data: { id } };
    }

    private mapCredential(row: PasskeyCredential) {
        return {
            id: row.id,
            device_name: row.device_name,
            device_type: row.device_type,
            transports: row.transports,
            backed_up: row.backed_up,
            created_at: row.created_at,
            last_used_at: row.last_used_at,
        };
    }
}
