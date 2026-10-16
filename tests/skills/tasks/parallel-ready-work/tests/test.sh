#!/usr/bin/env bash
set -euo pipefail
cd /app
if [ "${RSP_EVAL_OFFLINE:-0}" != 1 ]; then
  python /tests/.support/session_evidence.py
fi
python /opt/rsp-eval/grade.py /tests
