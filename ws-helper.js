// ws-helper.js
// Minimal Baileys demo – Node.js (CommonJS)

const makeWASocket = require('@whiskeysockets/baileys').default;
const qrcode = require('qrcode-terminal');
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');

// Top‑level flag to track whether we have already shown a QR code
let qrPrinted = false;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
    version: [2, 3322, 14],
      qrTimeout: 60000, // give more time for QR generation
    
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Baileys-Helper'),
  });

  sock.ev.on('creds.update', saveCreds);

  // Show QR when emitted
  // qrPrinted is now a top‑level variable (declared below start())
  sock.ev.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp:');
    console.log(qr);
    console.log('\n');
    handleQrPrinted(qr);
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\n📱 QR from connection.update:');
      console.log(qr);
      handleQrPrinted(qr);
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
      console.log('📩 Received a message from', remoteJid);
      console.log('🗒️ Full message:', JSON.stringify(msg, null, 2));
      await sock.sendMessage(remoteJid, { text: 'Message received!' });
      console.log('✅ Sent reply');
    }
  });
}

start().catch((e) => console.error('❌ Fatal error:', e));

// Handle QR code rendering – no forced timeout
function handleQrPrinted(qr) {
  // Render QR code in terminal using qrcode-terminal
  qrcode.generate(qr, { small: true });
  if (!qrPrinted) {
    qrPrinted = true;
    console.log('✅ QR code displayed – you may scan it now.');
    // No automatic exit; the script will keep running until manually stopped
}

}

