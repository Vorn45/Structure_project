// ===========================================================================>> Core Library
import { Injectable, NestMiddleware, UnauthorizedException, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { NextFunction, Request, Response } from 'express';
import * as jwt                            from 'jsonwebtoken';
import jwtConstants                        from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
// > Local
import { RoleEnum } from 'src/app/enum/role.enum';
import TokenPayload from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class JwtMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const authorizationHeader = req.headers.authorization;
        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith('Bearer ')
        ) {
            throw new UnauthorizedException(
                'Authorization token is missing or not in the correct format.',
            );
        }

        const token = authorizationHeader.split('Bearer ')[1];

        try {
            // Verify and decode the JWT
            const payload = jwt.verify(
                token,
                jwtConstants.secret,
            ) as TokenPayload;
            // Extract roles from the payload and check for a default role
            const userRoles = payload.user.roles;

            if (userRoles.length == 0) {
                throw new UnauthorizedException(
                    'User does not have any valid roles.',
                );
            }

            res.locals.user = payload.user;
            next();
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException(
                    'Authorization token is expired.',
                );
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException(
                    'Authorization token is invalid.',
                );
            } else {
                throw new UnauthorizedException(
                    'Authorization token is invalid.',
                );
            }
        }
    }
}
