#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
cd "$WORKSPACE"
# run jest in-band silently; exit non-zero on failure
npx jest --runInBand --silent
