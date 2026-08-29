// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource }                                       from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import type { Request }                     from 'express';
import * as jwt                             from 'jsonwebtoken';
import { DataSource, EntityManager, IsNull } from 'typeorm';

// ===========================================================================>> Custom Library
import { AuthProvider }       from 'src/app/enum/auth-provider.enum';
import { appConfig }          from 'src/app.config';
import { Role }               from 'src/app/model/user/role.entity';
import { UserRole }           from 'src/app/model/user/user_role.entity';
import { User }               from 'src/app/model/user/users.entity';
import { AuthSessionService } from 'src/app/shared/auth/auth-session.service';
import { SsoLoginDto }        from './sso-login.dto';

// ======================================= >> Code Starts Here << ========================== //
/** device_tracking login_method code for CDC SSO logins. */
const LOGIN_METHOD_SSO = 5;

/** How long the SSO realm public key is cached before re-fetching. */
const PUBLIC_KEY_TTL_MS = 10 * 60 * 1000;

/** The identity we trust out of a verified Keycloak access token. */
export interface VerifiedSsoUser {
    sub: string;
    email: string | null;
    email_verified: boolean;
    name: string | null;
    given_name: string | null;
    family_name: string | null;
}

interface KeycloakTokenClaims {
    sub: string;
    iss: string;
    azp?: string;
    aud?: string | string[];
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
}

