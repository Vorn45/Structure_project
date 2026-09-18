import { SetMetadata } from '@nestjs/common';
import { RoleEnum, RoleSlug } from 'src/app/enum/role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: (RoleEnum | RoleSlug | string)[]) =>
    SetMetadata(ROLES_KEY, roles);

