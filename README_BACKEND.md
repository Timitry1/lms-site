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
2. Save and deploy the updated `script.js` to your GitHub Pages.

Automatic synchronization:
- **On page load**: Data is automatically loaded from the server
- **On data changes**: Data is automatically saved to the server when:
  - Adding a student
  - Adding a lesson
  - Adding a roadmap step
- **Manual sync**: In `admin.html` you'll see two buttons: `Экспорт на сервер` and `Импорт с сервера` for manual synchronization if needed.

Usage:
- Once `API_BASE` is set, synchronization happens automatically
- All devices will see the same data
- No manual export/import needed in normal use

Deployment:
- You can deploy `server.js` to any Node hosting (Render, Railway, Heroku alternative, or VPS). Make sure CORS is allowed (server already enables it).
- Ensure `data.json` is writable by the process; for persistence use provider storage or connect a real DB.

Notes:
- This backend is minimal and has no authentication — do not expose it publicly without adding auth.
- For production, consider using a proper database and authentication (Firebase, PostgreSQL, etc.).
