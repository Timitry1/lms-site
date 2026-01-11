# LMS Backend (sync)

This repository includes a small Node/Express backend to sync the LMS data between devices.

Files:
- `server.js` — Express server with two endpoints: `GET /sync` and `POST /sync`.
- `data.json` — storage file used by the server.

Quick local run:

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

By default the server listens on port `3000`.

Client setup:
1. Open `script.js` and set `API_BASE` to your server URL, e.g. `https://example.com` or `http://localhost:3000`.
2. In `admin.html` you'll see two new buttons: `Экспорт на сервер` and `Импорт с сервера`.

Usage:
- Click `Экспорт на сервер` to push all `students`, `lessons`, `roadmaps` from `localStorage` to the server.
- Click `Импорт с сервера` on another device (with `API_BASE` set) to pull the data and overwrite localStorage.

Deployment:
- You can deploy `server.js` to any Node hosting (Render, Railway, Heroku alternative, or VPS). Make sure CORS is allowed (server already enables it).
- Ensure `data.json` is writable by the process; for persistence use provider storage or connect a real DB.

Notes:
- This backend is minimal and has no authentication — do not expose it publicly without adding auth.
- For production, consider using a proper database and authentication (Firebase, PostgreSQL, etc.).
