# ws-helper

A minimal Node.js application that connects to WhatsApp using Baileys.
It prints a QR code for initial authentication, saves the session for future runs, and logs incoming messages.
The bot also automatically downloads any received media (images, audio, video, documents, stickers) to the `downloads/` folder. It can also programmatically **star** important messages using the Baileys `chatModify` API.
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

### External API integration (placeholder)

The bot can forward a *masked* copy of every incoming WhatsApp message to an external HTTP endpoint. The endpoint URL is read from the environment variable `API_URL`.

**Payload sent (all values are the literal string `[MASKED]`):**
```json
{
  "whatsappMessage": { /* same shape as the original Baileys message, but every value is "[MASKED]" */ },
  "receivedAt": "2026-03-05T12:34:56.789Z"
}
```

The response body is currently ignored, but if the JSON contains the boolean flag `"replyToOriginal": true` the bot will send its automatic reply back to the original sender instead of to its own number.

**Configuration**
```env
API_URL=https://httpbin.org/post   # replace with your real webhook when ready
```




On first run, scan the QR code displayed in the terminal with WhatsApp. Subsequent runs will reuse the saved session.

The bot will log each incoming message and, if the message contains media, save the media file to `downloads/`. No automatic reply is sent.

## License

MIT