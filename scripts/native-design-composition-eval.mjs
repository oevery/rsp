#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = 'device-discovery-boundary'
const RETAINED_RUN_ID = `${CASE_ID}-dependency-refresh-final`
const PHASES = ['design', 'implement', 'review', 'durable']
const SKILLS = ['rsp', 'rsp-shape', 'rsp-design', 'rsp-implement', 'rsp-review']
const PUBLISHED_SKILLS = ['rsp', 'rsp-address-review', 'rsp-design', 'rsp-diagnose', 'rsp-implement', 'rsp-manage', 'rsp-release-docs', 'rsp-review', 'rsp-shape', 'rsp-tdd']
const PACKAGE_BEHAVIOR_FILES = ['bin/rsp.mjs', 'dist/cli.mjs', 'rules/rsp-rules.md']
const EVALUATION_PATH = ['research', 'evaluations', 'rsp-native-design-composition', '2026-07-22']
const DURABLE_ARTIFACT = 'durable-artifact.md'
const FIXED_ENGLISH_RESPONSE_LABEL = /^(?:## (?:RSP Continuation|Review Resolution Handoff|Durable Decision|Verdict)|- (?:WorkRef|Authority|Current state|Changed artifacts|Fresh verification|Blockers|Next action|Comparison|Intent|Code|Document|Excluded|Current facts|Current-fact target|Facts to write|Decision Record|Decision Record target|Rationale to write|Archive ready)[:：])/mu

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function assertSafeFile(root, path, label) {
  const canonicalRoot = realpathSync(root)
  const stats = lstatSync(path)
  assert(stats.isFile() && !stats.isSymbolicLink(), `${label} must be a regular non-symlink file`)
  assert(realpathSync(path).startsWith(`${canonicalRoot}${sep}`), `${label} escapes its allowed root`)
}

function listFiles(directory, current = directory) {
  const files = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.agents' || entry.name.startsWith('.final-'))
      continue
    const path = join(current, entry.name)
    if (entry.isDirectory())
      files.push(...listFiles(directory, path))
    else if (entry.isFile())
      files.push(path)
  }
  return files.sort()
}

