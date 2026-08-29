// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource }                                       from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';
import { randomBytes }  from 'crypto';
import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { DataSource } from 'typeorm';

// ===========================================================================>> Custom Library
import { appConfig, resolveWebauthnRp } from 'src/app.config';
import { PasskeyChallenge }    from 'src/app/model/user/passkey-challenge.entity';
import { PasskeyCredential }   from 'src/app/model/user/passkey-credential.entity';
import { User }                from 'src/app/model/user/users.entity';
import { AuthSessionService }  from 'src/app/shared/auth/auth-session.service';
import { PasskeyLoginVerifyDto } from './passkey-login.dto';

// ======================================= >> Code Starts Here << ========================== //
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
/** Numeric login_method convention (see AuthSessionService callers): 1=password, 2=google, 4=telegram. */
const LOGIN_METHOD_PASSKEY = 6;

@Injectable()
export class PasskeyLoginService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly authSessionService: AuthSessionService,
    ) {}

    /** Discoverable/resident-key flow: allowCredentials is intentionally
     *  omitted so the browser's account picker offers every passkey stored
     *  for this RP, without the caller having typed a username first. */
    async generateLoginOptions(requestOrigin?: string) {
        const { rpID } = resolveWebauthnRp(requestOrigin);
        const options = await generateAuthenticationOptions({
            rpID,
            // Must match 'required' at registration time — verifyAuthenticationResponse()
            // defaults to requiring the UV flag regardless of what was requested here,
            // so leaving this as 'preferred' lets the browser skip PIN/biometric and
            // then fail verification server-side.
            userVerification: 'required',
        });

        const challengeRepo = this.dataSource.getRepository(PasskeyChallenge);
        const challenge_token = randomBytes(32).toString('hex');
        await challengeRepo.save(
            challengeRepo.create({
                user_id: null,
                challenge_token,
                challenge: options.challenge,
                purpose: 'authentication',
                expires_at: new Date(Date.now() + CHALLENGE_TTL_MS),
            }),
        );

        return { options, challenge_token };
    }

    async verifyLogin(dto: PasskeyLoginVerifyDto, req: Request) {
        const challengeRepo = this.dataSource.getRepository(PasskeyChallenge);
        const credentialRepo = this.dataSource.getRepository(PasskeyCredential);

        const challengeRow = await challengeRepo.findOne({
            where: { challenge_token: dto.challenge_token, purpose: 'authentication' },
        });
        if (!challengeRow || challengeRow.expires_at < new Date()) {
            if (challengeRow) await challengeRepo.delete(challengeRow.id);
            throw new BadRequestException('Passkey login request expired — please try again');
        }

        const response = dto.credential as unknown as AuthenticationResponseJSON;
        const credentialId = response?.id;
        if (!credentialId) throw new BadRequestException('Invalid passkey response');

        const stored = await credentialRepo.findOne({ where: { credential_id: credentialId } });
        if (!stored) throw new UnauthorizedException('Passkey not recognized');

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: appConfig.AUTH.WEBAUTHN_ORIGIN,
            expectedRPID: appConfig.AUTH.WEBAUTHN_RP_ID,
            credential: {
                id: stored.credential_id,
                publicKey: Buffer.from(stored.public_key, 'base64'),
                counter: Number(stored.counter),
                transports: (stored.transports ?? undefined) as never,
            },
        });

        await challengeRepo.delete(challengeRow.id);

        if (!verification.verified) {
            throw new UnauthorizedException('Passkey verification failed');
        }

        await credentialRepo.update(stored.id, {
            counter: verification.authenticationInfo.newCounter,
            last_used_at: new Date(),
        });

        const userRepo = this.dataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: stored.user_id },
            relations: ['avatar_file'],
        });
        if (!user || user.deleted_at) {
            throw new BadRequestException('This account has been deleted');
        }

        return await this.authSessionService.createLoginResponse(user, req, {
            device_id: dto.device_id,
            login_method: LOGIN_METHOD_PASSKEY,
            create_history: true,
        });
    }
}
