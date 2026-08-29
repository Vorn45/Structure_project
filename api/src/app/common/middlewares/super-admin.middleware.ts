// ===========================================================================>> Core Library
import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { NextFunction, Request, Response } from 'express';

// ===========================================================================>> Custom Library
// > Local
import TokenPayload from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class SuperAdminMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const user = res.locals.user as TokenPayload['user'] | undefined;
        const roles = user?.roles ?? [];
        const isSuperAdmin = roles.some(
            (role) => role.name_en === 'Super Administrator',
        );

        if (!isSuperAdmin) {
            throw new ForbiddenException(
                'Super Administrator role is required.',
            );
        }

        next();
    }
}
