// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
export function isSuperAdministrator(user?: Partial<UserPayload> | null) {
    return !!user?.roles?.some(
        (role) => role.name_en === 'Super Administrator' || role.name_en === 'super_admin',
    );
}
