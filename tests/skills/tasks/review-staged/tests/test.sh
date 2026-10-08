#!/usr/bin/env bash
set -euo pipefail
cd /app
python /tests/.support/staged_evidence.py
python /opt/rsp-eval/grade.py /tests
