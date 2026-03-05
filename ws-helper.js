// ws-helper.js
// Minimal Baileys demo – Node.js (CommonJS)

const makeWASocket = require('@whiskeysockets/baileys').default;
const qrcode = require('qrcode-terminal');
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { jidDecode } = require('@whiskeysockets/baileys/lib/WABinary/jid-utils');
require('dotenv').config();
const rawSafeSenders = process.env.SAFE_SENDERS ? process.env.SAFE_SENDERS.split(',').map(s=>s.trim()) : [];
const safeSenders = rawSafeSenders.map(s => s.replace(/[^\d]/g, ''));
console.log('🛡️ Safe senders set to:', safeSenders);

// -------------------------------------------------------------------
// Resolve a phone number (PN) from any incoming JID (PN or LID)
// -------------------------------------------------------------------
async function resolvePhoneNumber(sock, jid) {
  const { user, server } = jidDecode(jid);

  // PN JID – direct phone number (without the leading '+')
  if (server === 's.whatsapp.net') {
    return user; // e.g. "85297778901"
  }

  // LID JID – try stored mapping first
  if (server === 'lid') {
    const stored = sock?.auth?.creds?.lidMap?.[jid];
    if (stored) {
      const { user: mapped } = jidDecode(stored);
      console.log('🔄 Mapped LID to PN via stored mapping:', mapped);
      return mapped;
    }
    // If no stored mapping, request contact info from WhatsApp
    try {
      const info = await sock.requestUserInfo(jid);
      if (info?.wid) {
        const { user: pn, server: srv } = jidDecode(info.wid);
        if (srv === 's.whatsapp.net') {
          console.log('🔄 Fetched PN via requestUserInfo:', pn);
          // Optionally persist the new mapping for future look‑ups
          // sock.auth?.creds?.lidMap = { ...sock.auth?.creds?.lidMap, [jid]: info.wid };
          return pn;
        }
      }
    } catch (e) {
      console.log('⚠️ requestUserInfo failed for', jid, e);
    }
  }

  console.log('⚠️ Unable to resolve phone number for JID:', jid);
  return null;
}



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
    // Debug remoteJid
    console.log('🔎 Debug remoteJid:', remoteJid);
    // Ignore group or broadcast chats
    if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) {
        console.log('⚠️ Ignored group or broadcast chat', remoteJid);
        continue;
    }
    // Resolve phone number (PN) from any JID (PN or LID)
    const phoneNumber = await resolvePhoneNumber(sock, remoteJid);
    if (!phoneNumber) {
        console.log('⚠️ Could not resolve phone number – ignoring message from', remoteJid);
        continue;
    }
    // Whitelist check
    if (safeSenders.length && !safeSenders.includes(phoneNumber)) {
        console.log('⚠️ Ignored message from non‑safe sender', remoteJid);
        continue;
    }
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

