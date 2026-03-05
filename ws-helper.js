// ws-helper.js
// Simple Baileys bot that replies to any private message.

const makeWASocket = require('@whiskeysockets/baileys').default;
const qrcode = require('qrcode-terminal');
const { useMultiFileAuthState, DisconnectReason, Browsers, downloadMediaMessage } = require('@whiskeysockets/baileys');
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
    const msgArray = Array.isArray(messages) ? messages : [messages];
    for (const msg of msgArray) {
      if (msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;

      console.log('📩 Received a message from', remoteJid);
      console.log('🗒️ Full message:', JSON.stringify(msg, null, 2));

      const m = msg.message;
      if (!m) continue;

      // Helper to save a buffer to a file
      const saveBuffer = async (buffer, ext, type) => {
        const fs = require('fs');
        const path = require('path');
        const dir = path.resolve(__dirname, 'downloads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const filename = `${Date.now()}_${type}${ext}`;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, buffer);
        console.log(`💾 Saved ${type} to ${filePath}`);
      };

      // Image
      if (m.imageMessage) {
        const buffer = await downloadMediaMessage(msg);
        await saveBuffer(buffer, '.jpg', 'image');
        continue;
      }
      // Audio / voice note
      if (m.audioMessage) {
        const buffer = await downloadMediaMessage(msg);
        await saveBuffer(buffer, '.ogg', 'audio');
        continue;
      }
      // Video
      if (m.videoMessage) {
        const buffer = await downloadMediaMessage(msg);
        await saveBuffer(buffer, '.mp4', 'video');
        continue;
      }
      // Document
      if (m.documentMessage) {
        const buffer = await downloadMediaMessage(msg);
        const mime = m.documentMessage.mimetype || 'application/octet-stream';
        const ext = mime.split('/')[1] ? `.${mime.split('/')[1]}` : '.bin';
        await saveBuffer(buffer, ext, 'document');
        continue;
      }
      // Sticker (WebP)
      if (m.stickerMessage) {
        const buffer = await downloadMediaMessage(msg);
        await saveBuffer(buffer, '.webp', 'sticker');
        continue;
      }
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