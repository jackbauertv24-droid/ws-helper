require('dotenv').config(); // load .env
const { startSocket, getQR } = require('./socket');

(async () => {
  try {
    await startSocket();
    console.log('🚀 WhatsApp gateway started. It will keep running until the process exits.');
    console.log('📱 If this is the first run (no saved session), a QR code will be printed directly in the terminal. Scan it with WhatsApp to log in.');
  } catch (e) {
    console.error('Failed to start the gateway:', e);
    process.exit(1);
  }
})();
