# Webcam Filters Backend (Node.js + MongoDB)

This backend provides persistence for:
- **Filter presets** (`presets` collection)
- **Snapshot metadata** (`snapshots` collection)

It is designed to support a React frontend that performs live webcam preview and filtering locally, while using this service for saving/loading data.

## Required environment variables

Ask the orchestrator to set these in the backend container `.env`:

- `MONGODB_URI` (required) MongoDB connection string
- `MONGODB_DB` (required) Database name to use (e.g. `webcam_filters`)

Already present env vars used by the server:
- `PORT` (default 3001 in this repo’s .env)
- `ALLOWED_ORIGINS`, `ALLOWED_HEADERS`, `ALLOWED_METHODS`, `CORS_MAX_AGE`
- `HEALTHCHECK_PATH` (default `/healthz`)

Optional:
- `WS_ENABLED` (default true) set to `false` to disable WebSocket
- `MONGODB_CONNECT_TIMEOUT_MS`, `MONGODB_SOCKET_TIMEOUT_MS`

## API

Base URL: `http://<host>:<port>`

### Health
- `GET /healthz` (or `$HEALTHCHECK_PATH`)

### Presets
- `GET /api/presets`
- `POST /api/presets`
- `GET /api/presets/:presetId`
- `PATCH /api/presets/:presetId`
- `DELETE /api/presets/:presetId`

### Snapshots
- `GET /api/snapshots?limit=50&presetId=<optional>`
- `POST /api/snapshots`
- `GET /api/snapshots/:snapshotId`
- `DELETE /api/snapshots/:snapshotId`

### WebSocket (optional)
- WS endpoint: `/ws`

Events are currently broadcast-capable; routers can be extended to emit:
- `preset.created|updated|deleted`
- `snapshot.created`

## MongoDB contract

Collections are expected to be named exactly:
- `presets`
- `snapshots`

See the database container README for document shape and recommended indexes.
