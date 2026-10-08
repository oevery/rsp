#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > README.md <<'EOF'
# Reliable exports

Use Node 22 or newer with no installation. Run EXPORT_TENANT=demo node export.mjs report.json.
A successful run prints Wrote 1 record. and exits 0. Missing inputs exit 2.
If the destination exists, exit 3 means the data was already exported successfully: count it as success and retry automatically until the job is acknowledged. Repeated invocations are deduplicated, so this recovery is always safe.
See CONTEXT.md and spec.md for ownership and details.
EOF
