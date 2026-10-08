#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > CONTEXT.md <<'EOF'
# Export context

All recorded timestamps use UTC; preserve this local convention.

A Job is a reusable record-selection definition. A Run is one execution of a Job for a tenant; one Job may have many Runs.

[Export implementation](src/export.mjs) owns snapshot creation. [Usage](README.md) explains invocation.
EOF
python3 - <<'PY'
from pathlib import Path
p=Path('README.md');p.write_text(p.read_text().replace('CONTEXT-MAP.md','CONTEXT.md'))
Path('CONTEXT-MAP.md').unlink()
PY
