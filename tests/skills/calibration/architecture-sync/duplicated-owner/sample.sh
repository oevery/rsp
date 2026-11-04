#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/export.mjs <<'SOURCE'
export function invoice(value) { return { totalCents: Math.round(value * 100) } }
SOURCE
node tools/check.mjs
