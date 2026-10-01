const https = require("https");

function sendTelegramMessage(topicId, text) {
  const data = JSON.stringify({
    chat_id: "-1004331065291",
    message_thread_id: topicId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    text: text
  });

  const req = https.request({
    hostname: "api.telegram.org",
    path: "/bot8743624319:AAG5B0eitDPCBmUKcCjIan9dYvDF3vKgJmg/sendMessage",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
  }, (res) => {
    res.on("data", d => process.stdout.write(d));
  });

  req.on("error", (e) => console.error(e));
  req.write(data);
  req.end();
}

// Push to API test
sendTelegramMessage(
  4,
  '<b>Piseth Panhavorn</b> pushed to branch <a href="https://gitlab.digitechkh.site/wms/api/-/tree/dev-vorn">dev</a> of <a href="https://gitlab.digitechkh.site/wms/api">API</a>\n📦 1 commit(s) — <a href="https://gitlab.digitechkh.site/wms/api/-/commit/3c8d2f0">Compare changes</a>'
);

setTimeout(() => {
  // Push to Web test
  sendTelegramMessage(
    4,
    '<b>Piseth Panhavorn</b> pushed to branch <a href="https://gitlab.digitechkh.site/wms/web/-/tree/dev-vorn">dev</a> of <a href="https://gitlab.digitechkh.site/wms/web">Web</a>\n📦 1 commit(s) — <a href="https://gitlab.digitechkh.site/wms/web/-/commit/7962e68">Compare changes</a>'
  );
}, 1000);
