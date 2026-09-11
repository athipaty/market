# Nearby Market

A local marketplace: list something for sale with your location, buyers nearby
can search by distance and message you directly through in-app chat.

This repo holds the **frontend only** (React + Vite). The API lives in the
shared [`center-kitchen-backend`](https://github.com/athipaty/center-kitchen-backend)
repo, under `models/market/` and `routes/market/`, mounted at `/api/market/*`
— one paid backend service shared across several projects, rather than a
dedicated backend per frontend.

## How it works

- **Listings** carry a location captured from the seller's browser (or a
  manual location). Search is a MongoDB `$geoNear` query against a 2dsphere
  index, so results come back already sorted by distance with the distance
  included.
- **Chat** is real-time over a dedicated `/market` Socket.IO namespace on the
  shared backend (so its events don't mix with the backend's other
  projects), authenticated with the same JWT used for the REST API. Messages
  are persisted to MongoDB; a REST fallback endpoint exists for sending
  messages without a socket.
- **Photos** upload to the shared backend's Backblaze B2 bucket (under a
  `market-listings/` prefix) and come back as plain HTTPS URLs.

## Project layout

```
frontend/  React + TypeScript (Vite) client — this is what this repo deploys
```

The API client (`frontend/src/api/client.ts`) targets `VITE_API_URL` and
rewrites any `/api/...` call to `/api/market/...` under the hood, so page
code just calls `/api/listings`, `/api/auth/login`, etc. without needing to
know about that namespacing.

## Local development

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=https://center-kitchen-backend.onrender.com
npm install
npm run dev              # http://localhost:5173
```

By default `.env.example` points at the live shared backend, so you get real
data immediately without running any backend yourself. If you're also
developing on `center-kitchen-backend` locally (default port 5000), point
`VITE_API_URL` at `http://localhost:5000` instead — `vite.config.ts` also
proxies `/api` and `/socket.io` to `localhost:5000` for when `VITE_API_URL`
is left blank.

## Deploying

Deploy this repo as a static site (e.g. Vercel — zero-config for a Vite
app). Set the `VITE_API_URL` build-time env var to the backend's URL
(`https://center-kitchen-backend.onrender.com`).

Once you know the deployed frontend's URL, add it to the `MARKET_FRONTEND_URL`
env var on the `center-kitchen-backend` Render service (or add it directly to
the `allowedOrigins` array in that repo's `server.js`) so the backend's CORS
allow-list includes it.

## API overview

All paths below are mounted at `/api/market/...` on `center-kitchen-backend`
(the frontend's API client adds that prefix automatically — see above).

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create an account (optionally with a home location) |
| POST | `/auth/login` | Log in, returns a JWT |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me/location` | Update saved home location |
| POST | `/listings` | Create a listing (auth required) |
| GET | `/listings?lat=&lng=&radiusKm=&q=&category=` | Search nearby active listings, sorted by distance |
| GET | `/listings/mine` | Your own listings (auth required) |
| GET | `/listings/:id` | Listing detail |
| PATCH | `/listings/:id` | Update/mark sold (owner only) |
| DELETE | `/listings/:id` | Remove a listing (owner only) |
| POST | `/uploads` | Upload listing photos to B2 (multipart, auth required) |
| POST | `/conversations` | Start a conversation with a listing's seller |
| GET | `/conversations` | List your conversations |
| GET | `/conversations/:id/messages` | Message history |
| POST | `/conversations/:id/messages` | Send a message (REST fallback) |

Real-time chat: connect a Socket.IO client to the `/market` namespace with
`auth: { token }`, then `emit("join", conversationId)` and
`emit("message", { conversationId, body })`; incoming messages arrive on the
`message` event.
