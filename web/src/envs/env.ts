const isBrowser = typeof window !== 'undefined';
const isLocalhost =
    isBrowser &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');
const isDevServer = isLocalhost && window.location.port === '4200';
const origin = isBrowser ? window.location.origin : '';

const FILE_BASE_URL = 'https://file-v4-api.uat.camcyber.com';

export const env = {
    production: !isDevServer,
    APP_VERSION: '1.0.0',
    API_BASE_URL: isDevServer ? 'http://localhost:3000/api' : (origin ? `${origin}/api` : '/api'),
    FILE_BASE_URL: FILE_BASE_URL,
    SOCKET_URL: isDevServer ? 'http://localhost:3000' : (origin ? origin : ''),
    GOOGLE_CLIENT_ID:
        '54356070191-kacqa35o9tefnughhdgi5b6jkhshso2c.apps.googleusercontent.com',
    SSO_AUTH_URL: '',
    SSO_CLIENT_ID: '',
    WEB_BASE_URL: FILE_BASE_URL + '/',
};
