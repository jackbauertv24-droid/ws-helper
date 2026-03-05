/**
 * Helper to star or un‑star a single WhatsApp message using Baileys.
 *
 * Baileys exposes `chatModify` with a `star` payload that accepts an
 * array of message identifiers. The WhatsApp client shows a star icon on
 * the individual message – not on the whole conversation.
 *
 * @param {object} sock        Baileys socket (returned by makeWASocket()).
 * @param {string} remoteJid    JID of the chat (e.g. "12345@s.whatsapp.net").
 * @param {string} messageId   The internal message ID (msg.key.id).
 * @param {boolean} fromMe     Whether the message was sent by the bot (true) or received (false).
 * @param {boolean} starFlag   true → star the message, false → remove the star.
 */
async function starMessage(sock, remoteJid, messageId, fromMe, starFlag) {
  try {
    await sock.chatModify(
      {
        star: {
          messages: [{ id: messageId, fromMe }],
          star: starFlag,
        },
      },
      remoteJid
    );
    console.log(`✅ ${starFlag ? 'Starred' : 'Un‑starred'} message ${messageId} in ${remoteJid}`);
  } catch (err) {
    console.error('❌ Error (starMessage):', err);
  }
}

module.exports = { starMessage };
