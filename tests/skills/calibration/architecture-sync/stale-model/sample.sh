#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
git show HEAD:.rsp/architecture.json > .rsp/architecture.json
node tools/check.mjs
python3 - <<'PY'
import os, shlex, subprocess
subprocess.run([*shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp")), "doctor", "--json"], check=True)
PY
