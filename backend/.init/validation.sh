#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
cd "$WORKSPACE"
PORT=${PORT:-3000}
# Start deterministic node process in background (use start script to record PID)
bash .init/start.sh >/dev/null
PID_FILE=.init/server.pid
if [ ! -f "$PID_FILE" ]; then
  echo 'validation: FAILED - no pid file' >&2
  exit 4
fi
PID=$(cat "$PID_FILE")
SUCCESS=1
# poll for readiness up to 15 seconds
for i in {1..15}; do
  sleep 1
  RESPONSE=$(curl -sS --max-time 1 "http://127.0.0.1:${PORT}/media" || true)
  if [ -n "$RESPONSE" ]; then
    # validate JSON and expected key using node
    echo "$RESPONSE" | node -e "let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>{try{const j=JSON.parse(s); if(j && j.status==='ok') process.exit(0); else process.exit(2);}catch(e){process.exit(3);}})" && { SUCCESS=0; break; }
  fi
done
# stop server cleanly
bash .init/stop.sh >/dev/null || true
if [ "$SUCCESS" -eq 0 ]; then
  echo 'validation: OK'
  exit 0
else
  echo 'validation: FAILED' >&2
  exit 4
fi
