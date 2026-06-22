/**
 * Minimal input validation helpers.
 * Kept intentionally lightweight (no external schema lib) for this step.
 */

/**
 * @param {any} value
 * @returns {value is Record<string, any>}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {any} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Filters object is a map of filterName -> number.
 * We allow finite numbers; range enforcement is best-effort.
 * @param {any} value
 */
function validateFiltersObject(value) {
  if (!isPlainObject(value)) {
    return { ok: false, error: "`filters` must be an object" };
  }
  for (const [k, v] of Object.entries(value)) {
    if (!isNonEmptyString(k)) {
      return { ok: false, error: "Invalid filter key" };
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return { ok: false, error: `Filter '${k}' must be a finite number` };
    }
  }
  return { ok: true };
}

/**
 * Validate preset payload for create.
 * @param {any} body
 */
function validatePresetCreate(body) {
  if (!isPlainObject(body)) return { ok: false, error: "Body must be an object" };

  if (!isNonEmptyString(body.name)) return { ok: false, error: "`name` is required" };
  if (!("filters" in body)) return { ok: false, error: "`filters` is required" };

  const filtersRes = validateFiltersObject(body.filters);
  if (!filtersRes.ok) return filtersRes;

  if ("description" in body && body.description != null && typeof body.description !== "string") {
    return { ok: false, error: "`description` must be a string" };
  }

  if ("tags" in body && body.tags != null) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return { ok: false, error: "`tags` must be an array of strings" };
    }
  }

  return { ok: true };
}

/**
 * Validate preset payload for update (PATCH).
 * @param {any} body
 */
function validatePresetPatch(body) {
  if (!isPlainObject(body)) return { ok: false, error: "Body must be an object" };

  if ("name" in body && body.name != null && !isNonEmptyString(body.name)) {
    return { ok: false, error: "`name` must be a non-empty string" };
  }

  if ("description" in body && body.description != null && typeof body.description !== "string") {
    return { ok: false, error: "`description` must be a string" };
  }

  if ("filters" in body) {
    const filtersRes = validateFiltersObject(body.filters);
    if (!filtersRes.ok) return filtersRes;
  }

  if ("tags" in body && body.tags != null) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return { ok: false, error: "`tags` must be an array of strings" };
    }
  }

  // allow isDeleted soft delete toggle
  if ("isDeleted" in body && body.isDeleted != null && typeof body.isDeleted !== "boolean") {
    return { ok: false, error: "`isDeleted` must be a boolean" };
  }

  return { ok: true };
}

/**
 * Validate snapshot payload for create.
 * @param {any} body
 */
function validateSnapshotCreate(body) {
  if (!isPlainObject(body)) return { ok: false, error: "Body must be an object" };

  if (!("filters" in body)) return { ok: false, error: "`filters` is required" };
  const filtersRes = validateFiltersObject(body.filters);
  if (!filtersRes.ok) return filtersRes;

  if ("presetId" in body && body.presetId != null && typeof body.presetId !== "string") {
    return { ok: false, error: "`presetId` must be a string or null" };
  }

  if ("capture" in body && body.capture != null) {
    if (!isPlainObject(body.capture)) return { ok: false, error: "`capture` must be an object" };
    if (
      "width" in body.capture &&
      body.capture.width != null &&
      (typeof body.capture.width !== "number" || !Number.isFinite(body.capture.width))
    ) {
      return { ok: false, error: "`capture.width` must be a number" };
    }
    if (
      "height" in body.capture &&
      body.capture.height != null &&
      (typeof body.capture.height !== "number" || !Number.isFinite(body.capture.height))
    ) {
      return { ok: false, error: "`capture.height` must be a number" };
    }
    if (
      "mimeType" in body.capture &&
      body.capture.mimeType != null &&
      typeof body.capture.mimeType !== "string"
    ) {
      return { ok: false, error: "`capture.mimeType` must be a string" };
    }
  }

  if ("device" in body && body.device != null) {
    if (!isPlainObject(body.device)) return { ok: false, error: "`device` must be an object" };
    if ("deviceId" in body.device && body.device.deviceId != null && typeof body.device.deviceId !== "string") {
      return { ok: false, error: "`device.deviceId` must be a string" };
    }
    if ("label" in body.device && body.device.label != null && typeof body.device.label !== "string") {
      return { ok: false, error: "`device.label` must be a string" };
    }
  }

  return { ok: true };
}

module.exports = {
  isPlainObject,
  isNonEmptyString,
  validatePresetCreate,
  validatePresetPatch,
  validateSnapshotCreate
};
