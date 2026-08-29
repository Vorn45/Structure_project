// Values below are injected at build time by webpack's EnvironmentPlugin
// from the .env file (see webpack.config.ts). Fallbacks keep builds working
// when a variable is not provided.
const FILE_BASE_URL = process.env.FILE_BASE_URL || '';

export const env = {

    production: true,
    APP_VERSION: require('../../package.json').version,

    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
    FILE_BASE_URL: FILE_BASE_URL,
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3000',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    // CDC SSO (Keycloak). SSO_AUTH_URL is the realm base, e.g.
    // http://localhost:1012/realms/auth ; SSO_CLIENT_ID is the Keycloak client
    // the PMS web app logs in with. Empty disables the SSO button.
    SSO_AUTH_URL: process.env.SSO_AUTH_URL || '',
    SSO_CLIENT_ID: process.env.SSO_CLIENT_ID || '',
    WEB_BASE_URL: FILE_BASE_URL + '/'
};
