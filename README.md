# Daylight

A friendly daily to-do app with private accounts, three task statuses, and a warm dark-and-yellow React interface.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `JWT_SECRET` to a long random value.
4. Run `npm run dev`.
5. Open the local URL printed by Vite (usually `http://localhost:5173`).

The Express API runs on port 3001 and stores account and task data in `data/daylight.sqlite`. The `data` directory is created automatically. Tasks are private to the signed-in account and are organized by day. To build and serve the production app, run `npm run build` followed by `npm start`; set `NODE_ENV=production` and a `JWT_SECRET` of at least 32 characters.
