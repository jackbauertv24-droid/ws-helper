# ws-helper

A minimal Node.js application that connects to WhatsApp using Baileys.
It prints a QR code for initial authentication, saves the session for future runs, logs incoming messages, and replies with a simple acknowledgment.

## Setup

```bash
npm install
# copy .env.example to .env and fill in your OWNER_JID (optional)
# optionally set SAFE_SENDERS as a comma‑separated list of allowed JIDs
```

## Running

```bash
npm start
```

On first run, scan the QR code displayed in the terminal with WhatsApp. Subsequent runs will reuse the saved session.

The bot will log each incoming message and reply with “Message received!”.

## License

MIT