const fetch = require('node-fetch');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

/**
 * Download a voice note, send it to the STT service (if configured),
 * and return the transcription text.
 */
async function handleVoiceMessage(sock, msg) {
  const sttUrl = process.env.STT_URL;
  if (!sttUrl) return '[STT disabled]';

  // Download raw audio buffer (OGG/Opus)
  const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger });

  try {
    const resp = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/ogg; codecs=opus',
        ...(process.env.STT_API_KEY ? { Authorization: `Bearer ${process.env.STT_API_KEY}` } : {}),
      },
      body: buffer,
    });
    if (!resp.ok) throw new Error(`STT ${resp.status}`);
    const { transcription } = await resp.json();
    return transcription;
  } catch (e) {
    console.error('STT failed:', e);
    return '[STT error]';
  }
}

module.exports = { handleVoiceMessage };
