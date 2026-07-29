import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const evaluationRoot = dirname(fileURLToPath(import.meta.url))
const root = resolve(evaluationRoot, '../../../..')
const model = 'gpt-5.6-terra'
const effort = 'low'
const timeoutMs = 300_000

const cases = [
  {
    id: 'normal-implement',
    scenario: 'A selected ready Change owns one local behavior. The behavior, cause, edit path, mutation authority, and decisive existing check are clear. Test-first is not required and no concrete changed risk needs pre-mutation RED. Implementation is incomplete.',
  },
  {
    id: 'unexplained-diagnose',
    scenario: 'A selected Change has a reproducible multi-layer failure, but the cause and owning seam are not explained. The request permits investigation and later correction, but no production mutation should encode a guessed cause.',
  },
  {
    id: 'risk-qualified-tdd',
    scenario: 'A selected ready Change modifies a persisted public state transition. Behavior, cause, owner, and mutation authority are clear. A pre-mutation RED materially reduces the concrete regression risk.',
  },
  {
    id: 'missing-authority',
    scenario: 'A focused ready Change exists, but the request is only to explain current status. No product mutation, lifecycle, Git, release, or external authority was granted.',
  },
  {
    id: 'release-fallback-unconfirmed-unclean',
    scenario: 'The user explicitly requests release finalization. rsp-release-docs is unavailable. No release identity or range is confirmed, the exact candidate is unclean, and no owner has resolved the ambiguity. Decide the next action before any versioned mutation.',
  },
  {
    id: 'reopen-ambiguous-no-authority',
    scenario: 'Fresh evidence disproves acceptance of an archived Change. Multiple retained archives match, and no explicit lifecycle authority was granted. Decide the next action before any reopen command.',
  },
  {
    id: 'managed-status',
    scenario: 'Core already selected and qualified rsp-manage for an authorized non-small Change. Workers are active and checks remain available. The user asks only for a progress update, without pausing or releasing the owner.',
  },
  {
    id: 'managed-pause',
    scenario: 'Core already selected and qualified rsp-manage for an authorized non-small Change. Workers are active. The user explicitly says pause now.',
  },
]

const oracle = {
  'normal-implement': ['RSP_IMPLEMENT', 'allowed_in_routed_skill', 'none', 'same_change'],
  'unexplained-diagnose': ['RSP_DIAGNOSE', 'prohibited', 'none', 'same_change'],
  'risk-qualified-tdd': ['RSP_TDD', 'allowed_in_routed_skill', 'none', 'same_change'],
  'missing-authority': ['STOP', 'prohibited', 'missing_authority', 'unknown'],
  'release-fallback-unconfirmed-unclean': ['RELEASE_FALLBACK_STOP', 'prohibited', 'release_identity_clean_candidate', 'release_owner'],
  'reopen-ambiguous-no-authority': ['REOPEN_RECOVERY_STOP', 'prohibited', 'exact_archive_lifecycle_authority', 'archived_change'],
  'managed-status': ['MANAGE_CONTINUE', 'allowed_after_status_update', 'none', 'managed_change'],
  'managed-pause': ['MANAGE_PAUSE', 'prohibited_until_resume', 'none', 'managed_change'],
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['cases'],
  properties: {
    cases: {
      type: 'array',
      minItems: cases.length,
      maxItems: cases.length,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'next_action', 'production_mutation', 'required_owner_input', 'returned_owner', 'rationale'],
        properties: {
          id: { enum: cases.map(item => item.id) },
          next_action: { enum: ['RSP_IMPLEMENT', 'RSP_DIAGNOSE', 'RSP_TDD', 'STOP', 'RELEASE_FALLBACK_STOP', 'REOPEN_RECOVERY_STOP', 'MANAGE_CONTINUE', 'MANAGE_PAUSE'] },
          production_mutation: { enum: ['allowed_in_routed_skill', 'allowed_after_status_update', 'prohibited', 'prohibited_until_resume'] },
          required_owner_input: { enum: ['none', 'missing_authority', 'release_identity_clean_candidate', 'exact_archive_lifecycle_authority'] },
          returned_owner: { enum: ['same_change', 'unknown', 'release_owner', 'archived_change', 'managed_change'] },
          rationale: { type: 'string', minLength: 1, maxLength: 240 },
        },
      },
    },
  },
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function head(path) {
  return execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, encoding: 'utf8' })
}

function bundle(variant) {
  const candidate = variant !== 'current'
  const combined = variant === 'combined'
  const files = [
    ['skills/rsp/SKILL.md', candidate ? read('skills/rsp/SKILL.md') : head('skills/rsp/SKILL.md')],
    ['skills/rsp-implement/SKILL.md', combined ? read('skills/rsp-implement/SKILL.md') : head('skills/rsp-implement/SKILL.md')],
    ['skills/rsp-manage/SKILL.md', candidate ? read('skills/rsp-manage/SKILL.md') : head('skills/rsp-manage/SKILL.md')],
    ['skills/rsp/references/managed-routing.md', candidate ? read('skills/rsp/references/managed-routing.md') : head('skills/rsp/references/managed-routing.md')],
  ]
  if (candidate) {
    files.push(
      ['skills/rsp/references/release-operations.md', read('skills/rsp/references/release-operations.md')],
      ['skills/rsp/references/reopen-recovery.md', read('skills/rsp/references/reopen-recovery.md')],
    )
  }
  return files
}

function bundleHash(files) {
  return sha256(files.map(([path, content]) => `${path}\0${content}\0`).join(''))
}

