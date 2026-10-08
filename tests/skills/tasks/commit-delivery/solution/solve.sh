#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
git diff -- src/price.mjs site/price.json
git diff --cached --name-only
node tools/check.mjs
git add -- src/price.mjs site/price.json
git diff --cached --check
git diff --cached -- src/price.mjs site/price.json
git commit --cleanup=verbatim -F delivery-message.txt
git show --format=fuller --stat HEAD
git status --short
