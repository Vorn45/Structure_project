
import * as jwt from 'jsonwebtoken';
import jwtConstants from './constants';

export abstract class TokenGenerator {
    protected readonly secret: string;
    protected readonly expiresIn: string | number;

    constructor(secret: string, expiresIn: string | number) {
        this.secret = secret;
        this.expiresIn = expiresIn;
    }

    // Abstract method to be implemented by subclasses for generating a token
    abstract getToken(user: any): string;
}

// Concrete implementation of TokenGenerator for JWT
export class JwtTokenGenerator extends TokenGenerator {
    constructor(secret: string = jwtConstants.secret, expiresIn: string | number = jwtConstants.expiresIn) {
        super(secret, expiresIn);
    }

    // Generates a JWT token for a given user
    public override getToken(user: any): string {
        return jwt.sign({
            user: {
                id: user.id,
                kh_name: user.kh_name,
                phone: user.phone,
                email: user.email,
                avatar: user.avatar,
                created_at: user.created_at,
                // roles: user.roles.map(v => ({
                //     id: v.id,
                //     name: v.name,
                //     slug: v.slug,
                //     is_default: v['UserRoles'].is_default
                // }))
            }

        }, this.secret, { expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'] });
    }
}
