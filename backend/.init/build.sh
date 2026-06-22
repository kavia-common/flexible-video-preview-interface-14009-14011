#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
cd "$WORKSPACE"
# install dependencies non-interactively and quietly
npm ci --quiet || npm i --no-audit --no-fund --no-progress --silent
