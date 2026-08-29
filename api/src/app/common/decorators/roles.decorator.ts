// ===========================================================================>> Core Library
import { SetMetadata } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { RoleEnum } from 'src/app/enum/role.enum';

// ======================================= >> Code Starts Here << ========================== //
export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
