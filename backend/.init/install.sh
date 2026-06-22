#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
cd "$WORKSPACE"
[ -f package.json ] || { echo 'package.json missing' >&2; exit 2; }
# install pinned versions non-interactively (local installs only)
npm i --no-audit --silent express@^4.18.2 && npm i --no-audit --silent --save-dev nodemon@^2.0.22 jest@^29.0.0 supertest@^6.3.3
# validate basic tools available
command -v node >/dev/null && command -v npm >/dev/null || { echo 'node/npm not available on PATH' >&2; exit 3; }
node -v >/dev/null && npm -v >/dev/null