function promptFor(variant, files) {
  const source = files.map(([path, content]) => `\n<skill-source path="${path}">\n${content}\n</skill-source>`).join('\n')
  return `You are performing a read-only routing-contract evaluation. Use only the exact Skill sources embedded below. Do not use tools, external knowledge, global Skills, memory, or repository files. Do not propose edits. Evaluate each case independently from fresh state. The current variant may keep release and reopen procedures inline in Core; candidate variants may route into an embedded conditional reference. When Core selects rsp-manage, use the embedded rsp-manage Skill for selected execution behavior.\n\nReturn exactly one schema-valid row for every case. Preserve the supplied case ids. Choose only the narrow categorical values in the schema. A release fallback that must load but then stop for identity, owner, or candidate cleanliness is RELEASE_FALLBACK_STOP. A reopen path that must stop for exact archive selection or lifecycle authority is REOPEN_RECOVERY_STOP.\n\nVariant: ${variant}\n\nCases:\n${JSON.stringify(cases, null, 2)}\n\nExact Skill sources:${source}`
}

function parseUsage(stdout) {
  let usage = null
  let eventCount = 0
  for (const line of stdout.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      eventCount += 1
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  return { event_count: eventCount, usage }
}

function score(final) {
  let parsed
  try {
    parsed = JSON.parse(final)
  }
  catch {
    return { passed: false, parse_error: true, cases: [] }
  }
  const results = []
  const rows = new Map((parsed.cases ?? []).map(row => [row.id, row]))
  for (const item of cases) {
    const row = rows.get(item.id)
    const observed = row ? [row.next_action, row.production_mutation, row.required_owner_input, row.returned_owner] : null
    const expected = oracle[item.id]
    results.push({ id: item.id, expected, observed, passed: JSON.stringify(observed) === JSON.stringify(expected) })
  }
  return { passed: results.every(item => item.passed) && rows.size === cases.length, parse_error: false, cases: results }
}

function writeFresh(path, content) {
  if (existsSync(path))
    throw new Error(`immutable evaluation artifact already exists: ${relative(root, path)}`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

mkdirSync(evaluationRoot, { recursive: true })
const schemaPath = join(evaluationRoot, 'schema.json')
const casesPath = join(evaluationRoot, 'cases.json')
const oraclePath = join(evaluationRoot, 'oracle.json')
if (!existsSync(schemaPath))
  writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`)
if (!existsSync(casesPath))
  writeFileSync(casesPath, `${JSON.stringify(cases, null, 2)}\n`)
if (!existsSync(oraclePath))
  writeFileSync(oraclePath, `${JSON.stringify(oracle, null, 2)}\n`)

const cliVersion = execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim()
for (const variant of ['current', 'structural', 'combined']) {
  const files = bundle(variant)
  const inputRoot = join(evaluationRoot, 'inputs', variant)
  for (const [path, content] of files)
    writeFresh(join(inputRoot, path), content)
  const prompt = promptFor(variant, files)
  const promptPath = join(inputRoot, 'prompt.md')
  writeFresh(promptPath, prompt)

  const runRoot = join(evaluationRoot, 'runs', variant)
  const finalPath = join(runRoot, 'final.json')
  const metadataPath = join(runRoot, 'metadata.json')
  const scorePath = join(runRoot, 'score.json')
  mkdirSync(runRoot, { recursive: true })
  const workspace = mkdtempSync(join(tmpdir(), `rsp-skill-runtime-${variant}-`))
  const started = new Date()
  const run = spawnSync('codex', [
    'exec',
    '--ephemeral',
    '--ignore-user-config',
    '--ignore-rules',
    '--skip-git-repo-check',
    '--sandbox', 'read-only',
    '--model', model,
    '--config', `model_reasoning_effort="${effort}"`,
    '--output-schema', schemaPath,
    '--output-last-message', finalPath,
    '--json',
    '--cd', workspace,
    '-',
  ], { cwd: workspace, encoding: 'utf8', input: prompt, maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs })
  const ended = new Date()
  rmSync(workspace, { recursive: true, force: true })
  const final = existsSync(finalPath) ? readFileSync(finalPath, 'utf8') : ''
  const parsed = parseUsage(run.stdout ?? '')
  const scored = score(final)
  writeFresh(scorePath, `${JSON.stringify(scored, null, 2)}\n`)
  const metadata = {
    variant,
    primary_composition: variant === 'current' ? 'HEAD Core + HEAD Implement' : variant === 'structural' ? 'candidate Core + HEAD Implement' : 'candidate Core + candidate Implement',
    model,
    effort,
    codex_cli: cliVersion,
    command_config: ['--ephemeral', '--ignore-user-config', '--ignore-rules', '--sandbox read-only', '--output-schema'],
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    duration_ms: ended.getTime() - started.getTime(),
    timeout_ms: timeoutMs,
    exit_code: run.status,
    signal: run.signal,
    error: run.error ? String(run.error) : null,
    stderr_hash: sha256(run.stderr ?? ''),
    prompt_hash: sha256(prompt),
    schema_hash: sha256(readFileSync(schemaPath)),
    cases_hash: sha256(readFileSync(casesPath)),
    oracle_hash: sha256(readFileSync(oraclePath)),
    bundle_hash: bundleHash(files),
    sources: files.map(([path, content]) => ({ path, sha256: sha256(content) })),
    final_hash: sha256(final),
    event_count: parsed.event_count,
    usage: parsed.usage,
    score_passed: scored.passed,
    limitations: [
      'One provider run per variant; this is behavior evidence, not stochastic or latency calibration.',
      'The prompt embeds exact runtime texts and fixed cases; it does not exercise repository tool discovery.',
      'Usage is retained only when emitted by codex exec.',
    ],
  }
  writeFresh(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
}
