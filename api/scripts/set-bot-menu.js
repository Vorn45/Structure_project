const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const botToken =
    process.env.TELEGRAM_BOT_TASK_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    '8680838714:AAHCMGOEmtoVZxzSUD9nxHrew0BazYGshXQ';

const miniAppUrl = 'https://wms.digitechkh.site/mini-app';

console.log('🤖 Updating Telegram Bot Menu Button...');

const payload = {
    menu_button: {
        type: 'web_app',
        text: 'WFM App',
        web_app: {
            url: miniAppUrl
        }
    }
};

axios
    .post(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, payload)
    .then((res) => {
        console.log('✅ Success! Bot Menu Button updated to:', miniAppUrl);
        console.log('Telegram API Response:', res.data);
    })
    .catch((err) => {
        console.error('❌ Error updating menu button:', err.response?.data || err.message);
    });
