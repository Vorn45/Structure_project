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
const miniAppUrl = `${frontendUrl}/member/task`;

console.log('🤖 Telegram Real WFM Notification & Menu Dispatcher');
console.log('--------------------------------------------------');

// 1. Task Notification Message
const taskMessageText = `🔄 <b>បានកែប្រែ ឬប្តូរស្ថានភាពការងារទៅ &lt;&lt; កំពុងធ្វើ &gt;&gt;</b>
Role | Sales Manager | V2
Task: <b>[TSK-2026-091] ត្រួតពិនិត្យ និងរៀបចំបញ្ជីទំនិញចូលស្តុក POS</b>
Progress: <b>65%</b>
System: <b>WMS DIGITECHKH</b>`;

const taskPayload = {
    text: taskMessageText,
    parse_mode: 'HTML',
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: 'មើលការងារលើ Web 🔍',
                    web_app: { url: `${frontendUrl}/member/task` }
                }
            ]
        ]
    }
};

// 2. Interactive Menu Message
const menuMessageText = `👋 <b>សូមស្វាគមន៍មកកាន់ មជ្ឈមណ្ឌលប្រព័ន្ធគ្រប់គ្រងការងារ WFM!</b>
<i>Welcome to WFM Workforce Management System!</i>

សូមជ្រើសរើសមុខងារខាងក្រោមដើម្បីបើកប្រព័ន្ធ Web App ដោយផ្ទាល់៖
<i>Please choose a feature below to open directly in Web App:</i>`;

const menuPayload = {
    text: menuMessageText,
    parse_mode: 'HTML',
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '🌐 បើកប្រព័ន្ធ WFM Web',
                    web_app: { url: `${frontendUrl}` }
                }
            ],
            [
                {
                    text: '🕒 វត្តមាន (Attendance)',
                    web_app: { url: `${frontendUrl}/member/home` }
                },
                {
                    text: '📁 កិច្ចការងារ (Tasks)',
                    web_app: { url: `${frontendUrl}/member/task` }
                }
            ],
            [
                {
                    text: '🔑 ព័ត៌មានផ្ទាល់ខ្លួន (Profile)',
                    web_app: { url: `${frontendUrl}/profile` }
                }
            ]
        ]
    }
};

async function dispatchAll() {
    for (const chatId of targetChatIds) {
        try {
            // Send Task notification
            const res1 = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                ...taskPayload
            });
            console.log(`✅ [Sent to ${chatId}] Task Notification Message ID: ${res1.data?.result?.message_id}`);

            // Send Interactive Menu
            const res2 = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                ...menuPayload
            });
            console.log(`✅ [Sent to ${chatId}] Interactive Menu Message ID: ${res2.data?.result?.message_id}`);
        } catch (err) {
            console.error(`❌ [Failed for ${chatId}]:`, err.response?.data?.description || err.message);
        }
    }
}

dispatchAll();
