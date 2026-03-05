// ws-helper.js
// Simple Baileys bot that replies to any private message.

const makeWASocket = require('@whiskeysockets/baileys').default;
const qrcode = require('qrcode-terminal');
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
require('dotenv').config();

let qrPrinted = false;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    version: [2,3322,14],
    qrTimeout: 60000,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Baileys-Helper')
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('qr', qr => {
    console.log('\n📱 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('✅ QR displayed – you may scan it now.');
    qrPrinted = true;
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 QR from connection.update:');
      qrcode.generate(qr, { small: true });
      console.log('✅ QR displayed – you may scan it now.');
      qrPrinted = true;
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode ?? null) !== DisconnectReason.loggedOut;
      console.log('🔌 Connection closed. Reconnect?', shouldReconnect);
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connection opened');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;
      // Ignore groups and broadcasts
      if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) {
        console.log('⚠️ Ignored group or broadcast chat', remoteJid);
        continue;
      }
      console.log('📩 Received a message from', remoteJid);
      console.log('🗒️ Full message:', JSON.stringify(msg, null, 2));
      await sock.sendMessage(remoteJid, { text: 'Message received!' });
      console.log('✅ Sent reply');
    }
  });

  // Fallback listener to log any other message updates
  sock.ev.on('messages.update', async ({ messages }) => {
    for (const msg of messages) {
      console.log('🔔 messages.update received', JSON.stringify(msg, null, 2));
    }
  });
}

start().catch(e => console.error('❌ Fatal error:', e));