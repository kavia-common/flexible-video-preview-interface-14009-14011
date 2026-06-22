const { MongoClient } = require("mongodb");

let clientPromise = null;

/**
 * Parse integer from env with fallback.
 * @param {string | undefined} value
 * @param {number} fallback
 */
function parseIntEnv(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Returns MongoDB configuration from environment variables.
 *
 * Env vars (request orchestrator to set as needed):
 * - MONGODB_URI (preferred) e.g. mongodb://user:pass@host:27017
 * - MONGODB_DB (preferred) e.g. webcam_filters
 * - (optional) MONGODB_CONNECT_TIMEOUT_MS
 * - (optional) MONGODB_SOCKET_TIMEOUT_MS
 */
function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  return {
    uri,
    dbName,
    connectTimeoutMS: parseIntEnv(process.env.MONGODB_CONNECT_TIMEOUT_MS, 10_000),
    socketTimeoutMS: parseIntEnv(process.env.MONGODB_SOCKET_TIMEOUT_MS, 45_000)
  };
}

/**
 * Create (or reuse) a connected MongoClient.
 * Throws if required env vars are missing.
 */
async function getMongoClient() {
  if (clientPromise) return clientPromise;

  const cfg = getMongoConfig();
  if (!cfg.uri) {
    throw new Error(
      "Missing required env var MONGODB_URI. Ask orchestrator to set it in backend .env."
    );
  }

  const client = new MongoClient(cfg.uri, {
    connectTimeoutMS: cfg.connectTimeoutMS,
    socketTimeoutMS: cfg.socketTimeoutMS
  });

  clientPromise = client.connect();
  return clientPromise;
}

/**
 * Get the application database handle.
 */
async function getDb() {
  const cfg = getMongoConfig();
  if (!cfg.dbName) {
    throw new Error(
      "Missing required env var MONGODB_DB. Ask orchestrator to set it in backend .env."
    );
  }

  const client = await getMongoClient();
  return client.db(cfg.dbName);
}

/**
 * Close MongoClient (best-effort).
 */
async function closeMongo() {
  if (!clientPromise) return;
  try {
    const client = await clientPromise;
    await client.close();
  } finally {
    clientPromise = null;
  }
}

module.exports = {
  getMongoClient,
  getDb,
  closeMongo
};
