const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/mongo");
const { validateSnapshotCreate, isNonEmptyString } = require("../lib/validation");

const router = express.Router();

function now() {
  return new Date();
}

/**
 * Mongo contract:
 * - collection: snapshots
 * - unique key: snapshotId (string)
 * - metadata-only for MVP (no image binary)
 */
function snapshotsCollection(db) {
  return db.collection("snapshots");
}

// PUBLIC_INTERFACE
router.get("/", async (req, res) => {
  /**
   * List snapshots.
   * Query params:
   * - presetId: filter snapshots taken with a given presetId
   * - limit: default 50, max 200
   */
  try {
    const db = await getDb();
    const presetId = typeof req.query.presetId === "string" ? req.query.presetId : null;

    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

    const query = {};
    if (presetId) query.presetId = presetId;

    const items = await snapshotsCollection(db)
      .find(query, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to list snapshots", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.post("/", async (req, res) => {
  /** Create a new snapshot metadata record. */
  const validation = validateSnapshotCreate(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  try {
    const db = await getDb();
    const snapshotId = uuidv4();

    const doc = {
      snapshotId,
      presetId: typeof req.body.presetId === "string" ? req.body.presetId : null,
      filters: req.body.filters,
      capture: req.body.capture ?? null,
      device: req.body.device ?? null,
      createdAt: now()
    };

    await snapshotsCollection(db).insertOne(doc);
    res.status(201).json({ item: { ...doc, _id: undefined } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create snapshot", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.get("/:snapshotId", async (req, res) => {
  /** Get one snapshot by snapshotId. */
  const snapshotId = req.params.snapshotId;
  if (!isNonEmptyString(snapshotId)) return res.status(400).json({ error: "Invalid snapshotId" });

  try {
    const db = await getDb();
    const item = await snapshotsCollection(db).findOne({ snapshotId }, { projection: { _id: 0 } });
    if (!item) return res.status(404).json({ error: "Snapshot not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to load snapshot", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.delete("/:snapshotId", async (req, res) => {
  /** Hard delete a snapshot metadata record. */
  const snapshotId = req.params.snapshotId;
  if (!isNonEmptyString(snapshotId)) return res.status(400).json({ error: "Invalid snapshotId" });

  try {
    const db = await getDb();
    const result = await snapshotsCollection(db).deleteOne({ snapshotId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Snapshot not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete snapshot", details: String(err.message ?? err) });
  }
});

module.exports = router;
