#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -d node_modules ]; then npm install --omit=dev; fi
exec node local/run.mjs
