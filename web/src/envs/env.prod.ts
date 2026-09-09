const isBrowser = typeof window !== 'undefined';
const origin = isBrowser ? window.location.origin : '';

export const env = {
    production: true,
    APP_VERSION: '1.0.0',
    API_BASE_URL: origin ? `${origin}/api` : '/api',
    FILE_BASE_URL: 'https://file-v4-api.uat.camcyber.com',
    SOCKET_URL: origin ? origin : '',
    GOOGLE_CLIENT_ID:
        '54356070191-kacqa35o9tefnughhdgi5b6jkhshso2c.apps.googleusercontent.com',
    SSO_AUTH_URL: '',
    SSO_CLIENT_ID: '',
    WEB_BASE_URL: 'https://file-v4-api.uat.camcyber.com/',
};
