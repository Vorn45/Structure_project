// ===========================================================================>> Third Party Library
import { EntityManager } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { UserRole } from 'src/app/model/user/user_role.entity';
import { User } from 'src/app/model/user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
export function registeredAccountCondition(alias = 'user'): string {
    const user = `"${alias}"`;

    return `(${user}.password IS NOT NULL
        OR ${user}.google_id IS NOT NULL
        OR ${user}.telegram_id IS NOT NULL
        OR EXISTS (
            SELECT 1
            FROM "user"."user_role" registered_account_role
            WHERE registered_account_role.user_id = ${user}.id
              AND registered_account_role.deleted_at IS NULL
        ))`;
}
export async function isRegisteredAccount(
    manager: EntityManager,
    user: User | null | undefined,
): Promise<boolean> {
    if (!user || user.deleted_at) return false;
    if (user.password || user.google_id || user.telegram_id) return true;

    const role = await manager
        .getRepository(UserRole)
        .findOne({ where: { user_id: user.id } });

    return !!role;
}
