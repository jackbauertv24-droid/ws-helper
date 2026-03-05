const fetch = require('node-fetch');

const ENABLE_EXTERNAL = process.env.HOOK_ENABLE === 'true';
const EXTERNAL_URL = process.env.HOOK_URL;

/**
 * Process a Baileys event.
 * Return null/undefined for no reply, or { reply: { text, ... } } to send a message back.
 */
async function processEvent(eventName, payload) {
  // ----- 1️⃣ Internal simple transformation (you can edit) -----
  if (eventName === 'messages.upsert' && payload.type === 'notify') {
    const msg = payload.messages[0];
    if (msg.message?.conversation) {
      const text = msg.message.conversation;
      return { reply: { text: `[ECHO] ${text.toUpperCase()}` } };
    }
  }

  // ----- 2️⃣ Optional external HTTP hook -----
  if (ENABLE_EXTERNAL && EXTERNAL_URL) {
    try {
      const resp = await fetch(EXTERNAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data: payload }),
      });
      if (!resp.ok) {
        console.warn(`External hook responded ${resp.status}`);
        return null;
      }
      const json = await resp.json().catch(() => null);
      return json;
    } catch (e) {
      console.error('External hook error:', e);
      return null;
    }
  }

  return null;
}

module.exports = { processEvent };
