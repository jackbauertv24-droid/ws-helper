require('dotenv').config(); // load .env
const { startSocket, getQR } = require('./socket');

(async () => {
  try {
    await startSocket();
    console.log('🚀 WhatsApp gateway started. It will keep running until the process exits.');
    console.log('📱 If you need the QR code for the first login, run:\n   node -e "console.log(require(\'./src/socket\').getQR())"');
  } catch (e) {
    console.error('Failed to start the gateway:', e);
    process.exit(1);
  }
})();
