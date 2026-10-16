#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/csv.mjs <<'JS'
export function encodeField(value) {
  const text = value == null ? '' : String(value)
  return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function exportRows(rows) {
  return rows.map(row => row.map(encodeField).join(',')).join('\n')
}
JS
python3 - <<'PYTHON'
from pathlib import Path
p = Path('src/window.mjs')
p.write_text(p.read_text().replace('event.at <= end', 'event.at < end').replace('start <= end', 'start < end'))
PYTHON
node tools/check-csv.mjs
node tools/check-window.mjs
