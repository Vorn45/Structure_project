// ===========================================================================>> Core Library
import { UnauthorizedException } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { createHash } from 'crypto';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { UserRefreshToken } from 'src/app/model/user/user-refresh-token.entity';
import { UserSessions } from 'src/app/model/user/user_sessions.entity';
import { RefreshTokenService } from './refresh-token.service';

// ======================================= >> Code Starts Here << ========================== //
const user = {
    id: 7,
    is_active: 3,
    organization_id: '11111111-1111-4111-8111-111111111111',
} as UserPayload;

const session = {
    id: 11,
    user_id: 7,
    is_active: true,
    logged_out_at: null,
    device: { device_id: 'browser-1' },
} as UserSessions;

function buildService(stored?: Partial<UserRefreshToken> | null) {
    const execute = jest.fn().mockResolvedValue({ affected: 1 });
    const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute,
    };
    const tokenRepo = {
        create: jest.fn((row) => row),
        save: jest.fn((row) => Promise.resolve({ id: 'new-token', ...row })),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(stored ?? null),
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const sessionRepo = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    return {
        service: new RefreshTokenService(tokenRepo as any, sessionRepo as any),
        tokenRepo,
        sessionRepo,
        execute,
    };
}

describe('RefreshTokenService', () => {
    it('issues a short opaque token and stores only its digest', async () => {
        const { service, tokenRepo } = buildService();

        const rawToken = await service.issue(session, user);

        expect(rawToken).toMatch(/^pms_rt_[A-Za-z0-9_-]{43}$/);
        const saved = tokenRepo.save.mock.calls[0][0];
        expect(saved.token_hash).toBe(
            createHash('sha256').update(rawToken).digest('hex'),
        );
        expect(JSON.stringify(saved)).not.toContain(rawToken);
    });

    it('rotates a valid token and marks the old token used', async () => {
        const rawToken = 'pms_rt_' + 'a'.repeat(43);
        const stored = {
            id: 'old-token',
            user_id: 7,
            user_session_id: 11,
            family_id: '22222222-2222-4222-8222-222222222222',
            token_hash: createHash('sha256').update(rawToken).digest('hex'),
            active_role_id: 3,
            active_organization_id: user.organization_id,
            expires_at: new Date(Date.now() + 60_000),
            idle_expires_at: new Date(Date.now() + 60_000),
            used_at: null,
            revoked_at: null,
            user: { id: 7, deleted_at: null },
            session,
        } as Partial<UserRefreshToken>;
        const { service, execute } = buildService(stored);

        const result = await service.rotate(rawToken);

        expect(execute).toHaveBeenCalled();
        expect(result.refreshToken).toMatch(/^pms_rt_/);
        expect(result.refreshToken).not.toBe(rawToken);
    });

    it('revokes the token family and session when reuse is detected', async () => {
        const rawToken = 'pms_rt_' + 'b'.repeat(43);
        const stored = {
            id: 'used-token',
            user_id: 7,
            user_session_id: 11,
            family_id: '33333333-3333-4333-8333-333333333333',
            expires_at: new Date(Date.now() + 60_000),
            idle_expires_at: new Date(Date.now() + 60_000),
            used_at: new Date(),
            revoked_at: null,
            user: { id: 7, deleted_at: null },
            session,
        } as Partial<UserRefreshToken>;
        const { service, tokenRepo, sessionRepo } = buildService(stored);

        await expect(service.rotate(rawToken)).rejects.toThrow(
            UnauthorizedException,
        );
        expect(tokenRepo.update).toHaveBeenCalledWith(
            expect.objectContaining({ family_id: stored.family_id }),
            expect.objectContaining({ revoked_at: expect.any(Date) }),
        );
        expect(sessionRepo.update).toHaveBeenCalledWith(
            { id: session.id },
            expect.objectContaining({ is_active: false }),
        );
    });
});
