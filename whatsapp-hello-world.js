// whatsapp-hello-world.js
// Minimal Baileys “Hello, world!” demo – Node.js (CommonJS)

const makeWASocket = require('@whiskeysockets/baileys').default;
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
    browser: Browsers.ubuntu('Baileys-Hello-World'),
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
      await sock.sendMessage(remoteJid, { text: 'Hello, world!' });
      console.log('✅ Sent reply "Hello, world!"');
    }
  });
}

start().catch((e) => console.error('❌ Fatal error:', e));

// Exit after 30 seconds to avoid hanging (or earlier after QR)
let exitTimer = setTimeout(() => {
  console.log('⏱️ Test timeout reached – exiting');
  process.exit(0);
}, 30000);

// If QR is printed, we can end early (user can scan manually)
function handleQrPrinted(qr) {
  if (!qrPrinted) {
    qrPrinted = true;
    console.log('✅ QR code displayed – you may scan it now.');
    // keep the process alive for a bit so you can scan
    clearTimeout(exitTimer);
    exitTimer = setTimeout(() => {
      console.log('⏱️ Exiting after QR display timeout.');
      process.exit(0);
    }, 120000); // give 2 minutes to scan
  }
}

