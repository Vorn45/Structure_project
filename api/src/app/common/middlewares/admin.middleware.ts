// ===========================================================================>> Core Library
import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { NextFunction, Request, Response } from 'express';

// ===========================================================================>> Custom Library
// > Local
import TokenPayload from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class AdminMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const user = res.locals.user as TokenPayload['user'] | undefined;
        const roles = user?.roles ?? [];
        const isAdmin = roles.some((role) => {
            const slug = role.slug?.toLowerCase();
            const name = role.name_en?.toLowerCase();

            return slug === 'org_admin' || name === 'organization admin';
        });

        if (!isAdmin) {
            throw new ForbiddenException(
                'Organization Admin role is required.',
            );
        }

        next();
    }
}
