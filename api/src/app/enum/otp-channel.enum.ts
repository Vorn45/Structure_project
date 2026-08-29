export enum OtpChannel {
    PHONE = 'phone',
    TELEGRAM = 'telegram',
    EMAIL = 'email',
    AUTHENTICATOR = 'authenticator',
}

export enum OtpPurpose {
    LOGIN = 'login',
    FORGOT_PASSWORD = 'forgot_password',
    SIGNUP = 'signup',
    CHANGE_PHONE = 'change_phone',
    CHANGE_EMAIL = 'change_email',
    VERIFY_CHANNEL = 'verify_channel',
    RESET_PASSCODE = 'reset_passcode',
}
