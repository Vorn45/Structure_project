import { config } from 'dotenv';
import { EnvironmentPlugin } from 'webpack';
config();

module.exports = {
    plugins: [
        new EnvironmentPlugin({
            API_BASE_URL: 'http://localhost:3000/api',
            FILE_BASE_URL: 'https://file-v4-api.uat.camcyber.com',
            SOCKET_URL: 'http://localhost:3000',
            GOOGLE_CLIENT_ID: '54356070191-kacqa35o9tefnughhdgi5b6jkhshso2c.apps.googleusercontent.com',
            SSO_AUTH_URL: '',
            SSO_CLIENT_ID: '',
        })
    ]
}
