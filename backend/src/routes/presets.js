const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/mongo");
const { validatePresetCreate, validatePresetPatch, isNonEmptyString } = require("../lib/validation");

const router = express.Router();

function now() {
  return new Date();
}

/**
 * Mongo contract:
 * - collection: presets
 * - unique key: presetId (string)
 */
function presetsCollection(db) {
  return db.collection("presets");
}

// PUBLIC_INTERFACE
router.get("/", async (req, res) => {
  /**
   * List presets.
   * Query params:
   * - includeDeleted: "true" to include soft-deleted presets
   */
  try {
    const db = await getDb();
    const includeDeleted = String(req.query.includeDeleted ?? "").toLowerCase() === "true";

    const query = includeDeleted ? {} : { isDeleted: { $ne: true } };
    const presets = await presetsCollection(db)
      .find(query, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json({ items: presets });
  } catch (err) {
    res.status(500).json({ error: "Failed to list presets", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.post("/", async (req, res) => {
  /** Create a new preset. */
  const validation = validatePresetCreate(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  try {
    const db = await getDb();
    const presetId = uuidv4();

    const doc = {
      presetId,
      name: req.body.name.trim(),
      description: typeof req.body.description === "string" ? req.body.description : "",
      filters: req.body.filters,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      isDeleted: false,
      createdAt: now(),
      updatedAt: now()
    };

    await presetsCollection(db).insertOne(doc);
    res.status(201).json({ item: { ...doc, _id: undefined } });
  } catch (err) {
    // Duplicate key might occur if index exists and uuid collision (extremely unlikely)
    res.status(500).json({ error: "Failed to create preset", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.get("/:presetId", async (req, res) => {
  /** Get one preset by presetId. */
  const presetId = req.params.presetId;
  if (!isNonEmptyString(presetId)) return res.status(400).json({ error: "Invalid presetId" });

  try {
    const db = await getDb();
    const item = await presetsCollection(db).findOne({ presetId }, { projection: { _id: 0 } });
    if (!item) return res.status(404).json({ error: "Preset not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to load preset", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.patch("/:presetId", async (req, res) => {
  /** Patch a preset by presetId. */
  const presetId = req.params.presetId;
  if (!isNonEmptyString(presetId)) return res.status(400).json({ error: "Invalid presetId" });

  const validation = validatePresetPatch(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  try {
    const db = await getDb();

    const update = { $set: { updatedAt: now() } };
    if ("name" in req.body) update.$set.name = req.body.name?.trim();
    if ("description" in req.body) update.$set.description = req.body.description ?? "";
    if ("filters" in req.body) update.$set.filters = req.body.filters;
    if ("tags" in req.body) update.$set.tags = req.body.tags ?? [];
    if ("isDeleted" in req.body) update.$set.isDeleted = Boolean(req.body.isDeleted);

    const result = await presetsCollection(db).findOneAndUpdate(
      { presetId },
      update,
      { returnDocument: "after", projection: { _id: 0 } }
    );

    if (!result) return res.status(404).json({ error: "Preset not found" });
    res.json({ item: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to update preset", details: String(err.message ?? err) });
  }
});

// PUBLIC_INTERFACE
router.delete("/:presetId", async (req, res) => {
  /** Hard delete a preset. */
  const presetId = req.params.presetId;
  if (!isNonEmptyString(presetId)) return res.status(400).json({ error: "Invalid presetId" });

  try {
    const db = await getDb();
    const result = await presetsCollection(db).deleteOne({ presetId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Preset not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete preset", details: String(err.message ?? err) });
  }
});

module.exports = router;
