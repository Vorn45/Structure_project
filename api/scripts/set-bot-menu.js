const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const botTokens = [
    '8884371111:AAG3DkDG61rKvCbOFrl88FQ4nNNS-8XzzZI',
    '8680838714:AAHCMGOEmtoVZxzSUD9nxHrew0BazYGshXQ'
];

const miniAppUrl = 'https://wms.digitechkh.site/?app=wfm_web';

console.log('🤖 Updating Telegram Bot Menu Buttons...');

const payload = {
    menu_button: {
        type: 'web_app',
        text: 'WFM Web',
        web_app: {
            url: miniAppUrl
        }
    }
};

async function updateAll() {
    for (const token of botTokens) {
        try {
            const res = await axios.post(`https://api.telegram.org/bot${token}/setChatMenuButton`, payload);
            console.log(`✅ Success for bot token ...${token.slice(-8)}: Menu Button updated to: ${miniAppUrl}`);
        } catch (err) {
            console.error(`❌ Error updating menu button for ...${token.slice(-8)}:`, err.response?.data || err.message);
        }
    }
}

updateAll();
