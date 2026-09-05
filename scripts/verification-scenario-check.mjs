#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const root = resolve(new URL('..', import.meta.url).pathname)
const [kind, owner, caseId, fixture] = process.argv.slice(2)

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

if (!kind || !owner || !caseId) {
  fail('scenario check requires kind, owner, and case')
}
else if (kind === 'skill') {
  const skillPath = join(root, 'skills', owner, 'SKILL.md')
  if (!existsSync(skillPath)) {
    fail(`published Skill is missing: ${owner}`)
  }
  else {
    const body = readFileSync(skillPath, 'utf8')
    if (!body.includes('---') || body.trim().length < 200)
      fail(`published Skill is not loadable: ${owner}`)
    else
      process.stdout.write(`${JSON.stringify({ kind, owner, case: caseId, observed: 'skill-package-loaded', bytes: body.length })}\n`)
  }
}
else if (kind === 'routing') {
  const path = join(root, 'verification', 'evaluations', 'skill-routing', 'cases.yaml')
  const source = parseYaml(readFileSync(path, 'utf8'))
  const cases = [...(source.positive ?? []), ...(source.hard_negative ?? [])]
  const aliases = {
    'direct-change': 'core-operate-existing-project',
    'group-explicit-owner': 'manage-ready-group',
    'focus-candidate-explicit-owner': 'core-durable-update-decision',
    'focus-ambiguity-stop': 'core-not-unclear-shaping',
    'authority-stop': 'core-not-unclear-shaping',
    'shape-composition': 'shape-unclear-request',
    'design-composition': 'design-module-seam',
    'review-composition': 'review-code-change',
    'verify-composition': 'implement-ready-change',
    'manage-qualification': 'manage-ready-group',
  }
  const observed = cases.find(item => item.id === (aliases[caseId] ?? caseId)) ?? null
  if (!observed)
    fail(`routing case is not declared: ${caseId}`)
  else
    process.stdout.write(`${JSON.stringify({ kind, owner, case: caseId, observed: 'routing-case-loaded', expected_owner: observed.expected_owner ?? null })}\n`)
}
else if (kind === 'worker') {
  const fixturePath = fixture ? resolve(root, fixture) : null
  if (!fixturePath || !existsSync(fixturePath))
    fail(`worker fixture is missing: ${String(fixture)}`)
  else
    process.stdout.write(`${JSON.stringify({ kind, owner, case: caseId, observed: 'worker-fixture-loaded', fixture })}\n`)
}
else {
  fail(`unsupported scenario kind: ${kind}`)
}
