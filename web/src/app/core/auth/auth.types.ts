import { User } from '../user/user.types';

export interface ResponseLogin {
    token: string;
    message: string;
    user?: User;
    status?: number;
    status_code?: number;
    refresh_token?: string;
    requires_otp?: boolean;
    /** Present when `requires_otp` is true: identifies the OTP challenge already sent. */
    otp_token?: string;
    /** Channel the OTP was actually sent on (e.g. 'telegram', 'email', 'phone'). */
    channel?: string;
    /** Channels enabled for this user's account. */
    channels?: string[];
    /** Google sign-in only: true when this call enrolled the account. */
    is_new_user?: boolean;
    /** Google sign-up only: redeemed by /auth/signup/complete to create it. */
    registration_token?: string;
    /** Google sign-up only: the name to prefill the details form with. */
    name_en?: string;
}

export interface ResponseSuccessfullLogin {
    token: string;
    message: string;
    user: User;
    status?: boolean;
    status_code?: number;
}


/** Answer to steps 1 / 1b of the self sign-up flow. */
export interface SignUpChallenge {
    status_code: number;
    signup_token: string;
    expires_at: string;
    email: string;
    message: string;
}

/** Answer to step 2 of the self sign-up flow. */
export interface SignUpVerification {
    status_code: number;
    email: string;
    registration_token: string;
    message: string;
}

export interface ResponseSingUp {
    status: boolean;
    message: string;
    token: string;
    user?: User;
}
