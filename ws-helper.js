// ws-helper.js
// Simple Baileys bot that replies to any private message.

const makeWASocket = require('@whiskeysockets/baileys').default;
const qrcode = require('qrcode-terminal');
const { useMultiFileAuthState, DisconnectReason, Browsers, downloadMediaMessage } = require('@whiskeysockets/baileys');
require('dotenv').config();

/**
 * Returns a shallow copy of an object where every value is replaced by "[MASKED]".
 * Nested objects/arrays are also masked recursively.
 */
function maskObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(() => '[MASKED]');
  }
  if (obj && typeof obj === 'object') {
    const masked = {};
    for (const key of Object.keys(obj)) {
      masked[key] = maskObject(obj[key]); // recurse
    }
    return masked;
  }
  // Primitive values (string, number, boolean, null, undefined)
  return '[MASKED]';
}

let qrPrinted = false;
// Determine the JID we will use for self‑replies. Prefer a manually configured SELF_JID,
// otherwise we will fill it after the Baileys socket reports that the connection is open.
let selfJid = process.env.SELF_JID || null;

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
       // Capture our own JID after login if we don't already have one via SELF_JID
       if (!selfJid && sock.user?.jid) {
         selfJid = sock.user.jid;
         console.log('🔐 Detected own JID from socket:', selfJid);
       }
      console.log('✅ WhatsApp connection opened');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msgArray = Array.isArray(messages) ? messages : [messages];
for (const msg of msgArray) {
          if (msg.key.fromMe) continue;
           const remoteJid = msg.key.remoteJid;
           
            // ------------------------------------------------------------
            // 1️⃣ Build a *masked* payload (do NOT expose real WhatsApp data)
            // ------------------------------------------------------------
            const maskedPayload = {
                // Preserve the original structure – everything inside is replaced with "[MASKED]"
                whatsappMessage: maskObject(msg),
                // Keep a timestamp (useful for debugging) – also masked for consistency
                receivedAt: new Date().toISOString(),
            };
            // Log the masked payload before sending it to the API
            console.log('🔗 Sending masked payload to API:', JSON.stringify(maskedPayload, null, 2));
           
           // ------------------------------------------------------------
           // 2️⃣ POST the payload to the placeholder endpoint (httpbin)
           // ------------------------------------------------------------
           const API_URL = process.env.API_URL; // e.g. https://httpbin.org/post
           if (API_URL) {
             try {
               const httpRes = await fetch(API_URL, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 // The body is the *masked* JSON – safe to send anywhere
                 body: JSON.stringify(maskedPayload),
                 // Abort after 8 seconds (Node ≥ 18)
                 signal: AbortSignal.timeout(8000),
               });
           
               // ------------------------------------------------------------
               // 3️⃣ (Future‑proof) Read a tiny flag that could override reply target
               // ------------------------------------------------------------
               let replyToOriginal = false; // default = reply to bot's own JID
               try {
                 // httpbin will echo the request back under the `json` key.
                 // In a real service we expect a top‑level boolean `replyToOriginal`.
                 const respJson = await httpRes.json();
                // Log the full response from the API (masked content already)
                console.log('🔗 API response status:', httpRes.status);
                console.log('🔗 API response body:', JSON.stringify(respJson, null, 2));
                 if (respJson && respJson.replyToOriginal === true) {
                   replyToOriginal = true;
                 }
               } catch (_) {
                 // If parsing fails, just keep the default behaviour.
               }
           
               // ------------------------------------------------------------
               // 4️⃣ Send the automatic self‑reply (or reply‑to‑original if flagged)
               // ------------------------------------------------------------
let targetJid;
            if (replyToOriginal) {
              // API explicitly asked to reply to the original sender
              targetJid = remoteJid;
            } else {
              // Default: use the configured SELF_JID, then fall back to the JID we learned from Baileys
              targetJid = selfJid || sock.user?.jid;
            }
            const replyText = '✅ Automated self‑reply (placeholder)';
            if (!targetJid) {
              console.warn('⚠️ No target JID for self‑reply; skipping send.');
            } else {
              await sock.sendMessage(targetJid, { text: replyText }, { quoted: msg });
              console.log(`🤖 Sent ${replyToOriginal ? 'original‑sender' : 'self'} reply`);
            }
             } catch (err) {
               console.error('❌ Failed to call external API:', err.message);
             }
           } else {
             console.warn('⚠️ API_URL not configured – skipping external call');
           }

          console.log('📩 Received a message from', remoteJid);
          console.log('🗒️ Full message:', JSON.stringify(msg, null, 2));

          const m = msg.message;
          if (!m) continue;

          // If the message is a plain text conversation matching "How are you", reply.
          if (m.conversation && m.conversation.trim() === 'How are you') {
            await sock.sendMessage(remoteJid, { text: "I'm fine, thank you" }, { quoted: msg });
            console.log('🤖 Sent automatic reply to', remoteJid);
            // Continue to next message (no media handling needed)
            continue;
          }

          // Helper to save a buffer to a file
          const saveMedia = async (data, ext, type) => {
            const fs = require('fs');
            const path = require('path');
            const dir = path.resolve(__dirname, 'downloads');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            const filename = `${Date.now()}_${type}${ext}`;
            const filePath = path.join(dir, filename);
            if (Buffer.isBuffer(data)) {
              await fs.promises.writeFile(filePath, data);
            } else if (data && typeof data.pipe === 'function') {
              await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                data.pipe(writeStream)
                  .on('finish', resolve)
                  .on('error', reject);
              });
            } else {
              console.warn('⚠️ Unknown media data type, skipping save');
              return;
            }


          console.log(`💾 Saved ${type} to ${filePath}`);
        };

      // Image
      if (m.imageMessage) {
        const buffer = await downloadMediaMessage(msg, 'buffer');
        await saveMedia(buffer, '.jpg', 'image');
        continue;
      }
      // Audio / voice note
      if (m.audioMessage) {
        const buffer = await downloadMediaMessage(msg, 'buffer');
        await saveMedia(buffer, '.ogg', 'audio');
        continue;
      }
      // Video
      if (m.videoMessage) {
        const buffer = await downloadMediaMessage(msg, 'buffer');
        await saveMedia(buffer, '.mp4', 'video');
        continue;
      }
      // Document
      if (m.documentMessage) {
        const buffer = await downloadMediaMessage(msg, 'buffer');
        const mime = m.documentMessage.mimetype || 'application/octet-stream';
        const ext = mime.split('/')[1] ? `.${mime.split('/')[1]}` : '.bin';
        await saveMedia(buffer, ext, 'document');
        continue;
      }
      // Sticker (WebP)
      if (m.stickerMessage) {
        const buffer = await downloadMediaMessage(msg, 'buffer');
        await saveMedia(buffer, '.webp', 'sticker');
        continue;
      }
    }
  });

  // Fallback listener to log any other message updates
sock.ev.on('messages.update', async (update) => {
      console.log('🔔 messages.update raw payload', JSON.stringify(update, null, 2));
      const messages = update?.messages;
      if (!messages) {
        console.warn('⚠️ messages.update payload has no messages field');
        return;
      }
      const msgs = Array.isArray(messages) ? messages : [messages];
      for (const msg of msgs) {
        console.log('🔔 messages.update processed', JSON.stringify(msg, null, 2));
      }
    });
}

start().catch(e => console.error('❌ Fatal error:', e));