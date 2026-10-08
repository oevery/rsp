#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
printf 'Replaced user draft during cleanup.\n' > user-notes.txt
