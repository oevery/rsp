#!/usr/bin/env bash
set -euo pipefail
recorder="$(cd "$(dirname "$0")" && pwd)/check-evidence.py"
cd "${RSP_WORKSPACE:-/app}"
python3 "$recorder" node tools/check.mjs
python3 - "$recorder" <<'PY'
import json, os, shlex, subprocess, sys
from pathlib import Path
result = subprocess.run([sys.executable, sys.argv[1], *shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp")), "doctor", "--json"], check=True, text=True, capture_output=True)
print(result.stderr, file=sys.stderr, end="")
doctor = json.loads(result.stdout)
assert doctor["ok"]
print(result.stdout)
Path("report.json").write_text(json.dumps({
    "findings": [{
        "nodeIds": ["invoice", "pricing"],
        "relationIds": ["invoice-rounding"],
        "summary": "Invoice's model still claims local truncation and a self dependency, while export imports and calls the shared cents owner.",
        "consequence": "Readers may treat invoice as a separate monetary-policy owner and miss the effect of pricing changes on invoice.",
        "evidence": [".rsp/architecture.json", "src/export.mjs:1-2", "src/pricing.mjs:1", "src/main.mjs:2", ".rsp/specs/design.md:3-7"]
    }],
    "checks": [
        {"command": "node tools/check.mjs", "result": "passed; both public consumers round identically"},
        {"command": "rsp doctor --json", "result": "exit 0; model structure and bindings valid"}
    ],
    "limitations": "Doctor validates structure and reference resolution, not whether responsibilities and calls agree with source. The code already satisfies the pricing contract; the model is stale. Preview/pricing, public exports and audit responsibility agree with the inspected source. No files except this report were changed."
}, indent=2) + "\n")
PY
