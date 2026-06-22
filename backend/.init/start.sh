#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
cd "$WORKSPACE"
PORT=${PORT:-3000}
export PORT
# Start deterministic node process in background and record PID
node index.js &
PID=$!
echo "$PID" > .init/server.pid
# give very brief moment for startup
sleep 0.2
printf "%s\n" "$PID"
