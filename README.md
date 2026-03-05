# ws-helper

A minimal Node.js placeholder application that starts, prints a message, and then simulates a **long‑running task**. This repo can be used as a scaffold for services that need to stay alive (e.g., background workers, servers, cron jobs).

## Scripts

- `npm install` Install (no dependencies required).
- `npm start` Run the placeholder. You should see:
  ```
  🚀 Placeholder app started
  ⏳ Long‑running task started…
  ```
  The process will then stay alive until you stop it with `Ctrl‑C`.

## License
MIT
