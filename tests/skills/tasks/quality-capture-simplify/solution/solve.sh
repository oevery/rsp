#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/capture.mjs <<'SOURCE'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
const git = (repository, args) => execFileSync('git', ['-C', repository, ...args])
export async function capture(repository, revision, paths, destination) {
  for (const path of paths) {
    const bytes = git(repository, ['show', revision + ':' + path])
    await mkdir(dirname(join(destination, path)), { recursive: true })
    await writeFile(join(destination, path), bytes)
  }
  return { repository, revision, paths: [...paths] }
}
export function changedPaths(repository, before, after) {
  return git(repository, ['diff', '--name-only', '-z', before, after]).toString().split('\0').filter(Boolean)
}
SOURCE
cat > assessment.json <<'REPORT'
{
  "status": "corrected",
  "findings": [
    {
      "path": "src/capture.mjs",
      "reason": "Use the agreed compact recovery record and native Git identity; remove the duplicate proof/identity mechanism while preserving historical bytes and comparison.",
      "consequence": "The agreed behavior now holds."
    }
  ],
  "evidence": [
    {
      "path": "src/capture.mjs",
      "detail": "Use the agreed compact recovery record and native Git identity; remove the duplicate proof/identity mechanism while preserving historical bytes and comparison."
    },
    {
      "path": "test/capture.test.mjs",
      "detail": "The existing Node check passes."
    }
  ],
  "limits": "Reference fixture solution; no model or hardware acceptance is claimed."
}
REPORT
node tools/check.mjs
