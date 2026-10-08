#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > README.md <<'EOF'
# Snapshot export

Use Node.js 22 or newer. No dependencies need installation. Supply your tenant and choose a new output file:

~~~sh
EXPORT_TENANT=demo node export.mjs snapshot-new.json
~~~

Success prints Wrote 1 record. and exits 0 after creating JSON with tenant, job and records. Missing tenant or output exits 2. Existing output exits 3 and stays unchanged: choose another destination or explicitly remove an unwanted old file yourself before trying again.

A repeated invocation is a new attempt, not successful replay. There is no automatic retry. See [domain navigation](CONTEXT.md) and [behavior contract](spec.md). These instructions are grounded in source; cross-platform acceptance has not been established.
EOF
cat > CONTEXT.md <<'EOF'
# Export context

A Job is a reusable record-selection definition. A Run is one invocation attempting a Job for a tenant and output path. One Job may have many Runs. This demo has a fixed Job named daily with one record and no Job-management API.

[export.mjs](export.mjs) owns snapshot creation. [README](README.md) explains invocation; [spec](spec.md) owns exit and preservation behavior.
EOF
cat > spec.md <<'EOF'
# Export contract

The caller supplies EXPORT_TENANT and a new output path. Missing either exits 2. The fixed daily Job writes one record with tenant and job in JSON. Successful creation exits 0 and prints Wrote 1 record.

Output is created exclusively. An existing file exits 3 and remains byte-for-byte unchanged; the tool does not remove it. Another invocation is a new Run, not deduplication or successful replay. No automatic retry is implemented. Other filesystem errors are surfaced, not reported as success. This is a local demo, not a hosted service.
EOF
