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
        const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = this.resolveUser(request);

        if (!requiredRoles.includes(user.is_active as RoleEnum)) {
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
