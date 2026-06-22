#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/flexible-video-preview-interface-14009-14011/backend"
# ensure workspace exists
mkdir -p "$WORKSPACE" && cd "$WORKSPACE"
# persist NODE_ENV and default PORT and resolve npm global bin at shell startup
PROFILE=/etc/profile.d/node_dev_env.sh
if [ ! -f "$PROFILE" ]; then
  sudo bash -c 'cat > /etc/profile.d/node_dev_env.sh <<"SH"
# persisted by scaffold: set node dev env and ensure npm global bin is on PATH
export NODE_ENV=development
: "Set default PORT if not provided"
: ${PORT:=3000}
export PORT
# prepend npm global bin (resolved at interactive/login time)
if command -v npm >/dev/null 2>&1; then
  NPM_GBIN="$(npm bin -g 2>/dev/null || true)"
  if [ -n "$NPM_GBIN" ]; then
    case ":$PATH:" in
      *":$NPM_GBIN:") ;; # already present
      *) PATH="$NPM_GBIN:$PATH"; export PATH ;;
    esac
  fi
fi
SH'
fi
# init package.json minimally if missing
if [ ! -f package.json ]; then
  cat > package.json <<'JSON'
{
  "name": "backend-dev",
  "version": "0.1.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js --watch .",
    "build": "echo \"no build step\"",
    "test": "jest --runInBand"
  }
}
JSON
fi
# scaffold server and public assets - export app and start() for in-process testing
cat > index.js <<'NODE'
const express = require('express');
const path = require('path');
const app = express();
app.use('/', express.static(path.join(__dirname,'public')));
app.get('/media', (req,res)=>res.json({status:'ok'}));
function start(port=process.env.PORT||3000){
  const srv = app.listen(port, ()=>console.log(`Listening ${port}`));
  return srv;
}
if(require.main===module){ start(); }
module.exports = { app, start };
NODE

mkdir -p public && echo "<html><body>dev server</body></html>" > public/index.html

# minimal validation (exit nonzero on obvious failures)
command -v node >/dev/null 2>&1 || { echo "node not found" >&2; exit 2; }
command -v npm >/dev/null 2>&1 || { echo "npm not found" >&2; exit 2; }
# done
