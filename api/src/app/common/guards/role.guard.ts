// ===========================================================================>> Core Library
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { Reflector }                                                                             from '@nestjs/core';

// ===========================================================================>> Third Party Library
import * as jwt     from 'jsonwebtoken';
import jwtConstants from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
// > Local
import { ROLES_KEY }                 from 'src/app/common/decorators/roles.decorator';
import { RoleEnum }                  from 'src/app/enum/role.enum';
import TokenPayload, { UserPayload } from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<(RoleEnum | string)[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = this.resolveUser(request);

        const roles = Array.isArray(user?.roles) ? user.roles : [];
        if (!roles.length) {
            throw new ForbiddenException('Insufficient role privileges: no roles assigned.');
        }

        const normalizedRequired = requiredRoles.map((r) => {
            if (typeof r === 'number') {
                if (r === RoleEnum.SUPER_ADMIN) return 'superadmin';
                if (r === RoleEnum.ORG_ADMIN) return 'org_admin';
                if (r === RoleEnum.ORG_OWNER) return 'org_owner';
                if (r === RoleEnum.ORG_USER) return 'user';
            }
            return String(r).toLowerCase().trim();
        });

        // User's role identifiers
        const userSlugs = roles.map((r) => (r.slug || '').toLowerCase().trim());
        const userNamesEn = roles.map((r) => (r.name_en || '').toLowerCase().trim());

        // Superadmin has universal administrative access
        const isSuperAdmin =
            userSlugs.includes('superadmin') ||
            userSlugs.includes('super_admin') ||
            userNamesEn.includes('super administrator') ||
            userNamesEn.includes('super admin');

        if (isSuperAdmin) {
            return true;
        }

        // Check for matching role slug or name
        const hasRequiredRole = normalizedRequired.some((req) => {
            if (userSlugs.includes(req)) return true;
            if (userNamesEn.includes(req)) return true;

            // Alias handling: 'admin' and 'org_admin'
            if (req === 'admin' || req === 'org_admin') {
                return (
                    userSlugs.includes('admin') ||
                    userSlugs.includes('org_admin') ||
                    userSlugs.includes('org_owner') ||
                    userNamesEn.includes('administrator') ||
                    userNamesEn.includes('organization admin')
                );
            }
            return false;
        });

        if (!hasRequiredRole) {
            throw new ForbiddenException('Insufficient role privileges.');
        }

        return true;
    }

    private resolveUser(request: any): UserPayload {
        const fromMiddleware = request.res?.locals?.user as
            | UserPayload
            | undefined;
        if (fromMiddleware) return fromMiddleware;

        const authHeader: string | undefined = request.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException(
                'Authorization token is missing or not in the correct format.',
            );
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            const payload = jwt.verify(
                token,
                jwtConstants.secret,
            ) as TokenPayload;
            return payload.user;
        } catch {
            throw new UnauthorizedException('Invalid or expired token.');
        }
    }
}