@Injectable()
export class SsoLoginService {
    private cachedKey: { pem: string; at: number } | null = null;

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly authSessionService: AuthSessionService,
    ) {}

    async login(dto: SsoLoginDto, req: Request) {
        const ssoUser = await this.verifyAccessToken(dto.access_token);
        const email = ssoUser.email?.trim().toLowerCase() ?? null;

        let isNewUser = false;

        const user = await this.dataSource.transaction(async (manager) => {
            const userRepo = manager.getRepository(User);

            // Prefer the stable Keycloak subject: re-logins always resolve to
            // the same PMS user regardless of email state.
            let existing = await userRepo.findOne({
                where: { sso_id: ssoUser.sub },
                withDeleted: true,
                relations: ['avatar_file'],
            });

            // Fall back to email so an existing local/Google account gets linked
            // instead of duplicated — but ONLY when the SSO provider asserts the
            // email is verified. Adopting a pre-existing account off an
            // unverified email would let anyone who can obtain a token for an
            // unverified address hijack that account.
            if (!existing && email && ssoUser.email_verified) {
                existing = await userRepo
                    .createQueryBuilder('user')
                    .withDeleted()
                    .leftJoinAndSelect('user.avatar_file', 'avatar_file')
                    .where('LOWER(user.email) = :email', { email })
                    .getOne();
            }

            // The SSO provider would not vouch for this email, so it was not
            // used to link above. If an account already owns that email,
            // refuse instead of silently creating a duplicate — the caller
            // must verify the email at the IdP before it can be linked.
            if (!existing && email && !ssoUser.email_verified) {
                const emailTaken = await userRepo
                    .createQueryBuilder('user')
                    .withDeleted()
                    .where('LOWER(user.email) = :email', { email })
                    .getExists();
                if (emailTaken)
                    throw new BadRequestException(
                        'SSO email is not verified, cannot link to your account',
                    );
            }

            // Revive a soft-deleted account only when signing up; a login
            // against a deleted account is rejected (same as Google flow).
            if (existing?.deleted_at) {
                if (dto.mode === 'login')
                    throw new BadRequestException(
                        'This account has been deleted',
                    );

                const role = await this.defaultRole(manager);
                userRepo.merge(existing, {
                    deleted_at: null,
                    sex_id: existing.sex_id || 1,
                    name_kh: existing.name_kh || '',
                    name_en: ssoUser.name || email || existing.name_en,
                    email: email ?? existing.email,
                    password: null,
                    is_active: role.id,
                    auth_provider: AuthProvider.SSO,
                    sso_id: ssoUser.sub,
                    email_verified: ssoUser.email_verified,
                    first_name: ssoUser.given_name ?? existing.first_name,
                    last_name: ssoUser.family_name ?? existing.last_name,
                });
                const revived = await userRepo.save(existing);
                await this.grantDefaultRole(manager, revived.id, role.id);
                isNewUser = true;
                return revived;
            }

            if (existing) {
                if (existing.sso_id && existing.sso_id !== ssoUser.sub) {
                    throw new BadRequestException(
                        'Email is linked to another SSO account',
                    );
                }
                existing.sso_id = ssoUser.sub;
                existing.auth_provider = AuthProvider.SSO;
                if (ssoUser.email_verified) existing.email_verified = true;
                return await userRepo.save(existing);
            }

            if (dto.mode === 'login')
                throw new BadRequestException('User not found');

            const role = await this.defaultRole(manager);
            const created = await userRepo.save(
                userRepo.create({
                    sex_id: 1,
                    name_kh: '',
                    name_en: ssoUser.name || email || ssoUser.sub,
                    phone: null,
                    email,
                    password: null,
                    is_active: role.id,
                    auth_provider: AuthProvider.SSO,
                    sso_id: ssoUser.sub,
                    email_verified: ssoUser.email_verified,
                    first_name: ssoUser.given_name,
                    last_name: ssoUser.family_name,
                }),
            );
            await this.grantDefaultRole(manager, created.id, role.id);
            isNewUser = true;
            return created;
        });

        const response = await this.authSessionService.createLoginResponse(
            user,
            req,
            {
                device_id: dto.device_id,
                login_method: LOGIN_METHOD_SSO,
                create_history: true,
            },
        );

        return { ...response, is_new_user: isNewUser };
    }

    private async defaultRole(manager: EntityManager): Promise<Role> {
        const role = await manager
            .getRepository(Role)
            .findOne({ where: { slug: 'user' } });
        if (!role) throw new BadRequestException('Default User role not found');
        return role;
    }

    private async grantDefaultRole(
        manager: EntityManager,
        userId: number,
        roleId: number,
    ): Promise<void> {
        const repo = manager.getRepository(UserRole);
        const existing = await repo.findOne({
            where: { user_id: userId, role_id: roleId, organization_id: IsNull() },
            withDeleted: true,
        });
        if (existing) {
            existing.deleted_at = null;
            existing.is_default = true;
            await repo.save(existing);
            return;
        }
        await repo.save({
            user_id: userId,
            role_id: roleId,
            organization_id: null,
            is_default: true,
        });
    }

    /**
     * Verify a CDC SSO (Keycloak) access token: RS256 signature against the
     * realm public key, issuer match, and audience/authorized-party check.
     */
    async verifyAccessToken(accessToken: string): Promise<VerifiedSsoUser> {
        const issuer = appConfig.AUTH.SSO_ISSUER_URL;
        if (!issuer)
            throw new UnauthorizedException('SSO is not configured');

        const pem = await this.getRealmPublicKey(issuer);

        let claims: KeycloakTokenClaims;
        try {
            claims = jwt.verify(accessToken, pem, {
                algorithms: ['RS256'],
                issuer,
            }) as KeycloakTokenClaims;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                throw new UnauthorizedException('SSO token is expired');
            throw new UnauthorizedException('Invalid or expired SSO token');
        }

        // The token must be intended for us: accept if the authorized party
        // (azp) or any audience matches an allowed client id.
        const allowed = appConfig.AUTH.SSO_ALLOWED_AUD;
        if (allowed.length) {
            const auds = Array.isArray(claims.aud)
                ? claims.aud
                : claims.aud
                  ? [claims.aud]
                  : [];
            const parties = [claims.azp, ...auds].filter(Boolean) as string[];
            const ok = parties.some((p) => allowed.includes(p));
            if (!ok)
                throw new UnauthorizedException('SSO token audience mismatch');
        }

        if (!claims.sub)
            throw new UnauthorizedException('SSO token missing subject');

        return {
            sub: claims.sub,
            email: claims.email?.trim().toLowerCase() ?? null,
            email_verified: claims.email_verified === true,
            name:
                claims.name?.trim() ||
                claims.preferred_username?.trim() ||
                null,
            given_name: claims.given_name?.trim() || null,
            family_name: claims.family_name?.trim() || null,
        };
    }

    /**
     * Fetch and cache the realm's RS256 public key (PEM) from the issuer's
     * realm endpoint, which returns `{ public_key: "<base64 DER>" }`.
     */
    private async getRealmPublicKey(issuer: string): Promise<string> {
        const now = Date.now();
        if (this.cachedKey && now - this.cachedKey.at < PUBLIC_KEY_TTL_MS)
            return this.cachedKey.pem;

        let raw: string | undefined;
        try {
            const res = await fetch(issuer, {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const body = (await res.json()) as { public_key?: string };
                raw = body.public_key;
            }
        } catch {
            // fall through to the error below
        }
        if (!raw)
            throw new UnauthorizedException(
                'Could not fetch SSO signing key',
            );

        const pem =
            '-----BEGIN PUBLIC KEY-----\n' +
            raw.replace(/(.{64})/g, '$1\n').replace(/\n$/, '') +
            '\n-----END PUBLIC KEY-----';
        this.cachedKey = { pem, at: now };
        return pem;
    }
}
