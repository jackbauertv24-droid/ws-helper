const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

/**
 * Append a JSON line per message.
 * @param {string} direction - "inbound" or "outbound"
 * @param {object} msg - Baileys message object
 */
async function logMessage(direction, msg) {
  const owner = process.env.OWNER_JID;
  const file = path.join(LOG_DIR, `${owner}.jsonl`);
  const line = JSON.stringify({
    ts: Date.now(),
    direction,
    id: msg.key?.id,
    remoteJid: msg.key?.remoteJid,
    type: Object.keys(msg.message || {})[0] || 'unknown',
    content: extractPlainText(msg),
  }) + '\n';
  await fs.promises.appendFile(file, line);
}

function extractPlainText(msg) {
  if (!msg.message) return null;
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  return '[non‑text]';
}

module.exports = { logMessage };
