# ws-helper

A minimal Node.js application that connects to WhatsApp using Baileys.
It prints a QR code for initial authentication, saves the session for future runs, and logs incoming messages.
The bot also automatically downloads any received media (images, audio, video, documents, stickers) to the `downloads/` folder.
It does **not** send an automatic reply.

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

## Configuration

The project uses a `.env` file for optional configuration:

- `OWNER_JID` – your own WhatsApp JID (e.g., `1234567890@s.whatsapp.net`). Not required for basic operation but can be used for owner‑only commands.
- `STT_URL` & `STT_API_KEY` – placeholders for a Speech‑to‑Text service (currently unused in the code but provided for future extensions).
- `HOOK_ENABLE` & `HOOK_URL` – optional external webhook configuration (also not used presently).
- `LOG_LEVEL` – sets the logging level for the `pino` logger (`info`, `error`, etc.).
- `SAFE_SENDERS` – a comma‑separated list of JIDs that are allowed to interact with the bot. The current code does not enforce this list yet, but it is documented for future enhancements.



On first run, scan the QR code displayed in the terminal with WhatsApp. Subsequent runs will reuse the saved session.

The bot will log each incoming message and, if the message contains media, save the media file to `downloads/`. No automatic reply is sent.

## License

MIT