const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

const FILE_BASE_URL = 'https://file-v4-api.uat.camcyber.com';

export const env = {
    production: !isLocal,
    APP_VERSION: '1.0.0',
    API_BASE_URL: isLocal ? 'http://localhost:3000/api' : 'https://structure-project.onrender.com/api',
    FILE_BASE_URL: FILE_BASE_URL,
    SOCKET_URL: isLocal ? 'http://localhost:3000' : 'https://structure-project.onrender.com',
    GOOGLE_CLIENT_ID:
        '54356070191-kacqa35o9tefnughhdgi5b6jkhshso2c.apps.googleusercontent.com',
    SSO_AUTH_URL: '',
    SSO_CLIENT_ID: '',
    WEB_BASE_URL: FILE_BASE_URL + '/',
};
