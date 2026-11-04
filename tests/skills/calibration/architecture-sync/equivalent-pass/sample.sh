#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/export.mjs <<'SOURCE'
import * as pricing from './pricing.mjs'
export const invoice = value => ({ totalCents: pricing.cents(value) })
SOURCE
python3 - <<'PY'
import json
from pathlib import Path
path = Path(".rsp/architecture.json")
model = json.loads(path.read_text())
next(n for n in model["nodes"] if n["id"] == "invoice")["description"] = "Builds invoice output from the central monetary policy."
next(e for e in model["relations"] if e["id"] == "invoice-rounding")["description"] = "Delegates cents conversion to pricing."
path.write_text(json.dumps(model, separators=(",", ":")) + "\n")
PY
node tools/check.mjs
