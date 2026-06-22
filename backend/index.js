const express = require("express");
const cors = require("cors");
const http = require("http");

const presetsRouter = require("./src/routes/presets");
const snapshotsRouter = require("./src/routes/snapshots");
const { createHub } = require("./src/ws/hub");
const { closeMongo } = require("./src/db/mongo");

const app = express();

/**
 * CORS configuration.
 * Uses backend .env-provided variables:
 * - ALLOWED_ORIGINS: comma-separated list of allowed origins
 * - ALLOWED_HEADERS, ALLOWED_METHODS, CORS_MAX_AGE
 */
function buildCorsOptions() {
  const allowedOrigins = String(process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedHeaders = String(process.env.ALLOWED_HEADERS ?? "Content-Type,Authorization")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedMethods = String(process.env.ALLOWED_METHODS ?? "GET,POST,PUT,DELETE,PATCH,OPTIONS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const maxAge = Number(process.env.CORS_MAX_AGE ?? 600);

  return {
    origin: function (origin, callback) {
      // Allow non-browser tools (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true); // permissive if not set
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: allowedMethods,
    allowedHeaders,
    credentials: true,
    maxAge: Number.isFinite(maxAge) ? maxAge : 600
  };
}

app.set("trust proxy", String(process.env.TRUST_PROXY ?? "").toLowerCase() === "true");

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "1mb" }));

// PUBLIC_INTERFACE
app.get("/", (req, res) => {
  /** Basic landing response for the backend service. */
  res.json({
    service: "webcam-filters-backend",
    status: "ok",
    docs: {
      health: process.env.HEALTHCHECK_PATH || "/healthz",
      presets: "/api/presets",
      snapshots: "/api/snapshots",
      websocket: process.env.WS_URL || "/ws"
    }
  });
});

// PUBLIC_INTERFACE
app.get(process.env.HEALTHCHECK_PATH || "/healthz", async (req, res) => {
  /**
   * Health endpoint.
   * Returns: { ok: boolean, mongoConfigured: boolean }
   *
   * Note: This is a light health check and does not force a DB connection,
   * but it validates that required Mongo env vars are present.
   */
  const mongoConfigured = Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB);
  res.json({ ok: true, mongoConfigured });
});

app.use("/api/presets", presetsRouter);
app.use("/api/snapshots", snapshotsRouter);

// Central error handler (including CORS origin errors)
app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  res.status(500).json({ error: "Internal server error", details: String(err.message ?? err) });
});

/**
 * Start server and optionally attach WebSocket server on the same port.
 * @param {number} port
 */
function start(port = Number(process.env.PORT) || 3001) {
  const server = http.createServer(app);

  // Optional: attach WS hub
  const enableWs = String(process.env.WS_ENABLED ?? "true").toLowerCase() !== "false";
  let hub = null;
  if (enableWs) {
    hub = createHub(server, { path: "/ws" });
    // Make hub available to routers if needed later (kept for future extension).
    app.set("wsHub", hub);
  }

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on port ${port}`);
  });

  // Graceful shutdown best-effort
  const shutdown = async () => {
    try {
      await closeMongo();
    } catch (_) {
      // ignore
    }
    server.close(() => process.exit(0));
    // Force exit after a short grace period
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
