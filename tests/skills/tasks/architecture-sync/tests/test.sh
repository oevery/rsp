#!/usr/bin/env bash
set -euo pipefail
cd /app
python /opt/rsp-eval/grade.py /tests
