const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const botToken =
    process.env.TELEGRAM_BOT_TASK_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    '8680838714:AAHCMGOEmtoVZxzSUD9nxHrew0BazYGshXQ';

// Real Telegram user IDs
const targetChatIds = ['1495035256', '8836877586'];

const frontendUrl = 'https://wms.digitechkh.site';

console.log('🤖 Telegram Real WFM Interactive Menu Dispatcher');
console.log('--------------------------------------------------');

const welcomeText = `👋 <b>សូមស្វាគមន៍មកកាន់ មជ្ឈមណ្ឌលប្រព័ន្ធគ្រប់គ្រងការងារ WFM!</b>
<i>Welcome to WFM Workforce Management System!</i>

សូមជ្រើសរើសមុខងារខាងក្រោមដើម្បីបើកប្រព័ន្ធ Mini App ដោយផ្ទាល់៖
<i>Please choose a feature below to open directly in Mini App:</i>`;

const payloadMenu = {
    text: welcomeText,
    parse_mode: 'HTML',
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '🚀 បើកប្រព័ន្ធ WFM Mini App',
                    web_app: { url: `${frontendUrl}/mini-app` }
                }
            ],
            [
                {
                    text: '🕒 វត្តមាន & QR Code',
                    web_app: { url: `${frontendUrl}/mini-app?tab=attendance` }
                },
                {
                    text: '📁 គម្រោង & កិច្ចការងារ',
                    web_app: { url: `${frontendUrl}/mini-app?tab=tasks` }
                }
            ],
            [
                {
                    text: '🔑 គណនី & ព័ត៌មានផ្ទាល់ខ្លួន',
                    web_app: { url: `${frontendUrl}/mini-app?tab=profile` }
                }
            ]
        ]
    }
};

async function sendMenuTest() {
    for (const chatId of targetChatIds) {
        try {
            const res = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                ...payloadMenu
            });
            console.log(`✅ [Sent to ${chatId}] Menu Message ID: ${res.data?.result?.message_id}`);
        } catch (err) {
            console.error(`❌ [Failed for ${chatId}]:`, err.response?.data?.description || err.message);
        }
    }
}

sendMenuTest();
