import { User } from "app/core/user/user.types";

export interface UserPayload {
    exp: number;
    iat: number;
    user: User
}
