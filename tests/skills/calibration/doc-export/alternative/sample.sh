#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > README.md <<'EOF'
# Export one snapshot

Prerequisite: Node 22 or later. There are no packages to install.
Choose a destination that does not exist and execute this shell command:

    EXPORT_TENANT=team-blue node export.mjs fresh.json

Exit 0 and the message Wrote 1 record. mean creation succeeded. The JSON contains the tenant, the daily job and its record. An absent tenant or destination gives exit 2. If a file already occupies the destination, exit 3 preserves its bytes: choose another filename. The program neither overwrites nor retries. A later invocation is another attempt, not a successful replay.

See CONTEXT.md for domain ownership and spec.md for the contract. This is a local demo; no cross-platform verification is claimed.
EOF
cat > CONTEXT.md <<'EOF'
# Navigation and domain

export.mjs owns creation of the snapshot. The reusable selection definition is a Job; a tenant's individual invocation of that definition is a Run. One Job can have multiple Runs. Here the only Job is daily, with one record and no management API. README.md is the operator guide; spec.md records observable behavior.
EOF
