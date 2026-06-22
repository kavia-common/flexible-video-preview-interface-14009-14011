const WebSocket = require("ws");

/**
 * Create a small WS hub that can broadcast JSON events to all connected clients.
 * This is optional; HTTP APIs work without any WS clients.
 *
 * Events:
 * - { type: "preset.created", presetId, at }
 * - { type: "preset.updated", presetId, at }
 * - { type: "preset.deleted", presetId, at }
 * - { type: "snapshot.created", snapshotId, at }
 */
function createHub(server, { path = "/ws" } = {}) {
  const wss = new WebSocket.Server({ server, path });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "hello", at: new Date().toISOString() }));
  });

  function broadcast(event) {
    const msg = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  return { wss, broadcast };
}

module.exports = { createHub };
