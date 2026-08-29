class GlobalConstants {
    static info(arg0: string, info: any) {
        throw new Error('Method not implemented.');
    }
    //Message
    public static genericError: string = 'Something went wrong. Please try again later';
    public static genericResponse: string = 'Your request has been processed successfully';

    //Auth messages (Khmer)
    public static invalidCredentials: string = 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ';
    public static otpSendFailed: string = 'មិនអាចផ្ញើលេខកូដ OTP បានទេ សូមព្យាយាមម្តងទៀត';
    public static googleSignInFailed: string = 'មិនអាចចូលប្រព័ន្ធតាមរយៈ Google បានទេ សូមព្យាយាមម្តងទៀត';
    public static googleSignInNotConfigured: string = 'មុខងារចូលប្រព័ន្ធតាមរយៈ Google មិនទាន់អាចប្រើប្រាស់បានទេ';
    public static googleSignInEmailLinked: string = 'អ៊ីមែលនេះត្រូវបានភ្ជាប់ជាមួយគណនី Google ផ្សេងរួចហើយ';
    public static googleSignInEmailNotVerified: string = 'អ៊ីមែល Google របស់អ្នកមិនទាន់បានផ្ទៀងផ្ទាត់';
    public static googleSignInUserNotFound: string = 'អ្នកមិនទាន់មានគណនីនៅឡើយទេ';
    public static googleAccountDeleted: string = 'គណនីនេះត្រូវបានលុបចោលរួចហើយ';
    public static googleSignUpFailed: string = 'មិនអាចចុះឈ្មោះតាមរយៈ Google បានទេ សូមព្យាយាមម្តងទៀត';
    public static googleAccountExists: string = 'អ៊ីមែលនេះមានគណនីរួចហើយ សូមចូលប្រព័ន្ធ';
    public static invalidOtp: string = 'លេខកូដមិនត្រឹមត្រូវ ឬបានផុតកំណត់';
    public static signUpFailed: string = 'មិនអាចបង្កើតគណនីបានទេ សូមព្យាយាមម្តងទៀត';


    private static authErrors: Record<string, string> = {
        'Email is already registered'                    : 'អ៊ីមែលនេះមានគណនីរួចហើយ',
        'Phone number is already used by another account': 'លេខទូរស័ព្ទនេះត្រូវបានប្រើដោយគណនីផ្សេងរួចហើយ',
        'Phone and email belong to different users'      : 'លេខទូរស័ព្ទ និងអ៊ីមែលមិនមែនជារបស់គណនីតែមួយទេ',
        'Registration session expired, please start again': 'សម័យចុះឈ្មោះបានផុតកំណត់ សូមចាប់ផ្តើមម្តងទៀត',
        'Invalid registration token'                     : 'សម័យចុះឈ្មោះមិនត្រឹមត្រូវ សូមចាប់ផ្តើមម្តងទៀត',
        'Invalid signup token'                           : 'សម័យចុះឈ្មោះមិនត្រឹមត្រូវ សូមចាប់ផ្តើមម្តងទៀត',
        'Passwords do not match'                         : 'ពាក្យសម្ងាត់មិនដូចគ្នា',
        'Invalid OTP'                                    : 'លេខកូដមិនត្រឹមត្រូវ ឬបានផុតកំណត់',
        'OTP expired'                                    : 'លេខកូដបានផុតកំណត់ សូមស្នើសុំលេខកូដថ្មី',
        'Could not send the verification code'           : 'មិនអាចផ្ញើលេខកូដ OTP បានទេ សូមព្យាយាមម្តងទៀត',
        'User not found'                                 : 'រកមិនឃើញគណនីនេះទេ',
        'This account has been deleted'                  : 'គណនីនេះត្រូវបានលុបចោលរួចហើយ',
        'Email is linked to another Google account'      : 'អ៊ីមែលនេះត្រូវបានភ្ជាប់ជាមួយគណនី Google ផ្សេងរួចហើយ',
        'Google account email is not verified'           : 'អ៊ីមែល Google របស់អ្នកមិនទាន់បានផ្ទៀងផ្ទាត់',
        'Default User role not found'                    : 'ប្រព័ន្ធមិនទាន់បានកំណត់តួនាទីអ្នកប្រើប្រាស់ទេ',
    };
    public static authError(message: string | undefined, fallback: string): string {
        if (!message) return fallback;

        return GlobalConstants.authErrors[message] ?? fallback;
    }

    //Regex
    public static emailRegex: string = '[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}';
    public static phoneRegex: string = '/^(\+855|0)[1-9]\d{7,8}$/';
    public static khmerRegex: string = '^[\u1780-\u17FF\u19E0-\u19FF\u0020\u200B\s]+$';

    //Error
    public static error: string = 'error';

    //Success
    public static success: string = 'success';

    //Auth
    public static unauthorized: string = 'You are not authorize person to access this page';
}

export default GlobalConstants;
