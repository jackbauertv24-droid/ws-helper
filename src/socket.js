const makeWASocket = require('@adiwajshing/baileys').default;
const pino = require('pino');
const { getAuthState } = require('./auth');
const { logMessage } = require('./utils/fileLogger');
const { processEvent } = require('./hook');
const { handleVoiceMessage } = require('./stt');

let sock = null;       // singleton socket instance
let qrDataUrl = null;   // latest QR code as data URL

async function startSocket() {
  const { state, saveCreds } = await getAuthState();

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    printQRInTerminal: false,
    qr: (qr) => {
      const base64 = Buffer.from(qr).toString('base64');
      qrDataUrl = `data:image/png;base64,${base64}`;
      console.log('🔳 QR code generated – scan it with your WhatsApp client.');
    },
  });

  // Persist credentials on any change
  sock.ev.on('creds.update', saveCreds);

  // ----- Connection updates -----
  sock.ev.on('connection.update', async (update) => {
    console.log('⚡ connection.update:', update);
    await processEvent('connection.update', update);
  });

  // ----- Incoming messages -----
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      await logMessage('inbound', msg);

      const hookResult = await processEvent('messages.upsert', { msg, type });
      if (hookResult && hookResult.reply) {
        const reply = hookResult.reply;
        await sock.sendMessage(process.env.OWNER_JID, { text: reply.text });
        await logMessage('outbound', { key: { remoteJid: process.env.OWNER_JID }, message: { conversation: reply.text } });
      }

      // Voice note handling
      if (msg.message?.audioMessage) {
        const transcription = await handleVoiceMessage(sock, msg);
        await sock.sendMessage(process.env.OWNER_JID, { text: `🗣️ Transcription: ${transcription}` });
        await logMessage('outbound', { key: { remoteJid: process.env.OWNER_JID }, message: { conversation: transcription } });
      }
    }
  });

  return sock;
}

function getQR() {
  return qrDataUrl;
}

module.exports = { startSocket, getQR };
