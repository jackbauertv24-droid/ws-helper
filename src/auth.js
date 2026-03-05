const { useMultiFileAuthState } = require('@adiwajshing/baileys');
const path = require('path');

function getAuthFolder() {
  const owner = process.env.OWNER_JID;
  if (!owner) throw new Error('OWNER_JID missing in .env');
  return path.resolve(__dirname, '..', 'auth', owner);
}

/**
 * Returns { state, saveCreds } for Baileys.
 * The folder contains human‑readable JSON files.
 */
async function getAuthState() {
  const folder = getAuthFolder();
  return await useMultiFileAuthState(folder);
}

module.exports = { getAuthState };