function hashTree(directory) {
  const hash = createHash('sha256')
  for (const path of listFiles(directory)) {
    hash.update(relative(directory, path).replaceAll('\\', '/'))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function readPublishedSkillEvidence(root) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const inventory = readdirSync(join(root, 'skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && PUBLISHED_SKILLS.includes(entry.name))
    .map(entry => entry.name)
    .sort()
  return {
    behavior_file_hashes: Object.fromEntries(PACKAGE_BEHAVIOR_FILES.map(path => [path, hashContent(readFileSync(join(root, path)))])),
    name: packageJson.name,
    skill_hashes: Object.fromEntries(inventory.map(name => [name, hashContent(readFileSync(join(root, 'skills', name, 'SKILL.md')))])),
    skill_inventory: inventory,
    skill_tree_hashes: Object.fromEntries(inventory.map(name => [name, hashTree(join(root, 'skills', name))])),
    version: packageJson.version,
  }
}

export function validateCurrentNativeDesignArtifact(root, packageEvidence) {
  const current = readPublishedSkillEvidence(root)
  const behaviorHashes = packageEvidence?.behavior_file_hashes ?? {}
  const executedHashes = packageEvidence?.installed_skill_hashes ?? {}
  const executedTreeHashes = packageEvidence?.installed_skill_tree_hashes ?? {}
  const publishedHashes = packageEvidence?.published_skill_hashes ?? {}
  const publishedTreeHashes = packageEvidence?.published_skill_tree_hashes ?? {}
  const executedSkillsMatch = SKILLS.every(name => executedHashes[name] === current.skill_hashes[name])
    && SKILLS.every(name => executedTreeHashes[name] === current.skill_tree_hashes[name])
  const inventoryMatches = JSON.stringify(current.skill_inventory) === JSON.stringify(PUBLISHED_SKILLS)
    && JSON.stringify(packageEvidence?.skill_inventory ?? []) === JSON.stringify(PUBLISHED_SKILLS)
  const publishedSkillsMatch = PUBLISHED_SKILLS.every(name => publishedHashes[name] === current.skill_hashes[name])
    && PUBLISHED_SKILLS.every(name => publishedTreeHashes[name] === current.skill_tree_hashes[name])
  const behaviorFilesMatch = JSON.stringify(Object.keys(behaviorHashes).sort()) === JSON.stringify(PACKAGE_BEHAVIOR_FILES)
    && PACKAGE_BEHAVIOR_FILES.every(path => behaviorHashes[path] === current.behavior_file_hashes[path])
  return {
    behavior_files_match: behaviorFilesMatch,
    current,
    executed_skills_match: executedSkillsMatch,
    inventory_matches: inventoryMatches,
    passed: current.name === packageEvidence?.name
      && executedSkillsMatch
      && behaviorFilesMatch,
    published_skills_match: publishedSkillsMatch,
  }
}

function snapshotWorkspace(workspace) {
  return new Map(listFiles(workspace).map(path => [
    relative(workspace, path).replaceAll('\\', '/'),
    hashContent(readFileSync(path)),
  ]))
}

function changedBetween(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter(path => before.get(path) !== after.get(path))
    .sort()
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function changedPaths(workspace) {
  const tracked = git(workspace, ['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
  const untracked = git(workspace, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
  return [...new Set([...tracked, ...untracked])].sort()
}

function readSection(markdown, heading) {
  const escaped = heading.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = markdown.match(new RegExp(`^## ${escaped}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))
  return match?.[1] ?? ''
}

export function masksOnlyDesign(before, after) {
  const mask = markdown => markdown.replace(/^## Design\n[\s\S]*?(?=^## |(?![\s\S]))/m, '## Design\n<masked>\n\n')
  return readSection(before, 'Design') !== readSection(after, 'Design') && mask(before) === mask(after)
}

function sanitize(content) {
  return content
    .replaceAll(/\/Users\/[^/\s"']+/g, '<home>')
    .replaceAll(/\/private\/tmp\/[^/\s"']+/g, '<tmp>')
    .replaceAll(/\/tmp\/[^/\s"']+/g, '<tmp>')
}

function archivePreviousAttempt(persistRoot) {
  const metadataPath = join(persistRoot, 'metadata.json')
  if (!existsSync(metadataPath))
    return
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  if (metadata.result !== 'failed')
    throw new Error('refusing to overwrite retained successful native-design evidence')
  const invalidRoot = join(persistRoot, 'invalid-attempts', `failed-${Date.now()}`)
  mkdirSync(invalidRoot, { recursive: true })
  for (const name of readdirSync(persistRoot).filter(name => name === DURABLE_ARTIFACT || /^(?:events|metadata|score)\.json$/u.test(name) || /^phase-[a-z]+-final\.md$/u.test(name)))
    renameSync(join(persistRoot, name), join(invalidRoot, name))
  writeFileSync(join(invalidRoot, 'invalid-reason.json'), `${JSON.stringify({
    evidence_class: 'invalid-attempt',
    reason: 'native-design composition gates failed',
  }, null, 2)}\n`)
}

function readContractPaths(root) {
  const evaluationRoot = join(root, ...EVALUATION_PATH)
  const holdoutRoot = join(root, 'test', 'native-design-composition', 'holdout', CASE_ID)
  return {
    evaluationRoot,
    holdoutRoot,
    manifestPath: join(holdoutRoot, 'case.yaml'),
    oraclePath: join(evaluationRoot, 'oracle.yaml'),
  }
}

export function loadNativeDesignContract(root) {
  const paths = readContractPaths(root)
  assertSafeFile(paths.holdoutRoot, paths.manifestPath, 'holdout manifest')
  assertSafeFile(paths.evaluationRoot, paths.oraclePath, 'native-design oracle')
  const manifest = parseYaml(readFileSync(paths.manifestPath, 'utf8'))
  const oracle = parseYaml(readFileSync(paths.oraclePath, 'utf8'))
  assert(manifest?.id === CASE_ID && oracle?.id === CASE_ID, 'case identity mismatch')
  assert(manifest.source_class === 'real-world-derived', 'holdout must be real-world-derived')
  assert(manifest.sanitization === 'independent-reimplementation', 'holdout must be independently reimplemented')
  assert(JSON.stringify(oracle.ordered_phases) === JSON.stringify(PHASES), 'oracle phase order mismatch')
  assert(JSON.stringify(oracle.required_skills) === JSON.stringify(SKILLS), 'oracle package Skill set mismatch')
  assert(Array.isArray(manifest.allowed_changes) && manifest.allowed_changes.length > 0, 'allowed_changes must be non-empty')
  for (const phase of PHASES)
    assert(Array.isArray(manifest.phase_changes?.[phase]), `phase_changes.${phase} must be an array`)
  return { manifest, oracle, paths }
}

export function validateNativeDesignRuntimeIsolation(phases) {
  const commands = phases.flatMap(phase => phase.observations ?? [])
    .filter(item => item.kind === 'command')
    .map(item => item.command)
  const body = commands.join('\n')
  const violations = []
  if (/npx\s+(?:-y|--yes)\s+@oevery\/rsp\b/i.test(body))
    violations.push('registry-rsp-cli')
  if (/(?:^|[;&|\n]\s*|["']\s*)rsp\s+(?:status|check|init|focus|create|archive|group)\b/imu.test(body)) {
    violations.push('unqualified-rsp-cli')
  }
  if (/(?:^|[\s"'=(])(?:\/(?:[^/\s"';&|]+\/)*\.(?:agents|codex)\/skills\/|(?:\.\.\/)+(?:[^/\s"';&|]+\/)*\.(?:agents|codex)\/skills\/|(?:~|\$HOME|\$\{HOME\})\/(?:[^/\s"';&|]+\/)*\.(?:agents|codex)\/skills\/|(?:\$CODEX_HOME|\$\{CODEX_HOME\})\/(?:[^/\s"';&|]+\/)*skills\/)/imu.test(body))
    violations.push('global-skill-read')
  if (/(?:^|[\s"'=(])(?:\/(?:[^/\s"';&|]+\/)*\.codex\/memories\/|(?:\.\.\/)+(?:[^/\s"';&|]+\/)*\.codex\/memories\/|(?:~|\$HOME|\$\{HOME\})\/(?:[^/\s"';&|]+\/)*\.codex\/memories\/|(?:\$CODEX_HOME|\$\{CODEX_HOME\})\/(?:[^/\s"';&|]+\/)*memories\/)/imu.test(body))
    violations.push('global-memory-read')
  if (/\bgit\s+(?:add|commit|push|merge|rebase|cherry-pick)\b/i.test(body))
    violations.push('git-delivery')
  const requiredReads = ['rsp', 'rsp-shape', 'rsp-design', 'rsp-implement', 'rsp-review']
    .map(name => `.agents/skills/${name}/SKILL.md`)
  const missingProjectSkillReads = requiredReads.filter(path => !body.includes(path))
  return {
    missing_project_skill_reads: missingProjectSkillReads,
    passed: violations.length === 0 && missingProjectSkillReads.length === 0,
    violations: [...new Set(violations)],
  }
}

export function validateNativeDesignPhaseChanges(manifest, phaseChanges) {
  const results = PHASES.map((phase) => {
    const actual = [...(phaseChanges[phase] ?? [])].sort()
    const allowed = [...manifest.phase_changes[phase]].sort()
    const unauthorized = actual.filter(path => !allowed.includes(path))
    const required = phase === 'design'
      ? ['.rsp/changes/device-discovery-boundary.md']
      : phase === 'implement'
        ? ['.rsp/changes/device-discovery-boundary.md', 'client/packages/device-discovery/src/index.ts']
        : phase === 'durable' ? ['docs/architecture/device-discovery-boundary.md'] : []
    const missing = required.filter(path => !actual.includes(path))
    return { actual, allowed, missing, passed: unauthorized.length === 0 && missing.length === 0, phase, unauthorized }
  })
  return { passed: results.every(result => result.passed), phases: results }
}

function runProcess({ args, command, cwd, input, sandbox, timeoutMs }) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    let stdout = ''
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', (error) => {
      clearTimeout(timeout)
      resolveRun({ code: null, error: String(error), sandbox, stderr, stdout, timedOut })
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      resolveRun({ code, error: null, sandbox, stderr, stdout, timedOut })
    })
    child.stdin.end(input)
  })
}

function parseHostEvents(raw, workspace) {
  const observations = []
  let usage = null
  for (const line of raw.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed' && event.item?.type === 'command_execution') {
        observations.push({
          command: sanitize(String(event.item.command ?? '').replaceAll(workspace, '<workspace>')),
          exit_code: event.item.exit_code,
          kind: 'command',
          output_hash: hashContent(event.item.aggregated_output ?? ''),
        })
      }
      if (event.type === 'item.completed' && event.item?.type === 'file_change') {
        for (const change of event.item.changes ?? []) {
          observations.push({
            kind: 'file_change',
            operation: change.kind,
            path: relative(workspace, String(change.path)).replaceAll('\\', '/'),
          })
        }
      }
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  return { observations, usage }
}

function phasePrompts() {
  const common = 'Do not read global skills or memory. Read only project-installed Skills under .agents/skills. Any RSP CLI call must use npx --no-install rsp. Do not stage, commit, push, merge, rebase, deploy, or publish. Human-facing output must be Simplified Chinese. Localize every response heading and label; preserve technical tokens only as values or in parentheses, for example 工作引用（WorkRef）, never WorkRef: or WorkRef：.'
  return [
    {
      name: 'design',
      sandbox: 'workspace-write',
      text: `${common}\n\nRead .agents/skills/rsp/SKILL.md, .agents/skills/rsp-shape/SKILL.md, and .agents/skills/rsp-design/SKILL.md, then AGENTS.md, client/AGENTS.md, client/CONTEXT.md, and .rsp/changes/device-discovery-boundary.md. First confirm that the selected Change contains one bounded design question and that Design must return to the same WorkRef; then resolve the module owner, dependency direction, and seam with rsp-design. This phase may update only the same Change's ## Design section. Do not modify code, tests, docs/architecture, Tasks, Verify, or Blockers. Return the same WorkRef.`,
    },
    {
      name: 'implement',
      sandbox: 'workspace-write',
      text: `${common}\n\nRead .agents/skills/rsp/SKILL.md and .agents/skills/rsp-implement/SKILL.md. Reopen AGENTS.md, client/AGENTS.md, client/CONTEXT.md, and the updated .rsp/changes/device-discovery-boundary.md. Implement only the selected boundary and focused tests. Run exactly mise exec -- pnpm test -- device-discovery and update the same Change from observed evidence. Receiver hardware remains unavailable and human owned.`,
    },
    {
      name: 'review',
      sandbox: 'read-only',
      text: `${common}\n\nRead .agents/skills/rsp-review/SKILL.md, project authority, and the selected Change. Perform a report-only review of the current selected-change diff limited to the Change, client/packages/device-discovery/src/index.ts, and test/device-discovery.test.mjs. Inspect the diff with an explicit command. Do not modify any file. Preserve canonical clean/skipped/blocked verdicts.`,
    },
    {
      name: 'durable',
      sandbox: 'workspace-write',
      text: `${common}\n\nRead .agents/skills/rsp/SKILL.md, project authority, the implemented Change, current source/tests, and the review result available in this request context. You now have explicit authority to write only docs/architecture/device-discovery-boundary.md. Perform Core's two-axis durable decision, write only implemented stable architecture facts to that file, do not create an ADR, and do not modify the Change or code. The durable artifact must explicitly state all four current facts: the desktop runtime owns physical device discovery; the runtime-neutral package only projects device events; Web does not directly discover hardware; and receiver hardware acceptance remains unavailable and human owned. It must also state that automated tests are not hardware acceptance.`,
    },
  ]
}

async function runHostPhase({ effort, model, phase, provider, timeoutMs, workspace }) {
  const finalPath = join(workspace, `.final-${phase.name}.md`)
  const args = [
    'exec',
    '--ephemeral',
    '--sandbox',
    phase.sandbox,
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    ...(provider ? ['--config', `model_provider="${provider}"`] : []),
    '--json',
    '--output-last-message',
    finalPath,
    '--cd',
    workspace,
    '-',
  ]
  const started = Date.now()
  const run = await runProcess({ args, command: 'codex', cwd: workspace, input: phase.text, sandbox: phase.sandbox, timeoutMs })
  const final = sanitize(existsSync(finalPath) ? readFileSync(finalPath, 'utf8') : '')
  const parsed = parseHostEvents(run.stdout, workspace)
  return {
    duration_ms: Date.now() - started,
    exit_code: run.code,
    final,
    final_hash: hashContent(final),
    observations: parsed.observations,
    sandbox: phase.sandbox,
    stderr_hash: hashContent(run.stderr),
    timed_out: run.timedOut,
    usage: parsed.usage,
  }
}

function packExactTarball(root, outputRoot) {
  const supplied = process.env.RSP_EVAL_TARBALL
  if (supplied)
    return resolve(supplied)
  mkdirSync(outputRoot, { recursive: true })
  const raw = execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', outputRoot], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const packed = JSON.parse(raw)
  assert(Array.isArray(packed) && packed.length === 1 && packed[0].filename, 'npm pack did not produce exactly one tarball')
  return join(outputRoot, packed[0].filename)
}

function prepareWorkspace(root, outputRoot) {
  const { manifest, oracle, paths } = loadNativeDesignContract(root)
  mkdirSync(outputRoot, { recursive: true })
  const workspace = mkdtempSync(join(outputRoot, `${CASE_ID}-`))
  cpSync(join(paths.holdoutRoot, 'base'), workspace, { recursive: true })
  writeFileSync(join(workspace, '.gitignore'), 'node_modules/\n.final-*.md\n')
  const tarball = packExactTarball(root, outputRoot)
  assertSafeFile(dirname(tarball), tarball, 'evaluation tarball')
  execFileSync('npm', ['install', '--ignore-scripts', '--no-save', '--package-lock=false', tarball], {
    cwd: workspace,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const installedRoot = join(workspace, 'node_modules', '@oevery', 'rsp')
  const skillRoot = join(workspace, '.agents', 'skills')
  mkdirSync(skillRoot, { recursive: true })
  for (const name of SKILLS)
    cpSync(join(installedRoot, 'skills', name), join(skillRoot, name), { recursive: true })
  const installedSkillHashes = Object.fromEntries(SKILLS.map((name) => {
    const path = join(skillRoot, name, 'SKILL.md')
    assertSafeFile(workspace, path, `installed Skill ${name}`)
    return [name, hashContent(readFileSync(path))]
  }))
  const installedSkillTreeHashes = Object.fromEntries(SKILLS.map(name => [name, hashTree(join(skillRoot, name))]))
  const publishedSkillEvidence = readPublishedSkillEvidence(installedRoot)
  const setupCommands = [
    'npm pack --ignore-scripts --json',
    `npm install --ignore-scripts --no-save --package-lock=false ${basename(tarball)}`,
    'npx --no-install rsp --help',
    'npx --no-install rsp init',
    `npx --no-install rsp focus ${CASE_ID}`,
    'npx --no-install rsp check --focused',
  ]
  const localHelp = execFileSync('npx', ['--no-install', 'rsp', '--help'], { cwd: workspace, encoding: 'utf8' })
  execFileSync('npx', ['--no-install', 'rsp', 'init'], { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'] })
  execFileSync('npx', ['--no-install', 'rsp', 'focus', CASE_ID], { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'] })
  const focusedCheck = execFileSync('npx', ['--no-install', 'rsp', 'check', '--focused'], { cwd: workspace, encoding: 'utf8' })
  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '-m', 'fixture base'])
  return {
    identities: {
      holdout_sha256: hashTree(paths.holdoutRoot),
      manifest_sha256: hashContent(readFileSync(paths.manifestPath)),
      oracle_sha256: hashContent(readFileSync(paths.oraclePath)),
    },
    manifest,
    oracle,
    package: {
      behavior_file_hashes: publishedSkillEvidence.behavior_file_hashes,
      installed_skill_hashes: installedSkillHashes,
      installed_skill_tree_hashes: installedSkillTreeHashes,
      local_bin_help_sha256: hashContent(localHelp),
      local_focused_check_sha256: hashContent(focusedCheck),
      name: '@oevery/rsp',
      published_skill_hashes: publishedSkillEvidence.skill_hashes,
      published_skill_tree_hashes: publishedSkillEvidence.skill_tree_hashes,
      sha256: hashContent(readFileSync(tarball)),
      skill_inventory: publishedSkillEvidence.skill_inventory,
      version: JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8')).version,
    },
    setupCommands,
    workspace,
  }
}

function runVerification(workspace, argv) {
  try {
    const stdout = execFileSync(argv[0], argv.slice(1), { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { argv, exit_code: 0, output_sha256: hashContent(stdout) }
  }
  catch (error) {
    return { argv, exit_code: error.status ?? null, output_sha256: hashContent(String(error.stdout ?? '')) }
  }
}

export function scoreNativeDesignEvidence({ designSectionOnly, durableBody, finalBodies, gitHeadUnchanged, manifest, oracle, packageEvidence, phaseBoundaries, phases, runtimeIsolation, verification }) {
  const combined = finalBodies.join('\n')
  const lower = combined.toLowerCase()
  const expectedMissing = manifest.expected_output.filter(fragment => !lower.includes(fragment.toLowerCase()))
  const forbiddenPresent = manifest.forbidden_output.filter((fragment) => {
    const escaped = fragment.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const withoutNegatedClaims = lower.replace(new RegExp(`(?:未声称|没有声称|并未声称|does not claim|did not claim)\\s*${escaped}`, 'giu'), '')
    return withoutNegatedClaims.includes(fragment.toLowerCase())
  })
  const chinesePhases = finalBodies.map(body => /[\u3400-\u9FFF]/u.test(body) && !FIXED_ENGLISH_RESPONSE_LABEL.test(body))
  const installedNames = Object.keys(packageEvidence.installed_skill_hashes).sort()
  const packageValid = /^[a-f0-9]{64}$/.test(packageEvidence.sha256)
    && JSON.stringify(installedNames) === JSON.stringify([...SKILLS].sort())
    && Object.values(packageEvidence.installed_skill_hashes).every(hash => /^[a-f0-9]{64}$/.test(hash))
  const durableLower = durableBody.toLowerCase()
  const durableSentences = durableBody.split(/[。\n]/u)
  const uniqueOwnerSentence = durableSentences.find(sentence => /桌面端?运行时/u.test(sentence)
    && /物理(?:设备|接收器)的?发现/u.test(sentence)
    && sentence.includes('所有者'))
  const uniqueOwnerNegated = uniqueOwnerSentence?.includes('不是') || uniqueOwnerSentence?.includes('并非')
  const uniqueOwnerPositive = Boolean(uniqueOwnerSentence?.includes('是')) && !uniqueOwnerNegated
  const naturalOwnerSentence = durableSentences.find(sentence => /物理(?:设备|接收器)的?发现/u.test(sentence)
    && /归桌面端?运行时所有/u.test(sentence))
  const naturalOwnerNegated = naturalOwnerSentence ? /(?:不|并非)归桌面端?运行时所有/u.test(naturalOwnerSentence) : false
  const naturalOwnerPositive = Boolean(naturalOwnerSentence) && !naturalOwnerNegated
  const desktopOwnershipNegated = /物理(?:设备|接收器)的?发现[^。\n]*(?:不属于|并非[^。\n]*属于|不应属于)[^。\n]*桌面端?运行时/u.test(durableBody)
    || /桌面端?运行时(?:不拥有|不负责|不独占|并非拥有|并非负责|并非独占)[^。\n]*物理(?:设备|接收器)的?发现/u.test(durableBody)
    || naturalOwnerNegated
    || uniqueOwnerNegated
  const desktopOwnershipPositive = /(?:desktop runtime|desktop|桌面端?运行时)[^\n]*(?:own|owns|拥有|负责|独占)[^\n]*(?:physical (?:device )?discovery|物理(?:设备|接收器)的?发现)/iu.test(durableBody)
    || /物理(?:设备|接收器)的?发现[^。\n]*(?:属于|归属于)[^。\n]*桌面端?运行时/u.test(durableBody)
    || naturalOwnerPositive
    || uniqueOwnerPositive
  const durableSemanticMatches = {
    desktop_owns_physical_discovery: desktopOwnershipPositive && !desktopOwnershipNegated,
    hardware_acceptance_unavailable: /(?:hardware|硬件)[^\n]*(?:unavailable|不可用|未执行)/iu.test(durableBody),
    runtime_neutral_projects_only: (/runtime-neutral/iu.test(durableBody) || durableBody.includes('运行时中立') || durableBody.includes('运行时无关'))
      && (/\bprojects?\b|projection/iu.test(durableBody) || durableBody.includes('投影')),
    web_does_not_discover: /web[^\n]*(?:does not (?:directly )?discover|不直接发现(?:或打开)?硬件|不得[^。\n]*直接发现(?:或打开)?硬件|不能[^。\n]*发现[^。\n]*硬件)/iu.test(durableBody),
  }
  const durableRequired = Object.entries(oracle.durable_current_facts.required)
    .every(([key, alternatives]) => alternatives.some(fragment => durableLower.includes(fragment.toLowerCase())) || durableSemanticMatches[key] === true)
  const durableForbidden = oracle.durable_current_facts.forbidden
    .some(fragment => durableLower.includes(fragment.toLowerCase()))
  const durableValid = durableRequired
    && !durableForbidden
    && !/planned|proposal|future work/i.test(durableBody)
  const phaseRunsPassed = phases.length === PHASES.length
    && phases.every((phase, index) => phase.name === PHASES[index] && phase.exit_code === 0 && !phase.timed_out)
  const implementationCommands = phases.find(phase => phase.name === 'implement')?.observations?.filter(item => item.kind === 'command').map(item => item.command).join('\n') ?? ''
  const reviewCommands = phases.find(phase => phase.name === 'review')?.observations?.filter(item => item.kind === 'command').map(item => item.command).join('\n') ?? ''
  const gates = {
    design_returns_workref: finalBodies[0]?.includes(CASE_ID) === true,
    design_section_only: designSectionOnly,
    durable_current_fact: durableValid,
    exact_package: packageValid,
    external_verification: verification.exit_code === 0,
    git_head_unchanged: gitHeadUnchanged,
    hardware_unavailable: /hardware|硬件/iu.test(combined) && /unavailable|不可用/iu.test(combined),
    human_output_language: chinesePhases.every(Boolean),
    implementation_rereads_change: implementationCommands.includes('.rsp/changes/device-discovery-boundary.md'),
    implementation_runs_exact_verification: implementationCommands.includes('mise exec -- pnpm test -- device-discovery'),
    output_contract: expectedMissing.length === 0 && forbiddenPresent.length === 0,
    phase_boundaries: phaseBoundaries.passed,
    phase_runs: phaseRunsPassed,
    review_inspects_fixed_scope: /git\s+diff/i.test(reviewCommands)
      && reviewCommands.includes('client/packages/device-discovery/src/index.ts')
      && reviewCommands.includes('test/device-discovery.test.mjs'),
    review_read_only_sandbox: phases.find(phase => phase.name === 'review')?.sandbox === 'read-only',
    runtime_isolation: runtimeIsolation.passed,
  }
  return {
    blockers: Object.entries(gates).filter(([, passed]) => !passed).map(([gate]) => gate),
    expected_missing: expectedMissing,
    forbidden_present: forbiddenPresent,
    gates,
    passed: Object.values(gates).every(Boolean),
  }
}

export async function runRealNativeDesignComposition({ effort = 'low', model = 'gpt-5.6-terra', outputRoot, persistRoot, provider = 'custom', root, timeoutMs = 240000 }) {
  const prepared = prepareWorkspace(root, outputRoot)
  const headBefore = git(prepared.workspace, ['rev-parse', 'HEAD'])
  const baselineChange = readFileSync(join(prepared.workspace, '.rsp', 'changes', `${CASE_ID}.md`), 'utf8')
  let before = snapshotWorkspace(prepared.workspace)
  let designPhaseChange = baselineChange
  const phases = []
  const phaseChanges = {}
  for (const prompt of phasePrompts()) {
    const reviewFinal = phases.find(phase => phase.name === 'review')?.final
    const phasePrompt = prompt.name === 'durable'
      ? { ...prompt, text: `${prompt.text}\n\nFresh read-only review result (temporary evidence, not project truth):\n${reviewFinal ?? 'unavailable'}` }
      : prompt
    const phase = await runHostPhase({ effort, model, phase: phasePrompt, provider, timeoutMs, workspace: prepared.workspace })
    const after = snapshotWorkspace(prepared.workspace)
    phaseChanges[prompt.name] = changedBetween(before, after)
    phases.push({ ...phase, name: prompt.name })
    if (prompt.name === 'design')
      designPhaseChange = readFileSync(join(prepared.workspace, '.rsp', 'changes', `${CASE_ID}.md`), 'utf8')
    before = after
  }
  const designSectionOnly = masksOnlyDesign(baselineChange, designPhaseChange)
  const phaseBoundaries = validateNativeDesignPhaseChanges(prepared.manifest, phaseChanges)
  const runtimeIsolation = validateNativeDesignRuntimeIsolation(phases)
  const verification = runVerification(prepared.workspace, prepared.manifest.verification)
  const totalChangedPaths = changedPaths(prepared.workspace).filter(path => !path.startsWith('.final-'))
  const unauthorizedPaths = totalChangedPaths.filter(path => !prepared.manifest.allowed_changes.includes(path))
  const durablePath = join(prepared.workspace, 'docs', 'architecture', `${CASE_ID}.md`)
  const durableBody = existsSync(durablePath) ? readFileSync(durablePath, 'utf8') : ''
  const score = scoreNativeDesignEvidence({
    designSectionOnly,
    durableBody,
    finalBodies: phases.map(phase => phase.final),
    gitHeadUnchanged: git(prepared.workspace, ['rev-parse', 'HEAD']) === headBefore,
    manifest: prepared.manifest,
    oracle: prepared.oracle,
    packageEvidence: prepared.package,
    phaseBoundaries,
    phases,
    runtimeIsolation,
    verification,
  })
  if (unauthorizedPaths.length > 0) {
    score.passed = false
    score.blockers.push('changed_allowlist')
  }
  const events = phases.flatMap(phase => phase.observations.map(observation => ({ ...observation, phase: phase.name })))
  const metadata = {
    case_id: CASE_ID,
    changed_paths: totalChangedPaths,
    design_section_only: designSectionOnly,
    durable_artifact: {
      path: DURABLE_ARTIFACT,
      sha256: hashContent(sanitize(durableBody)),
    },
    events_sha256: hashContent(`${JSON.stringify(events, null, 2)}\n`),
    exact_commands: [...prepared.setupCommands, prepared.manifest.verification.join(' ')],
    git_head_unchanged: git(prepared.workspace, ['rev-parse', 'HEAD']) === headBefore,
    identities: prepared.identities,
    model,
    package: prepared.package,
    phase_boundaries: phaseBoundaries,
    phase_changes: phaseChanges,
    phases: phases.map(({ final, observations, ...phase }) => ({ ...phase, observation_count: observations.length })),
    provider,
    result: score.passed ? 'passed' : 'failed',
    runtime_isolation: runtimeIsolation,
    unauthorized_paths: unauthorizedPaths,
    verification,
  }
  const evidenceSha = hashContent(JSON.stringify({
    durable_artifact_sha256: metadata.durable_artifact.sha256,
    events_sha256: metadata.events_sha256,
    final_hashes: metadata.phases.map(phase => phase.final_hash),
    metadata,
  }))
  const retainedScore = { ...score, evidence_sha256: evidenceSha }
  mkdirSync(persistRoot, { recursive: true })
  archivePreviousAttempt(persistRoot)
  writeFileSync(join(persistRoot, 'metadata.json'), `${sanitize(JSON.stringify(metadata, null, 2))}\n`)
  writeFileSync(join(persistRoot, DURABLE_ARTIFACT), sanitize(durableBody))
  phases.forEach(phase => writeFileSync(join(persistRoot, `phase-${phase.name}-final.md`), sanitize(phase.final)))
  writeFileSync(join(persistRoot, 'events.json'), `${sanitize(JSON.stringify(events, null, 2))}\n`)
  writeFileSync(join(persistRoot, 'score.json'), `${JSON.stringify(retainedScore, null, 2)}\n`)
  return { metadata, score: retainedScore }
}

export function rescoreNativeDesignAttempt({ attemptRoot, persistRoot, reason, root }) {
  assert(reason?.trim(), 'native-design rescore requires a reason')
  const required = ['metadata.json', 'events.json', DURABLE_ARTIFACT, ...PHASES.map(phase => `phase-${phase}-final.md`)]
  for (const name of required)
    assertSafeFile(attemptRoot, join(attemptRoot, name), `rescore source ${name}`)

  const sourceMetadata = JSON.parse(readFileSync(join(attemptRoot, 'metadata.json'), 'utf8'))
  assert(sourceMetadata.result === 'failed', 'native-design rescore source must be a failed attempt')
  const eventsRaw = readFileSync(join(attemptRoot, 'events.json'), 'utf8')
  const events = JSON.parse(eventsRaw)
  const durableBody = readFileSync(join(attemptRoot, DURABLE_ARTIFACT), 'utf8')
  const finals = PHASES.map(phase => readFileSync(join(attemptRoot, `phase-${phase}-final.md`), 'utf8'))
  const phases = sourceMetadata.phases.map(phase => ({
    ...phase,
    observations: events.filter(event => event.phase === phase.name).map(({ phase: _phase, ...event }) => event),
  }))
  const { manifest, oracle } = loadNativeDesignContract(root)
  const score = scoreNativeDesignEvidence({
    designSectionOnly: sourceMetadata.design_section_only === true,
    durableBody,
    finalBodies: finals,
    gitHeadUnchanged: sourceMetadata.git_head_unchanged === true,
    manifest,
    oracle,
    packageEvidence: sourceMetadata.package,
    phaseBoundaries: validateNativeDesignPhaseChanges(manifest, sourceMetadata.phase_changes ?? {}),
    phases,
    runtimeIsolation: validateNativeDesignRuntimeIsolation(phases),
    verification: sourceMetadata.verification ?? {},
  })
  if ((sourceMetadata.unauthorized_paths ?? []).length > 0) {
    score.passed = false
    score.blockers.push('changed_allowlist')
  }
  assert(score.passed, `native-design rescore still fails: ${score.blockers.join(', ')}`)

  const metadata = {
    ...sourceMetadata,
    rescore: {
      reason: reason.trim(),
      source_attempt: relative(root, attemptRoot).replaceAll('\\', '/'),
    },
    result: 'passed',
  }
  const evidenceSha = hashContent(JSON.stringify({
    durable_artifact_sha256: metadata.durable_artifact?.sha256,
    events_sha256: metadata.events_sha256,
    final_hashes: metadata.phases.map(phase => phase.final_hash),
    metadata,
  }))
  const retainedScore = { ...score, evidence_sha256: evidenceSha }

  mkdirSync(persistRoot, { recursive: true })
  archivePreviousAttempt(persistRoot)
  cpSync(join(attemptRoot, DURABLE_ARTIFACT), join(persistRoot, DURABLE_ARTIFACT))
  cpSync(join(attemptRoot, 'events.json'), join(persistRoot, 'events.json'))
  for (const phase of PHASES)
    cpSync(join(attemptRoot, `phase-${phase}-final.md`), join(persistRoot, `phase-${phase}-final.md`))
  writeFileSync(join(persistRoot, 'metadata.json'), `${sanitize(JSON.stringify(metadata, null, 2))}\n`)
  writeFileSync(join(persistRoot, 'score.json'), `${JSON.stringify(retainedScore, null, 2)}\n`)
  return { metadata, score: retainedScore }
}

export function evaluateNativeDesignComposition(root, options = {}) {
  const { manifest, paths } = loadNativeDesignContract(root)
  const runRoot = options.runRoot ?? join(paths.evaluationRoot, 'real-runs', RETAINED_RUN_ID)
  const required = ['metadata.json', 'events.json', 'score.json', DURABLE_ARTIFACT, ...PHASES.map(phase => `phase-${phase}-final.md`)]
  const missing = required.filter(name => !existsSync(join(runRoot, name)))
  if (missing.length > 0) {
    return {
      blockers: [`missing retained real-run evidence: ${missing.join(', ')}`],
      evidence_class: 'same-case-real-host-observations',
      exact_package_sha256: null,
      passed: false,
      published_skill_inventory: readPublishedSkillEvidence(root).skill_inventory,
      recommendation: 'hold-release-preparation',
    }
  }
  for (const name of required)
    assertSafeFile(runRoot, join(runRoot, name), `retained ${name}`)
  const metadata = JSON.parse(readFileSync(join(runRoot, 'metadata.json'), 'utf8'))
  const eventsRaw = readFileSync(join(runRoot, 'events.json'), 'utf8')
  const events = JSON.parse(eventsRaw)
  const score = JSON.parse(readFileSync(join(runRoot, 'score.json'), 'utf8'))
  const durableBody = readFileSync(join(runRoot, DURABLE_ARTIFACT), 'utf8')
  const finals = PHASES.map(phase => readFileSync(join(runRoot, `phase-${phase}-final.md`), 'utf8'))
  const finalHashesMatch = metadata.phases.length === PHASES.length
    && metadata.phases.every((phase, index) => phase.name === PHASES[index] && phase.final_hash === hashContent(finals[index]))
  const eventsHashMatches = metadata.events_sha256 === hashContent(eventsRaw)
  const durableArtifactMatches = metadata.durable_artifact?.path === DURABLE_ARTIFACT
    && metadata.durable_artifact?.sha256 === hashContent(durableBody)
  const evidenceSha = hashContent(JSON.stringify({
    durable_artifact_sha256: metadata.durable_artifact?.sha256,
    events_sha256: metadata.events_sha256,
    final_hashes: metadata.phases.map(phase => phase.final_hash),
    metadata,
  }))
  const retainedIntegrity = durableArtifactMatches && finalHashesMatch && eventsHashMatches && score.evidence_sha256 === evidenceSha
  const packageSkills = Object.keys(metadata.package?.installed_skill_hashes ?? {}).sort()
  const packageIdentity = /^[a-f0-9]{64}$/.test(metadata.package?.sha256 ?? '')
    && JSON.stringify(packageSkills) === JSON.stringify([...SKILLS].sort())
    && Object.values(metadata.package.installed_skill_hashes).every(hash => /^[a-f0-9]{64}$/.test(hash))
  const exactCommands = ['npx --no-install rsp --help', 'npx --no-install rsp check --focused', 'mise exec -- pnpm test -- device-discovery']
    .every(command => metadata.exact_commands?.includes(command))
  const inputIdentity = metadata.identities?.holdout_sha256 === hashTree(paths.holdoutRoot)
    && metadata.identities?.manifest_sha256 === hashContent(readFileSync(paths.manifestPath))
    && metadata.identities?.oracle_sha256 === hashContent(readFileSync(paths.oraclePath))
  const reconstructedPhases = metadata.phases.map(phase => ({
    ...phase,
    observations: events.filter(event => event.phase === phase.name).map(({ phase: _phase, ...event }) => event),
  }))
  const recomputedPhaseBoundaries = validateNativeDesignPhaseChanges(manifest, metadata.phase_changes ?? {})
  const recomputedRuntimeIsolation = validateNativeDesignRuntimeIsolation(reconstructedPhases)
  const recomputedScore = scoreNativeDesignEvidence({
    designSectionOnly: metadata.design_section_only === true,
    durableBody,
    finalBodies: finals,
    gitHeadUnchanged: metadata.git_head_unchanged === true,
    manifest,
    oracle: loadNativeDesignContract(root).oracle,
    packageEvidence: metadata.package,
    phaseBoundaries: recomputedPhaseBoundaries,
    phases: reconstructedPhases,
    runtimeIsolation: recomputedRuntimeIsolation,
    verification: metadata.verification ?? {},
  })
  if ((metadata.unauthorized_paths ?? []).length > 0) {
    recomputedScore.passed = false
    recomputedScore.blockers.push('changed_allowlist')
  }
  const { evidence_sha256: _evidenceSha, ...retainedScorePayload } = score
  const retainedScorePayloadMatches = JSON.stringify(retainedScorePayload) === JSON.stringify(recomputedScore)
  const currentArtifact = validateCurrentNativeDesignArtifact(root, metadata.package)
  const gates = {
    current_release_artifact: currentArtifact.passed,
    durable_artifact: durableArtifactMatches,
    exact_commands: exactCommands,
    exact_package: packageIdentity,
    external_verification: metadata.verification?.exit_code === 0,
    git_head_unchanged: metadata.git_head_unchanged === true,
    input_identity: inputIdentity,
    no_unauthorized_paths: metadata.unauthorized_paths?.length === 0,
    phase_boundaries: metadata.phase_boundaries?.passed === true,
    retained_integrity: retainedIntegrity,
    retained_score_payload: retainedScorePayloadMatches,
    run_passed: metadata.result === 'passed' && recomputedScore.passed === true,
    runtime_isolation: recomputedRuntimeIsolation.passed && metadata.runtime_isolation?.passed === true,
  }
  const passed = Object.values(gates).every(Boolean)
  return {
    blockers: Object.entries(gates).filter(([, value]) => !value).map(([key]) => key),
    evidence_class: 'same-case-real-host-observations',
    events: events.length,
    exact_package_sha256: packageIdentity ? metadata.package.sha256 : null,
    gates,
    published_skill_inventory: currentArtifact.current.skill_inventory,
    passed,
    recommendation: passed ? 'resume-release-preparation' : 'hold-release-preparation',
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const runReal = process.argv.includes('--run-real')
  const rescoreIndex = process.argv.indexOf('--rescore-attempt')
  const rescoreReasonIndex = process.argv.indexOf('--rescore-reason')
  const rescoreAttempt = rescoreIndex >= 0 ? process.argv[rescoreIndex + 1] : undefined
  const rescoreReason = rescoreReasonIndex >= 0 ? process.argv[rescoreReasonIndex + 1] : undefined
  assert(rescoreIndex < 0 || rescoreAttempt, '--rescore-attempt requires a path')
  assert(rescoreIndex < 0 || rescoreReason, '--rescore-reason requires a value')
  const result = rescoreAttempt
    ? rescoreNativeDesignAttempt({
        attemptRoot: resolve(root, rescoreAttempt),
        persistRoot: join(root, ...EVALUATION_PATH, 'real-runs', RETAINED_RUN_ID),
        reason: rescoreReason,
        root,
      })
    : runReal
      ? await runRealNativeDesignComposition({
          outputRoot: join(root, '.cache', 'rsp-native-design-composition'),
          persistRoot: join(root, ...EVALUATION_PATH, 'real-runs', RETAINED_RUN_ID),
          root,
        })
      : evaluateNativeDesignComposition(root)
  console.log(JSON.stringify(result, null, 2))
  if (runReal || rescoreAttempt ? !result.score.passed : !result.passed)
    process.exitCode = 1
}
