// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource }                                       from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jwt         from 'jsonwebtoken';
import jwtConstants     from 'shared/jwt/constants';
import { DataSource, EntityManager, IsNull } from 'typeorm';

// ===========================================================================>> Custom Library
import { AuthProvider }              from 'src/app/enum/pms.enum';
import { appConfig }                 from 'src/app.config';
import { Role }                      from 'src/app/model/user/role.entity';
import { UserRole }                  from 'src/app/model/user/user_role.entity';
import { User }                      from 'src/app/model/user/users.entity';
import { AuthSessionService }        from 'src/app/shared/auth/auth-session.service';
import { GoogleLoginDto }            from './google-login.dto';

// ======================================= >> Code Starts Here << ========================== //
/** How long the sign-up screen may hold a verified Google identity. */
const GOOGLE_REGISTRATION_EXPIRES_IN = '15m';

/** Redeemed by `/auth/signup/complete` to create the account. */
export interface GoogleRegistrationPayload {
    type: 'google-signup';
    email: string;
    google_id: string;
    name_en: string;
    first_name: string | null;
    last_name: string | null;
}

export interface VerifiedGoogleUser {
    sub: string;
    email: string;
    email_verified: true;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
}

@Injectable()
export class GoogleLoginService {
    private readonly googleClient = new OAuth2Client(
        appConfig.AUTH.GOOGLE_CLIENT_ID,
    );

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly authSessionService: AuthSessionService,
    ) {}

    async login(dto: GoogleLoginDto, req: Request) {
        const googleUser = await this.verifyAccessToken(dto.access_token);
        const email = googleUser.email.trim().toLowerCase();

        // Signing up creates nothing yet: the account is written when the
        // details screen is submitted, so abandoning that screen leaves no
        // half-made account behind.
        if (dto.mode === 'signup') {
            const pending = await this.pendingSignUp(googleUser, email);
            if (pending) return pending;
        }

        let isNewUser = false;

        const user = await this.dataSource.transaction(async (manager) => {
            const userRepo = manager.getRepository(User);
            let existing = await userRepo.findOne({
                where: { google_id: googleUser.sub },
                withDeleted: true,
                relations: ['avatar_file'],
            });

            if (!existing) {
                existing = await userRepo
                    .createQueryBuilder('user')
                    .withDeleted()
                    .leftJoinAndSelect('user.avatar_file', 'avatar_file')
                    .where('LOWER(user.email) = :email', { email })
                    .getOne();
            }

           
            if (existing?.deleted_at) {
                if (dto.mode === 'login')
                    throw new BadRequestException(
                        'This account has been deleted',
                    );

                const role = await this.defaultRole(manager);

                userRepo.merge(existing, {
                    deleted_at: null,
                    sex_id: 1,
                    name_kh: '',
                    name_en: googleUser.name?.trim() || email,
                    phone: null,
                    email,
                    password: null,
                    avatar_id: null,
                    is_active: role.id,
                    auth_provider: AuthProvider.GOOGLE,
                    google_id: googleUser.sub,
                    email_verified: true,
                    first_name: googleUser.given_name?.trim() || null,
                    last_name: googleUser.family_name?.trim() || null,
                });

                const revived = await userRepo.save(existing);
                await this.grantDefaultRole(manager, revived.id, role.id);
                isNewUser = true;

                return revived;
            }

            if (existing) {
                if (
                    existing.google_id &&
                    existing.google_id !== googleUser.sub
                ) {
                    throw new BadRequestException(
                        'Email is linked to another Google account',
                    );
                }

                existing.google_id = googleUser.sub;
                existing.email_verified = true;
                existing.auth_provider = AuthProvider.GOOGLE;
                return await userRepo.save(existing);
            }
            if (dto.mode === 'login')
                throw new BadRequestException('User not found');

            const role = await this.defaultRole(manager);

            const created = await userRepo.save(
                userRepo.create({
                    sex_id: 1,
                    name_kh: '',
                    name_en: googleUser.name?.trim() || email,
                    phone: null,
                    email,
                    password: null,
                    is_active: role.id,
                    auth_provider: AuthProvider.GOOGLE,
                    google_id: googleUser.sub,
                    email_verified: true,
                    first_name: googleUser.given_name?.trim() || null,
                    last_name: googleUser.family_name?.trim() || null,
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
                login_method: 2,
                create_history: true,
            },
        );

        return { ...response, is_new_user: isNewUser };
    }

    /**
     * Answers the sign-up screen for a Google address that has no live account
     * yet: nothing is written, and the verified identity travels back in a
     * short lived token that `/auth/signup/complete` redeems. Returns null when
     * the address already belongs to someone, so the caller signs them in.
     */
    private async pendingSignUp(googleUser: VerifiedGoogleUser, email: string) {
        const userRepo = this.dataSource.getRepository(User);

        const byGoogleId = await userRepo.findOne({
            where: { google_id: googleUser.sub },
        });
        const existing =
            byGoogleId ??
            (await userRepo
                .createQueryBuilder('user')
                .where('LOWER(user.email) = :email', { email })
                .getOne());

        if (existing && (await this.isRegistered(existing))) return null;

        const payload: GoogleRegistrationPayload = {
            type: 'google-signup',
            email,
            google_id: googleUser.sub,
            name_en: googleUser.name?.trim() || email,
            first_name: googleUser.given_name?.trim() || null,
            last_name: googleUser.family_name?.trim() || null,
        };

        return {
            status_code: 200,
            is_new_user: true,
            email,
            name_en: payload.name_en,
            registration_token: jwt.sign(payload, jwtConstants.secret, {
                expiresIn: GOOGLE_REGISTRATION_EXPIRES_IN,
            }),
            message: 'Google account verified',
        };
    }
    private async isRegistered(user: User): Promise<boolean> {
        if (user.deleted_at) return false;
        if (user.password || user.google_id || user.telegram_id) return true;

        const role = await this.dataSource
            .getRepository(UserRole)
            .findOne({ where: { user_id: user.id } });

        return !!role;
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

    /** Public so other flows (invitation sign-up) can trust the same check. */
    async verifyAccessToken(
        accessToken: string,
    ): Promise<VerifiedGoogleUser> {
        if (!appConfig.AUTH.GOOGLE_CLIENT_ID)
            throw new UnauthorizedException(
                'Google authentication is not configured',
            );

        try {
            // 1) Validate the token and, crucially, that it was issued to *our*
            //    client (audience check prevents a token minted for another app).
            const info = await this.googleClient.getTokenInfo(accessToken);
            if (info.aud !== appConfig.AUTH.GOOGLE_CLIENT_ID)
                throw new UnauthorizedException('Google token audience mismatch');
            if (!info.sub || !info.email || !info.email_verified)
                throw new UnauthorizedException(
                    'Google account email is not verified',
                );

            // 2) Fetch the profile (name/picture) from the userinfo endpoint.
            const profile = await this.fetchGoogleProfile(accessToken);

            return {
                sub: info.sub,
                email: info.email,
                email_verified: true,
                given_name: profile.given_name,
                family_name: profile.family_name,
                name: profile.name,
                picture: profile.picture,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException('Invalid or expired Google token');
        }
    }

    private async fetchGoogleProfile(accessToken: string): Promise<{
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
    }> {
        const res = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) return {};
        return (await res.json()) as {
            name?: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
        };
    }
}
