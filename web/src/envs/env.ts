const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

const FILE_BASE_URL =
    process.env.FILE_BASE_URL || 'https://file-v4-api.uat.camcyber.com';

export const env = {
    production: !isLocal,
    APP_VERSION: require('../../package.json').version,

    API_BASE_URL:
        process.env.API_BASE_URL ||
        (isLocal ? 'http://localhost:3000/api' : 'https://structure-project.onrender.com/api'),
    FILE_BASE_URL: FILE_BASE_URL,
    SOCKET_URL:
        process.env.SOCKET_URL ||
        (isLocal ? 'http://localhost:3000' : 'https://structure-project.onrender.com'),
    GOOGLE_CLIENT_ID:
        process.env.GOOGLE_CLIENT_ID ||
        '54356070191-kacqa35o9tefnughhdgi5b6jkhshso2c.apps.googleusercontent.com',
    // CDC SSO (Keycloak). SSO_AUTH_URL is the realm base, e.g.
    // http://localhost:1012/realms/auth ; SSO_CLIENT_ID is the Keycloak client
    // the PMS web app logs in with. Empty disables the SSO button.
    SSO_AUTH_URL: process.env.SSO_AUTH_URL || '',
    SSO_CLIENT_ID: process.env.SSO_CLIENT_ID || '',
    WEB_BASE_URL: FILE_BASE_URL + '/',
};
