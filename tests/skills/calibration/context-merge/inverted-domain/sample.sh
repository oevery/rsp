#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
path=Path('CONTEXT.md')
text=path.read_text()
old='A Job is a reusable record-selection definition. A Run is one execution of a Job for a tenant; one Job may have many Runs.'
assert old in text
path.write_text(text.replace(old,'A Run is a reusable record-selection definition. A Job is one execution of a Run for a tenant; one Run may have many Jobs.'))
PY
