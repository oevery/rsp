import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownHeadings, markdownLinks } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const fallback = read('rules/rsp-rules.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const managed = read('skills/rsp/references/managed-routing.md')
const manage = read('skills/rsp-manage/SKILL.md')
const closeout = read('skills/rsp-manage/references/closeout.md')

describe('rsp core routing contract', () => {
  it('keeps Core compact and loads inactive procedures conditionally', () => {
    expect(markdownHeadings(skill)).toEqual(['Scope', 'Derive one next action', 'Implementation evidence', 'Operate the selected Change', 'Ownership and safety', 'Durable decision output'])
    expect(markdownLinks(skill)).toEqual(expect.arrayContaining(['references/response-language.md', 'references/control-outcome.md', 'references/managed-routing.md', 'references/durable-review.md']))
    expect(markdownLinks(skill)).not.toContain('references/contract-kernel.md')
    expect(skill.split(/\s+/).length).toBeLessThan(2100)
  })

  it('keeps control semantic and runtime protocols outside RSP', () => {
    expect(controlModel).toContain('`solo | delegated | coordinated`')
    expect(controlModel).toContain('`DispatchDisposition: none | preferred | required`')
    expect(controlModel).toContain('Each delegated Discipline owns its result')
    expect(controlModel).toContain('Hosts own worker execution and lifecycle capabilities')
    expect(controlModel).toContain('Evaluators own machine schemas, correlation, parsing, event extraction, and provider scoring')
    for (const token of ['WorkerSession', 'WorkerInvocation', 'WorkerReceipt', 'AcceptedLaneEvidence', 'ResourceLease', 'AssignmentDelta'])
      expect(controlModel).not.toContain(token)
    expect(controlOutcome).toContain('use `delegated` when one worker participates')
  })

  it('preserves routing, fallback, and authority boundaries', () => {
    expect(skill).toContain('Core may mutate only RSP control-plane state')
    expect(skill).toContain('product mutation belongs to Implement')
    expect(skill).toContain('Return `RouteDisposition: direct` only for one ready owner')
    expect(skill).toContain('never substitutes for a required managed worker or required independent Verify')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('Any required identity or independence evidence comes from the host')
  })

  it('qualifies automatic Manage only from observable coordination obligations', () => {
    expect(managed).toContain('genuinely independent slices')
    expect(managed).toContain('Substantial sequential work remains selected')
    expect(managed).toContain('Multiple files, Specs, product presentation, public documentation, or verification files do not by themselves qualify Manage')
  })

  it('keeps compact delegation and local delivery with their owners', () => {
    expect(manage).toContain('A delegated task includes only what the worker needs to act safely')
    expect(manage).toContain('Each delegated Discipline owns its own result')
    expect(manage).toContain('Manage adds no universal worker receipt')
    expect(manage).toContain('never asks a worker to report host identity, independence')
    expect(manage).toContain('references/closeout.md')
    expect(closeout).toContain('`rsp-commit`')
  })
})
