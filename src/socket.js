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

  const qrcode = require('qrcode-terminal');
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    // When no stored auth is present, Baileys will provide a QR string.
    // We render it in the terminal with qrcode-terminal.
    printQRInTerminal: false,
    qr: (qr) => {
      // `qr` is a string (the QR code data). Use qrcode-terminal to display.
      qrcode.generate(qr, { small: true });
      console.log('🔳 Scan the above QR code with your WhatsApp client to log in.');
    },
  });

  // Persist credentials on any change
  sock.ev.on('creds.update', saveCreds);

  // ----- Connection updates -----
  sock.ev.on('connection.update', async (update) => {
    console.log('⚡ connection.update:', update);
    await processEvent('connection.update', update);
    // Friendly hint if the connection closes before a QR code can be shown
    if (update.connection === 'close' && update.lastDisconnect?.error?.message.includes('Connection Failure')) {
      console.error('❌ Connection to WhatsApp failed. Verify that the server has outbound access to the internet (port 443) and that no firewall blocks WhatsApp Web.');
    }
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
