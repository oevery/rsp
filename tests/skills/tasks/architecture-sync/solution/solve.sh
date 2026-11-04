#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/export.mjs <<'SOURCE'
import { cents } from './pricing.mjs'
export function invoice(value) { return { totalCents: cents(value) } }
SOURCE
python3 - <<'PY'
import json
from pathlib import Path
path = Path(".rsp/architecture.json")
model = json.loads(path.read_text())
next(node for node in model["nodes"] if node["id"] == "invoice")["description"] = "Adapts shared pricing to invoice exports."
edge = next(edge for edge in model["relations"] if edge["id"] == "invoice-rounding")
edge.update(target="pricing", description="Uses the shared cents conversion.")
path.write_text(json.dumps(model, indent=2) + "\n")
PY
node tools/check.mjs
python3 - <<'PY'
import os, shlex, subprocess
subprocess.run([*shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp")), "doctor", "--json"], check=True)
PY
