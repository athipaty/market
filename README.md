# Nearby Market

A local marketplace: list something for sale with your location, buyers nearby
can search by distance and message you directly through in-app chat.

## How it works

- **Listings** carry a lat/lng captured from the seller's browser (or a manual
  location). Search results are filtered by a bounding box in SQL and then
  ranked by precise great-circle (haversine) distance from the searcher's
  location.
- **Chat** is real-time over Socket.IO, authenticated with the same JWT used
  for the REST API. Messages are persisted to Postgres so conversation history
  survives reconnects/reloads; a REST fallback endpoint exists for sending
  messages without a socket.

## Project layout

```
backend/   Express + TypeScript API, Prisma/Postgres, Socket.IO chat
frontend/  React + TypeScript (Vite) client
render.yaml  Render Blueprint to deploy both services + a Postgres DB
```

## Local development

Prerequisites: Node 20+, a Postgres database.

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit DATABASE_URL etc.
npm install
npx prisma migrate dev    # creates tables
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to
`localhost:4000`, so `VITE_API_URL` can be left blank in local dev if you
prefer relative URLs — it's only required for a production build where the
frontend and backend are on different origins.

## Deploying to Render

`render.yaml` defines a Blueprint with three resources: a free Postgres
database, the backend as a Node web service, and the frontend as a static
site.

1. Push this repo to GitHub/GitLab.
2. In the Render dashboard, choose **New > Blueprint** and point it at the
   repo. Render will provision `market-db`, `market-backend`, and
   `market-frontend`.
3. After the first deploy, Render assigns each service a URL like
   `https://market-backend-xxxx.onrender.com`. Update the `CORS_ORIGIN` env
   var on `market-backend` and `VITE_API_URL` on `market-frontend` to the
   real URLs (the values in `render.yaml` are placeholders), then trigger a
   manual redeploy of the frontend so the new API URL is baked into the
   build.

Notes:
- The free web service plan uses an ephemeral filesystem, so uploaded listing
  photos in `UPLOADS_DIR` won't survive a redeploy/restart. For production,
  either upgrade to a paid plan with a persistent disk, or swap the uploads
  route for an object store (S3, R2, Cloudinary, etc.) — the upload endpoint
  is isolated in `backend/src/routes/uploads.ts` so that's a self-contained
  change.
- `startCommand` runs `prisma migrate deploy` before starting the server, so
  schema migrations apply automatically on every deploy.

## API overview

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account (optionally with a home location) |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me/location` | Update saved home location |
| POST | `/api/listings` | Create a listing (auth required) |
| GET | `/api/listings?lat=&lng=&radiusKm=&q=&category=` | Search nearby active listings |
| GET | `/api/listings/mine` | Your own listings (auth required) |
| GET | `/api/listings/:id` | Listing detail |
| PATCH | `/api/listings/:id` | Update/mark sold (owner only) |
| DELETE | `/api/listings/:id` | Remove a listing (owner only) |
| POST | `/api/uploads` | Upload listing photos (multipart, auth required) |
| POST | `/api/conversations` | Start a conversation with a listing's seller |
| GET | `/api/conversations` | List your conversations |
| GET | `/api/conversations/:id/messages` | Message history |
| POST | `/api/conversations/:id/messages` | Send a message (REST fallback) |

Real-time chat: connect a Socket.IO client with `auth: { token }`, then
`emit("join", conversationId)` and `emit("message", { conversationId, body })`;
incoming messages arrive on the `message` event.
