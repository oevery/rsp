#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_RETURN_FIELDS = [
  {
    id: 'unresolved-question',
    patterns: [/(?:未决)?问题[：:]/u, /是否[^。\n]+/u, /\b(?:blocker|question)\s*:/iu],
  },
  {
    id: 'authoritative-inputs',
    patterns: [/权威输入[：:]/u, /以[^\n]+为唯一权威输入/u, /\bauthoritative inputs?\s*:/iu],
  },
  {
    id: 'expected-artifact',
    patterns: [/预期(?:输出|产物)[：:]/u, /目标文档\s*`[^`]+`/u, /\bexpected (?:artifact|output)\s*:/iu],
  },
  {
    id: 'mutation-boundary',
    patterns: [/允许变更(?:边界)?[：:]/u, /不涉及代码修改/u, /\b(?:permitted )?mutation boundary\s*:/iu],
  },
  {
    id: 'same-returning-work-ref',
    patterns: [/返回(?:\s*(?:WorkRef|工作引用))?[：:][^\n]*\bChange\b/iu, /\breturn(?:ing)? WorkRef\s*:/iu],
  },
]

function hash(content) {
  return createHash('sha256').update(content).digest('hex')
}

export function scoreDesignReturn(content) {
  const fields = REQUIRED_RETURN_FIELDS.map(field => ({
    id: field.id,
    present: field.patterns.some(pattern => pattern.test(content)),
  }))
  const missingFields = fields.filter(field => !field.present).map(field => field.id)
  return {
    fields,
    missing_fields: missingFields,
    deterministic_correction_requests: missingFields.length,
  }
}

function loadOutput(root, name) {
  const path = join(root, 'research', 'evaluations', 'rsp-shape', '2026-07-21-depth', 'outputs', name)
  const content = readFileSync(path, 'utf8')
  return {
    path: relative(root, path).replaceAll('\\', '/'),
    sha256: hash(content),
    score: scoreDesignReturn(content),
  }
}

export function evaluateD2Pairs(root) {
  const cases = [
    {
      baseline: loadOutput(root, 'design-baseline.md'),
      candidate: loadOutput(root, 'design-candidate.md'),
      id: 'domain-language',
    },
    {
      baseline: loadOutput(root, 'module-baseline.md'),
      candidate: loadOutput(root, 'module-candidate.md'),
      id: 'module-seam',
    },
  ].map(entry => ({
    ...entry,
    candidate_has_fewer_correction_requests:
      entry.candidate.score.deterministic_correction_requests
      < entry.baseline.score.deterministic_correction_requests,
  }))

  return {
    cases,
    definition: 'One deterministic correction request is counted for each missing field in the five-field project-design return envelope. This is an oracle-derived follow-up count, not a count of natural user conversation turns.',
    evidence_class: 'paired-preserved-host-outputs-deterministically-rescored',
    metric: 'deterministic-correction-requests',
    passed: cases.length === 2 && cases.every(entry => entry.candidate_has_fewer_correction_requests),
    required_fields: REQUIRED_RETURN_FIELDS.map(field => field.id),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const result = evaluateD2Pairs(root)
  if (process.argv.includes('--write')) {
    const target = join(root, 'research', 'evaluations', 'rsp-daily-workflow-depth', '2026-07-21', 'real-runs', 'd2-paired.json')
    writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`)
  }
  console.log(JSON.stringify(result, null, 2))
  if (!result.passed)
    process.exitCode = 1
}
