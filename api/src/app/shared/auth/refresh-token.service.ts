// ===========================================================================>> Core Library
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { createHash, randomBytes, randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { appConfig } from 'src/app.config';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { UserRefreshToken } from 'src/app/model/user/user-refresh-token.entity';
import { UserSessions } from 'src/app/model/user/user_sessions.entity';

// ======================================= >> Code Starts Here << ========================== //
const TOKEN_PREFIX = 'pms_rt_';
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectRepository(UserRefreshToken)
        private readonly tokenRepo: Repository<UserRefreshToken>,
        @InjectRepository(UserSessions)
        private readonly sessionRepo: Repository<UserSessions>,
    ) {}

    isOpaqueToken(token: string | undefined): boolean {
        return !!token?.startsWith(TOKEN_PREFIX);
    }

    async issue(session: UserSessions, user: UserPayload): Promise<string> {
        const now = new Date();
        const expiresAt = new Date(
            now.getTime() + appConfig.AUTH.REFRESH_TOKEN_ABSOLUTE_DAYS * DAY_MS,
        );

        await this.tokenRepo.update(
            {
                user_session_id: session.id,
                revoked_at: IsNull(),
                used_at: IsNull(),
            },
            { revoked_at: now },
        );

        return await this.createToken(
            session,
            user,
            randomUUID(),
            expiresAt,
            now,
        );
    }

    async rotate(rawToken: string) {
        if (!this.isOpaqueToken(rawToken)) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const stored = await this.tokenRepo.findOne({
            where: { token_hash: this.hash(rawToken) },
            relations: ['user', 'session', 'session.device'],
        });
        if (!stored) throw new UnauthorizedException('Invalid refresh token');

        const now = new Date();
        if (stored.used_at || stored.revoked_at) {
            await this.revokeFamily(
                stored.family_id,
                stored.user_session_id,
                now,
            );
            throw new UnauthorizedException('Refresh token reuse detected');
        }

        if (
            !stored.user ||
            stored.user.deleted_at ||
            !stored.session?.is_active ||
            stored.session.logged_out_at ||
            stored.expires_at <= now ||
            stored.idle_expires_at <= now
        ) {
            await this.revokeFamily(
                stored.family_id,
                stored.user_session_id,
                now,
            );
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const consumed = await this.tokenRepo
            .createQueryBuilder()
            .update(UserRefreshToken)
            .set({ used_at: now })
            .where('id = :id', { id: stored.id })
            .andWhere('used_at IS NULL')
            .andWhere('revoked_at IS NULL')
            .execute();

        if (!consumed.affected) {
            await this.revokeFamily(
                stored.family_id,
                stored.user_session_id,
                now,
            );
            throw new UnauthorizedException('Refresh token reuse detected');
        }

        const user = {
            id: stored.user_id,
            is_active: stored.active_role_id,
            organization_id: stored.active_organization_id,
        } as UserPayload;
        const refreshToken = await this.createToken(
            stored.session,
            user,
            stored.family_id,
            stored.expires_at,
            now,
        );

        return { refreshToken, stored, session: stored.session };
    }

    async updateContext(user: UserPayload): Promise<void> {
        if (!user.session_id) return;

        await this.tokenRepo.update(
            {
                user_id: user.id,
                user_session_id: user.session_id,
                revoked_at: IsNull(),
                used_at: IsNull(),
            },
            {
                active_role_id: user.is_active,
                active_organization_id: user.organization_id ?? null,
            },
        );
    }

    async revokeSession(userId: number, sessionId?: number): Promise<void> {
        if (!sessionId) return;
        const now = new Date();

        await Promise.all([
            this.tokenRepo.update(
                {
                    user_id: userId,
                    user_session_id: sessionId,
                    revoked_at: IsNull(),
                },
                { revoked_at: now },
            ),
            this.sessionRepo.update(
                { id: sessionId, user_id: userId },
                { is_active: false, logged_out_at: now, last_activity_at: now },
            ),
        ]);
    }

    /** Cuts off every device/session a user is currently logged in on — used
     *  when an admin deletes the account, since a stale access JWT keeps
     *  working (signature-only checks) until it naturally expires otherwise. */
    async revokeAllForUser(userId: number): Promise<void> {
        const now = new Date();

        await Promise.all([
            this.tokenRepo.update(
                { user_id: userId, revoked_at: IsNull() },
                { revoked_at: now },
            ),
            this.sessionRepo.update(
                { user_id: userId, is_active: true },
                { is_active: false, logged_out_at: now, last_activity_at: now },
            ),
        ]);
    }

    private async createToken(
        session: UserSessions,
        user: UserPayload,
        familyId: string,
        expiresAt: Date,
        now: Date,
    ): Promise<string> {
        const rawToken = TOKEN_PREFIX + randomBytes(32).toString('base64url');
        const idleExpiresAt = new Date(
            Math.min(
                expiresAt.getTime(),
                now.getTime() + appConfig.AUTH.REFRESH_TOKEN_IDLE_DAYS * DAY_MS,
            ),
        );

        await this.tokenRepo.save(
            this.tokenRepo.create({
                user_id: user.id,
                user_session_id: session.id,
                family_id: familyId,
                token_hash: this.hash(rawToken),
                active_role_id: user.is_active ?? null,
                active_organization_id: user.organization_id ?? null,
                expires_at: expiresAt,
                idle_expires_at: idleExpiresAt,
            }),
        );

        return rawToken;
    }

    private async revokeFamily(
        familyId: string,
        sessionId: number,
        now: Date,
    ): Promise<void> {
        await Promise.all([
            this.tokenRepo.update(
                { family_id: familyId, revoked_at: IsNull() },
                { revoked_at: now },
            ),
            this.sessionRepo.update(
                { id: sessionId },
                { is_active: false, logged_out_at: now, last_activity_at: now },
            ),
        ]);
    }

    private hash(rawToken: string): string {
        return createHash('sha256').update(rawToken).digest('hex');
    }
}
