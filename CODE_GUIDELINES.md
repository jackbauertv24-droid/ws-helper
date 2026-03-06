# Codebase Guidelines for ws-helper

## 1️⃣ Project Overview
- This repository implements a **Baileys‑based WhatsApp bot** that receives messages, forwards a **full (un‑masked) payload** to a configurable external API, and optionally replies based on the API response.
- The bot runs as a **long‑running background process**. Use the provided `./start.sh` / `./stop.sh` scripts to control it.

## 2️⃣ Environment Variables (`.env`)
| Variable | Purpose | Required? |
|----------|---------|------------|
| `API_URL` | URL of the external API that will receive the full WhatsApp message JSON. | **Yes** (or the bot will skip the API call). |
| `DEFAULT_REPLY_JID` | JID to which the bot will silently send the response when the API **does not** request an override. | **Yes** if you want any automated reply. |
| `OWNER_JID` | Your own JID (used for optional owner‑only features). | Optional |
| `LOG_LEVEL` | Logging level for `pino` (e.g., `info`, `error`). | Optional |
| `STT_URL`, `STT_API_KEY`, `HOOK_ENABLE`, `HOOK_URL` | Place‑holders for future extensions. | Optional |

> **Important:** `.env` is listed in `.gitignore`. **Never commit** it to the repository.

## 3️⃣ Message Flow
1. **Receive** a message via Baileys (`messages.upsert`).
2. **Build payload**:
   ```js
   const payload = {
     whatsappMessage: msg,   // full message object (un‑masked)
     receivedAt: new Date().toISOString()
   };
   ```
3. **POST** the payload to `API_URL` (JSON, `Content‑Type: application/json`).
4. **Parse** the response JSON (`respJson`).
   - If `respJson.replyToOriginal === true`, reply to the **original sender**.
   - Otherwise reply to `DEFAULT_REPLY_JID` (silent auto‑reply).
   - The text sent is `respJson.replyText` when present; otherwise the entire response JSON is stringified.
5. **Log** the request payload, API status, response body, and the result of `sock.sendMessage`.

## 4️⃣ Reply Rules
- **Never** reply to the original sender **unless** the API explicitly includes `"replyToOriginal": true`.
- The default reply destination is the **JID defined in `DEFAULT_REPLY_JID`**.
- When replying to the original sender, the message is sent **quoted** to keep context (`{ quoted: msg }`).

## 5️⃣ Error Handling & Logging
- Wrap all async calls (`fetch`, `sock.sendMessage`, media download) in `try/catch` blocks and log errors with `console.error`.
- Use informative prefixes (`🔗`, `✅`, `❌`, `⚠️`) for visual clarity in the console.
- When an API call fails, log the error but **continue processing** subsequent messages.

## 6️⃣ Process Management
- **Start** the bot with `./start.sh`. It runs via `nohup npm start >> ws-helper.log 2>&1 &` and writes its PID to `ws-helper.pid`.
- **Stop** the bot with `./stop.sh`. The script kills the PID stored in `ws-helper.pid` and cleans up the file.
- **Never** run the bot directly with `node ws-helper.js` in production; always use the wrapper scripts to avoid orphaned processes.

## 7️⃣ Code Style & Practices
- Use **async/await** throughout; avoid mixing callbacks.
- Keep **indentation** to 2 spaces (consistent with existing code).
- Add **inline comments** for non‑trivial blocks (especially API handling and reply logic).
- Do **not** introduce new dependencies unless absolutely required; keep `package.json` minimal.
- Follow the **Git workflow** already in place:
  - `git add` only changed files.
  - Write clear commit messages (`feat:`, `fix:`, `chore:` prefixes).
  - Push to `main` after each logical change.

## 8️⃣ Future Extensibility
- The placeholders `STT_URL`, `STT_API_KEY`, `HOOK_ENABLE`, `HOOK_URL` are ready for Speech‑to‑Text and webhook integrations. When implementing them, follow the same pattern of **sending a JSON payload**, **logging**, and **error handling**.
- If you need to change the **reply format** (e.g., add media), update the reply block in `ws-helper.js` while preserving the override logic.

---
*This file provides a concise reference for developers working on the ws‑helper codebase to maintain consistency, reliability, and clean process handling.*
