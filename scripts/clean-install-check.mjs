#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse as parseYaml } from 'yaml'

const EXPECTED_DEFAULT_SKILLS = [
  'rsp',
  'rsp-commit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-land',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-resolve-findings',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
  'rsp-verify',
  'rsp-workspace',
]
const OPTIONAL_SKILL = 'rsp-structural-audit'
const EXPECTED_PACKAGED_SKILLS = [...EXPECTED_DEFAULT_SKILLS, OPTIONAL_SKILL].sort()
const EXPECTED_DESIGN_REFERENCES = [
  'domain-modeling.md',
  'module-seams.md',
  'reversible-exploration.md',
]
const EXPECTED_CORE_REFERENCES = [
  'conflict-handling.md',
  'durable-review.md',
  'groups-dependencies.md',
  'managed-routing.md',
  'release-operations.md',
  'reopen-recovery.md',
  'response-language.md',
  'setup-repair.md',
]
const EXPECTED_RELEASE_REFERENCES = [
  'convention-discovery.md',
  'evidence-and-surfaces.md',
  'output-contracts.md',
  'publication-lifecycle.md',
]
const EXPECTED_MANAGE_REFERENCES = [
  'closeout.md',
  'interruption-recovery.md',
  'review-convergence.md',
]
const EXPECTED_REVIEW_REFERENCES = [
  'code-review.md',
  'document-review.md',
]
const EXPECTED_SHAPE_REFERENCES = [
  'complex-shaping.md',
  'deep-clarification.md',
  'external-issue-input.md',
]
const EXPECTED_DIST_ENTRIES = [
  'dist/broker-daemon.mjs',
  'dist/cli.mjs',
  'dist/manage-runtime.mjs',
  'dist/runtime-store.mjs',
  'dist/web-projector.mjs',
]
const EXPECTED_STATIC_PACKAGE_FILES = [
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
  'bin/rsp.mjs',
  'package.json',
  'rules/rsp-rules.md',
  ...EXPECTED_PACKAGED_SKILLS.map(name => `skills/${name}/SKILL.md`),
  'skills/rsp-implement/NOTICE.md',
  ...EXPECTED_DESIGN_REFERENCES.map(name => `skills/rsp-design/references/${name}`),
  ...EXPECTED_CORE_REFERENCES.map(name => `skills/rsp/references/${name}`),
  ...EXPECTED_RELEASE_REFERENCES.map(name => `skills/rsp-release-docs/references/${name}`),
  ...EXPECTED_MANAGE_REFERENCES.map(name => `skills/rsp-manage/references/${name}`),
  ...EXPECTED_REVIEW_REFERENCES.map(name => `skills/rsp-review/references/${name}`),
  ...EXPECTED_SHAPE_REFERENCES.map(name => `skills/rsp-shape/references/${name}`),
  'skills/rsp-structural-audit/references/structural-lenses.md',
  'web/static/app.css',
  'web/static/app.js',
  'web/static/index.html',
].sort()
const FORBIDDEN_PACKAGE_ROOTS = ['.agents', '.cache', '.codex', '.rsp', 'research', 'scripts']
const PORTABLE_FRONTMATTER_KEYS = new Set(['description', 'license', 'metadata', 'name'])

function argument(name) {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}

function fail(message) {
  throw new Error(message)
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function runResult(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
}

function processExists(pid) {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    if (error?.code === 'ESRCH')
      return false
    throw error
  }
}

function waitForProcessExit(pid, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs
  const sleeper = new Int32Array(new SharedArrayBuffer(4))
  while (Date.now() < deadline) {
    if (!processExists(pid))
      return true
    Atomics.wait(sleeper, 0, 0, 25)
  }
  return !processExists(pid)
}

function parseJsonIfPossible(content) {
  try {
    return JSON.parse(content)
  }
  catch {
    return undefined
  }
}

function boundedProcessDiagnostic(content) {
  const redacted = String(content ?? '')
    .trim()
    .replace(/Bearer\s+[\w.~+/=-]+/giu, 'Bearer [redacted]')
    .replace(/("(?:accessToken|bootstrapToken|controlToken|webToken)"\s*:\s*)"[^"]*"/giu, '$1"[redacted]"')
  const maximum = 4096
  return redacted.length <= maximum
    ? redacted
    : `${redacted.slice(0, maximum)}…[truncated ${redacted.length - maximum} chars]`
}

function processFailureDiagnostic(result) {
  return [
    `status=${result.status ?? 'null'}`,
    `signal=${result.signal ?? 'none'}`,
    `stdout=${JSON.stringify(boundedProcessDiagnostic(result.stdout))}`,
    `stderr=${JSON.stringify(boundedProcessDiagnostic(result.stderr))}`,
  ].join('; ')
}

function recordBrokerPidFromOutput(content) {
  const pid = parseJsonIfPossible(content)?.broker?.pid
  if (!Number.isSafeInteger(pid) || pid <= 0)
    return undefined
  const observationPath = process.env.RSP_PACKAGE_CHECK_TEST_BROKER_PID_FILE
  if (observationPath)
    writeFileSync(observationPath, `${pid}\n`)
  return pid
}

function brokerStartOutputForValidation(content) {
  const injection = process.env.RSP_PACKAGE_CHECK_TEST_BROKER_START_OUTPUT
  if (!injection)
    return content
  if (injection === 'invalid-json')
    return '{'
  if (injection === 'invalid-fields') {
    const output = parseJsonIfPossible(content)
    return JSON.stringify({ ...output, state: 'invalid' })
  }
  fail(`Unsupported Broker start output test injection: ${injection}`)
}

function runInstalledWebSmoke(options) {
  const result = runResult(process.execPath, [
    '--input-type=module',
    '--eval',
    [
      'const { readFile } = await import("node:fs/promises")',
      'if (process.env.RSP_PACKAGE_CHECK_TEST_WEB_SMOKE_FAILURE === "exit-17") {',
      '  const { writeSync } = await import("node:fs")',
      '  writeSync(1, "web-smoke-stdout\\n")',
      '  writeSync(2, "web-smoke-stderr\\n")',
      '  process.exit(17)',
      '}',
      'const record = JSON.parse(await readFile(process.env.RSP_WEB_DISCOVERY, "utf8"))',
      'const endpoint = record.endpoint',
      'const request = async (path, init = {}) => {',
      '  const response = await fetch(endpoint + path, { redirect: "error", ...init })',
      '  const value = await response.json().catch(() => null)',
      '  return { response, value }',
      '}',
      'const sseBuffers = new WeakMap()',
      'const readSse = async (reader) => {',
      '  const decoder = new TextDecoder()',
      '  let content = sseBuffers.get(reader) || ""',
      '  while (!content.includes("\\n\\n")) {',
      '    const result = await reader.read()',
      '    if (result.done) throw new Error("managed SSE ended before one event")',
      '    content += decoder.decode(result.value, { stream: true })',
      '  }',
      '  const boundary = content.indexOf("\\n\\n")',
      '  const block = content.slice(0, boundary)',
      '  sseBuffers.set(reader, content.slice(boundary + 2))',
      '  const data = block.split("\\n").filter(line => line.startsWith("data: ")).map(line => line.slice(6)).join("\\n")',
      '  return { block, value: JSON.parse(data) }',
      '}',
      'const registered = await request("/v1/projects/register", {',
      '  method: "POST",',
      '  headers: { Authorization: "Bearer " + record.controlToken, "Content-Type": "application/json" },',
      '  body: JSON.stringify({ root: process.env.RSP_WEB_PROJECT_ROOT }),',
      '})',
      'if (registered.response.status !== 200 || registered.value?.ok !== true)',
      '  throw new Error("project registration failed")',
      'const projectId = registered.value.project.projectId',
      'const accessToken = registered.value.accessToken',
      'const pageUrl = endpoint + "/web/" + projectId + "/"',
      'const page = await fetch(pageUrl, { redirect: "error" })',
      'const pageText = await page.text()',
      'const css = await fetch(endpoint + "/web/assets/app.css", { redirect: "error" })',
      'const cssText = await css.text()',
      'const script = await fetch(endpoint + "/web/assets/app.js", { redirect: "error" })',
      'const scriptText = await script.text()',
      'const minted = await request("/v1/projects/" + projectId + "/web/bootstrap", {',
      '  method: "POST",',
      '  headers: { Authorization: "Bearer " + accessToken },',
      '})',
      'const authorized = await request("/v1/web/bootstrap", {',
      '  method: "POST",',
      '  headers: { Origin: endpoint, "Content-Type": "application/json" },',
      '  body: JSON.stringify({ projectId, bootstrapToken: minted.value?.bootstrapToken }),',
      '})',
      'const webHeaders = { Origin: endpoint, Authorization: "Bearer " + authorized.value?.webToken }',
      'const stream = await fetch(endpoint + "/v1/web/projects/" + projectId + "/events", {',
      '  headers: { ...webHeaders, Accept: "text/event-stream" },',
      '  redirect: "error",',
      '})',
      'const streamReader = stream.body.getReader()',
      'const initialEvent = await readSse(streamReader)',
      'const snapshot = await request("/v1/web/projects/" + projectId + "/snapshot", {',
      '  headers: webHeaders,',
      '})',
      'const observe = async (operation, input) => request("/v1/projects/" + projectId + "/runtime/manage", {',
      '  method: "POST",',
      '  headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },',
      '  body: JSON.stringify({ operation, input }),',
      '})',
      'await observe("observe-run", {',
      '  runId: "package-web-run", runKey: "package-web-run-key", workRef: "package-smoke",',
      '  managerId: "package-web-manager", eventId: "package-web-start", idempotencyKey: "package-web-start-key",',
      '  phase: "verification", authorityRefs: ["AGENTS.md"], evidenceRefs: ["package-web-smoke"],',
      '})',
      'const liveEvent = await readSse(streamReader)',
      'const dispatchInput = {',
      '  runId: "package-web-run", dispatchId: "package-web-dispatch", idempotencyKey: "package-web-dispatch-key",',
      '  lane: "verify", workerId: "package-web-worker", objectiveRef: "installed managed Web smoke",',
      '  evidenceRefs: ["package-web-smoke"], stopBoundary: "same-scope",',
      '}',
      'await observe("observe-dispatch", dispatchInput)',
      'await observe("observe-dispatch", dispatchInput)',
      'const refreshed = await request("/v1/web/projects/" + projectId + "/refresh", {',
      '  method: "POST", headers: webHeaders,',
      '})',
      'const lookupId = refreshed.value?.snapshot?.managed?.runs?.[0]?.lookupId',
      'const detail = await request("/v1/web/projects/" + projectId + "/runs/detail?runId=" + encodeURIComponent(lookupId), {',
      '  headers: webHeaders,',
      '})',
      'const gapStream = await fetch(endpoint + "/v1/web/projects/" + projectId + "/events", {',
      '  headers: { ...webHeaders, Accept: "text/event-stream", "Last-Event-ID": "999" },',
      '  redirect: "error",',
      '})',
      'const gapReader = gapStream.body.getReader()',
      'const gapEvent = await readSse(gapReader)',
      'await gapReader.cancel()',
      'await streamReader.cancel()',
      'const leaked = [pageText, cssText, scriptText].some(content => content.includes(accessToken)',
      '  || content.includes(record.controlToken)',
      '  || content.includes(process.env.RSP_WEB_PROJECT_ROOT))',
      'process.stdout.write(JSON.stringify({',
      '  page: page.status,',
      '  css: css.status,',
      '  script: script.status,',
      '  marker: pageText.includes("RSP Web Observatory")',
      '    && scriptText.includes("createRoot")',
      '    && scriptText.includes("Stale snapshot")',
      '    && scriptText.includes("Managed runtime unavailable"),',
      '  leaked,',
      '  csp: page.headers.get("content-security-policy"),',
      '  referrer: page.headers.get("referrer-policy"),',
      '  snapshot: snapshot.response.status,',
      '  projection: snapshot.value?.snapshot?.projection,',
      '  projectMatch: snapshot.value?.snapshot?.source?.projectId === projectId,',
      '  managedUnavailable: snapshot.value?.snapshot?.managed?.available === false,',
      '  managedRuns: refreshed.value?.snapshot?.managed?.runs?.length,',
      '  detail: detail.response.status,',
      '  detailFreshness: detail.value?.projection?.freshness?.state,',
      '  duplicate: detail.value?.projection?.run?.dispatches?.[0]?.duplicateCount,',
      '  timelineDispatches: detail.value?.projection?.run?.timeline?.filter(item => item.type === "dispatch").length,',
      '  sse: stream.status === 200 && initialEvent.value?.type === "managed-projection" && liveEvent.value?.type === "managed-projection",',
      '  gap: gapEvent.value?.type === "managed-gap",',
      '}))',
    ].join('\n'),
  ], {
    cwd: options.projectRoot,
    env: {
      ...process.env,
      RSP_WEB_DISCOVERY: options.discovery,
      RSP_WEB_PROJECT_ROOT: options.projectRoot,
    },
  })
  const output = result.status === 0 ? parseJsonIfPossible(result.stdout) : null
  if (result.status !== 0
    || output?.page !== 200
    || output?.css !== 200
    || output?.script !== 200
    || output?.marker !== true
    || output?.leaked !== false
    || output?.snapshot !== 200
    || output?.projection?.major !== 1
    || output?.projection?.minor !== 1
    || output?.projectMatch !== true
    || output?.managedUnavailable !== true
    || output?.managedRuns !== 1
    || output?.detail !== 200
    || output?.detailFreshness !== 'stale'
    || output?.duplicate !== 1
    || output?.timelineDispatches !== 1
    || output?.sse !== true
    || output?.gap !== true
    || !String(output?.csp).includes(`default-src 'none'`)
    || output?.referrer !== 'no-referrer') {
    fail(`Installed Web Observatory smoke failed: ${processFailureDiagnostic(result)}`)
  }
  return {
    commandSafe: true,
    page: output.page,
    assets: true,
    projection: '1.1',
    managed: true,
    projectIsolation: true,
    securityHeaders: true,
  }
}

function walkNoSymlinks(root) {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    const stats = lstatSync(path)
    if (stats.isSymbolicLink())
      fail(`Installed package contains symlink: ${relative(root, path)}`)
    if (stats.isDirectory())
      files.push(...walkNoSymlinks(path))
    else
      files.push(path)
  }
  return files
}

function validateSkill(skillRoot, name) {
  const skillPath = join(skillRoot, name)
  const stats = lstatSync(skillPath)
  if (!stats.isDirectory() || stats.isSymbolicLink())
    fail(`Skill must be a real directory: ${name}`)

  const skillFile = join(skillPath, 'SKILL.md')
  const skillStats = lstatSync(skillFile)
  if (!skillStats.isFile() || skillStats.isSymbolicLink())
    fail(`Skill entrypoint must be a regular file: ${name}/SKILL.md`)

  const content = readFileSync(skillFile, 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n[\s\S]+$/u)
  if (!match)
    fail(`Skill entrypoint has invalid frontmatter: ${name}/SKILL.md`)
  const frontmatter = parseYaml(match[1])
  if (!frontmatter || typeof frontmatter !== 'object')
    fail(`Skill frontmatter must be a mapping: ${name}/SKILL.md`)
  if (frontmatter.name !== name)
    fail(`Skill name mismatch: expected ${name}, received ${String(frontmatter.name)}`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(frontmatter.name) || frontmatter.name.length > 64)
    fail(`Skill name is not portable: ${name}/SKILL.md`)
  if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '')
    fail(`Skill description is missing: ${name}/SKILL.md`)
  if (frontmatter.description.length > 1024)
    fail(`Skill description is too long: ${name}/SKILL.md`)
  if (!Object.keys(frontmatter).every(key => PORTABLE_FRONTMATTER_KEYS.has(key)))
    fail(`Skill frontmatter contains unsupported keys: ${name}/SKILL.md`)
  if (frontmatter.license !== undefined && typeof frontmatter.license !== 'string')
    fail(`Skill license must be a string: ${name}/SKILL.md`)
  if (frontmatter.metadata !== undefined
    && (typeof frontmatter.metadata !== 'object'
      || frontmatter.metadata === null
      || !Object.values(frontmatter.metadata).every(value => typeof value === 'string'))) {
    fail(`Skill metadata must contain only string values: ${name}/SKILL.md`)
  }
}

function assertPackageInventory(root, files) {
  for (const path of files) {
    const packageRoot = path.split('/', 1)[0]
    if (FORBIDDEN_PACKAGE_ROOTS.includes(packageRoot))
      fail(`Forbidden package root included: ${path}`)
  }
  const expected = expectedPackageInventory(root)
  const expectedSet = new Set(expected)
  const actualSet = new Set(files)
  const missing = expected.filter(path => !actualSet.has(path))
  const unexpected = files.filter(path => !expectedSet.has(path))
  if (missing.length > 0 || unexpected.length > 0) {
    fail([
      'Package inventory does not match the declared release inventory',
      ...(missing.length > 0 ? [`missing: ${missing.join(', ')}`] : []),
      ...(unexpected.length > 0 ? [`unexpected: ${unexpected.join(', ')}`] : []),
    ].join('; '))
  }
}

function expectedPackageInventory(root) {
  const distFiles = new Set()
  const visit = (path) => {
    if (distFiles.has(path))
      return
    const absolutePath = join(root, ...path.split('/'))
    if (!existsSync(absolutePath))
      fail(`Declared dist entry is missing: ${path}`)
    distFiles.add(path)
    const content = readFileSync(absolutePath, 'utf8')
    for (const pattern of [
      /\bfrom\s*["'](\.\/[^"']+\.mjs)["']/gu,
      /\bimport\s*["'](\.\/[^"']+\.mjs)["']/gu,
      /\bimport\s*\(\s*["'](\.\/[^"']+\.mjs)["']\s*\)/gu,
    ]) {
      for (const match of content.matchAll(pattern)) {
        const imported = relative(root, resolve(dirname(absolutePath), match[1]))
          .split(sep)
          .join('/')
        if (!imported.startsWith('dist/'))
          fail(`Dist entry imports outside the package dist boundary: ${path} -> ${match[1]}`)
        visit(imported)
      }
    }
  }
  for (const entry of EXPECTED_DIST_ENTRIES)
    visit(entry)
  return [...EXPECTED_STATIC_PACKAGE_FILES, ...distFiles].sort()
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const npmCli = argument('--npm-cli')
  const runNpm = (args, options = {}) => npmCli
    ? run(process.execPath, [resolve(npmCli), ...args], options)
    : run('npm', args, options)
  const temporaryParent = resolve(process.env.RSP_PACKAGE_CHECK_TMP_ROOT || tmpdir())
  mkdirSync(temporaryParent, { recursive: true })
  const workspace = mkdtempSync(join(temporaryParent, 'rsp-clean-install-'))
  let report

  try {
    const packRoot = join(workspace, 'pack')
    const projectRoot = join(workspace, 'project')
    const execRoot = join(workspace, 'exec-project')
    mkdirSync(packRoot)
    mkdirSync(projectRoot)
    mkdirSync(execRoot)
    writeFileSync(join(projectRoot, 'package.json'), '{"name":"rsp-clean-install-smoke","private":true}\n')
    writeFileSync(join(execRoot, 'package.json'), '{"name":"rsp-npm-exec-smoke","private":true}\n')

    const packOutput = runNpm([
      'pack',
      '--ignore-scripts',
      '--foreground-scripts=false',
      '--json',
      '--pack-destination',
      packRoot,
    ], { cwd: root })
    const packResults = JSON.parse(packOutput)
    if (!Array.isArray(packResults) || packResults.length !== 1)
      fail('npm pack did not produce exactly one tarball')
    const packResult = packResults[0]
    const tarball = join(packRoot, basename(packResult.filename))
    const packageFiles = [
      ...packResult.files.map(file => file.path),
      ...(process.env.RSP_PACKAGE_CHECK_TEST_INVENTORY_EXTRA
        ? [process.env.RSP_PACKAGE_CHECK_TEST_INVENTORY_EXTRA]
        : []),
    ].sort()
    assertPackageInventory(root, packageFiles)

    runNpm([
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
      tarball,
    ], { cwd: projectRoot })
    run('git', ['init', '-q'], { cwd: projectRoot })
    const installedRoot = join(projectRoot, 'node_modules', '@oevery', 'rsp')
    const installedBin = join(installedRoot, 'bin', 'rsp.mjs')
    const help = run(process.execPath, [installedBin, '--help'], { cwd: projectRoot })
    if (!help.includes('rsp'))
      fail('Installed rsp executable did not return its help output')
    const version = run(process.execPath, [installedBin, '--version'], { cwd: projectRoot })
    if (version !== packResult.version)
      fail(`Installed rsp version mismatch: expected ${packResult.version}, received ${version}`)
    const npmExecVersion = runNpm(['exec', '--yes', '--package', tarball, '--', 'rsp', '--version'], { cwd: execRoot })
    if (npmExecVersion !== packResult.version)
      fail(`Local tarball npm exec version mismatch: expected ${packResult.version}, received ${npmExecVersion}`)
    const init = runResult(process.execPath, [installedBin, 'init'], { cwd: projectRoot })
    if (init.status !== 0)
      fail(`Installed rsp init failed: ${init.stderr.trim()}`)
    const skillInstall = runResult(process.execPath, [installedBin, 'skills', 'install'], { cwd: projectRoot })
    if (skillInstall.status !== 0)
      fail(`Installed rsp skills install failed: ${skillInstall.stderr.trim()}`)
    const skillInstallRepeat = runResult(process.execPath, [installedBin, 'skills', 'install'], { cwd: projectRoot })
    if (skillInstallRepeat.status !== 0 || !skillInstallRepeat.stdout.includes('unchanged:'))
      fail('Installed rsp skills install was not idempotent')
    const defaultProjectSkills = readdirSync(join(projectRoot, '.agents', 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    if (JSON.stringify(defaultProjectSkills) !== JSON.stringify(EXPECTED_DEFAULT_SKILLS))
      fail(`Default project Skill inventory mismatch: ${defaultProjectSkills.join(', ')}`)
    const optionalSkillInstall = runResult(process.execPath, [installedBin, 'skills', 'install', OPTIONAL_SKILL], { cwd: projectRoot })
    if (optionalSkillInstall.status !== 0 || !optionalSkillInstall.stdout.includes(`installed: ${OPTIONAL_SKILL}`))
      fail(`Installed rsp optional Skill install failed: ${optionalSkillInstall.stderr.trim()}`)
    const optionalSkillInstallRepeat = runResult(process.execPath, [installedBin, 'skills', 'install', OPTIONAL_SKILL], { cwd: projectRoot })
    if (optionalSkillInstallRepeat.status !== 0 || !optionalSkillInstallRepeat.stdout.includes(`unchanged: ${OPTIONAL_SKILL}`))
      fail('Installed rsp optional Skill install was not idempotent')
    const status = runResult(process.execPath, [installedBin, 'status', '--json'], { cwd: projectRoot })
    if (status.status !== 0 || JSON.parse(status.stdout).command !== 'status')
      fail('Installed rsp executable did not return normal status JSON')
    const specs = runResult(process.execPath, [installedBin, 'specs', '--json'], { cwd: projectRoot })
    const specsOutput = specs.status === 0 ? JSON.parse(specs.stdout) : null
    if (specs.status !== 0
      || specsOutput?.command !== 'specs'
      || specsOutput?.mode !== 'tree'
      || !specsOutput.documents?.some(document => document.path === '.rsp/specs/design.md')) {
      fail('Installed rsp executable did not return normal Specs tree JSON')
    }
    if (existsSync(join(projectRoot, '.rsp', 'specs', '00-index.md')))
      fail('Installed rsp init unexpectedly created a generated Specs index')
    if (!existsSync(join(installedRoot, 'dist', 'broker-daemon.mjs')))
      fail('Installed package is missing the Broker daemon entry')
    const installedRuntimeEntry = join(installedRoot, 'dist', 'runtime-store.mjs')
    if (!existsSync(installedRuntimeEntry))
      fail('Installed package is missing the runtime store entry')
    const installedManageRuntimeEntry = join(installedRoot, 'dist', 'manage-runtime.mjs')
    if (!existsSync(installedManageRuntimeEntry))
      fail('Installed package is missing the managed runtime entry')

    const projectIdentity = lstatSync(projectRoot)
    const runtimeProject = {
      root: projectRoot,
      filesystem: {
        device: String(projectIdentity.dev),
        inode: String(projectIdentity.ino),
      },
    }
    const runtimeSmoke = runResult(process.execPath, [
      '--input-type=module',
      '--eval',
      [
        'const runtime = await import(process.env.RSP_PACKAGE_RUNTIME_ENTRY)',
        'const manage = await import(process.env.RSP_PACKAGE_MANAGE_RUNTIME_ENTRY)',
        'const options = JSON.parse(process.env.RSP_PACKAGE_RUNTIME_OPTIONS)',
        'const target = await runtime.resolveRuntimeDisposalTarget({ cwd: options.project.root, cacheRoot: options.cacheRoot })',
        'const project = { ...options.project, projectId: target.projectId }',
        'const store = await runtime.openRuntimeEventStore({ namespacePath: target.namespacePath, project })',
        'store.ensureRun({ runId: "package-run", runKey: "package-run-key", workRef: "package-smoke" })',
        'store.appendEvent({',
        '  runId: "package-run",',
        '  eventId: "package-event",',
        '  idempotencyKey: "package-event-key",',
        '  kind: "package-smoke",',
        '  actorType: "system",',
        '  actorId: "package-check",',
        '  payload: { retained: true },',
        '})',
        'const projection = store.projectRun("package-run")',
        'const capability = manage.createStoreManageRuntimeCapability(store)',
        'const managed = await capability.observeRun({',
        '  runId: "package-manage-run",',
        '  runKey: "package-manage-run-key",',
        '  workRef: "package-smoke",',
        '  managerId: "package-manager",',
        '  eventId: "package-manage-event",',
        '  idempotencyKey: "package-manage-event-key",',
        '  phase: "implementation",',
        '  authorityRefs: ["AGENTS.md"],',
        '  evidenceRefs: ["package-smoke"],',
        '})',
        'const managedProjection = await capability.projectRun(managed.run.runId)',
        'store.close()',
        'const inspection = await runtime.inspectRuntimeDatabase(target.namespacePath, project)',
        'const removed = await runtime.disposeRuntimeDatabase(target)',
        'const after = await runtime.inspectRuntimeDatabase(target.namespacePath, project)',
        'process.stdout.write(JSON.stringify({',
        '  schema: inspection.schema,',
        '  supportedSchemaVersion: runtime.RUNTIME_STORE_SCHEMA_VERSION,',
        '  state: inspection.state,',
        '  eventCount: projection.events.length,',
        '  manageCapability: capability.descriptor.name + "@" + capability.descriptor.version.major + "." + capability.descriptor.version.minor,',
        '  manageRunId: managedProjection.run?.runId,',
        '  manageSourceSequence: managedProjection.freshness.sourceSequence,',
        '  removed: removed.length,',
        '  after: after.state,',
        '}))',
      ].join('\n'),
    ], {
      cwd: projectRoot,
      env: {
        ...process.env,
        RSP_PACKAGE_MANAGE_RUNTIME_ENTRY: pathToFileURL(installedManageRuntimeEntry).href,
        RSP_PACKAGE_RUNTIME_ENTRY: pathToFileURL(installedRuntimeEntry).href,
        RSP_PACKAGE_RUNTIME_OPTIONS: JSON.stringify({
          cacheRoot: workspace,
          project: runtimeProject,
        }),
      },
    })
    const runtimeSmokeOutput = runtimeSmoke.status === 0
      ? parseJsonIfPossible(runtimeSmoke.stdout)
      : null
    if (runtimeSmoke.status !== 0
      || runtimeSmokeOutput?.state !== 'ready'
      || runtimeSmokeOutput?.schema?.major !== 1
      || runtimeSmokeOutput?.schema?.version !== runtimeSmokeOutput?.supportedSchemaVersion
      || runtimeSmokeOutput?.eventCount !== 1
      || runtimeSmokeOutput?.manageCapability !== 'rsp.manage-runtime@1.0'
      || runtimeSmokeOutput?.manageRunId !== 'package-manage-run'
      || runtimeSmokeOutput?.manageSourceSequence !== 1
      || runtimeSmokeOutput?.removed < 1
      || runtimeSmokeOutput?.after !== 'absent') {
      fail(`Installed runtime store smoke failed: ${runtimeSmoke.stderr.trim()}`)
    }

    const runtimeDisabledNamespace = join(workspace, 'runtime-disabled-smoke')
    mkdirSync(runtimeDisabledNamespace)
    const disabledRuntime = runResult(process.execPath, [
      '--no-experimental-sqlite',
      '--input-type=module',
      '--eval',
      [
        'const runtime = await import(process.env.RSP_PACKAGE_RUNTIME_ENTRY)',
        'const options = JSON.parse(process.env.RSP_PACKAGE_RUNTIME_OPTIONS)',
        'try {',
        '  await runtime.openRuntimeEventStore(options)',
        '  process.stdout.write(JSON.stringify({ opened: true }))',
        '} catch (error) {',
        '  process.stdout.write(JSON.stringify({ code: error.code }))',
        '}',
      ].join('\n'),
    ], {
      cwd: projectRoot,
      env: {
        ...process.env,
        RSP_PACKAGE_RUNTIME_ENTRY: pathToFileURL(installedRuntimeEntry).href,
        RSP_PACKAGE_RUNTIME_OPTIONS: JSON.stringify({
          namespacePath: runtimeDisabledNamespace,
          project: {
            ...runtimeProject,
            projectId: '0'.repeat(64),
          },
        }),
      },
    })
    const disabledRuntimeOutput = disabledRuntime.status === 0
      ? parseJsonIfPossible(disabledRuntime.stdout)
      : null
    if (disabledRuntime.status !== 0
      || disabledRuntimeOutput?.code !== 'runtime_sqlite_unavailable'
      || existsSync(join(runtimeDisabledNamespace, 'runtime-v1.sqlite'))) {
      fail(`Installed runtime did not fail closed when node:sqlite was disabled: ${disabledRuntime.stderr.trim()}`)
    }
    const statusWithoutSqlite = runResult(process.execPath, [
      '--no-experimental-sqlite',
      installedBin,
      'status',
      '--json',
    ], { cwd: projectRoot })
    if (statusWithoutSqlite.status !== 0
      || parseJsonIfPossible(statusWithoutSqlite.stdout)?.command !== 'status') {
      fail('Installed ordinary CLI did not remain usable when node:sqlite was disabled')
    }

    const brokerCacheRoot = join(workspace, 'broker-cache')
    const brokerEnvironment = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: brokerCacheRoot,
      RSP_BROKER_IDLE_MS: process.env.RSP_PACKAGE_CHECK_TEST_BROKER_IDLE_MS || '50',
    }
    let brokerCleanupArmed = false
    let brokerPid
    let brokerLifecycle
    let webObservatory
    try {
      const brokerBefore = runResult(process.execPath, [installedBin, 'broker', 'status', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const brokerBeforeOutput = brokerBefore.status === 0 ? JSON.parse(brokerBefore.stdout) : null
      if (brokerBefore.status !== 0 || brokerBeforeOutput?.state !== 'absent' || existsSync(brokerCacheRoot))
        fail('Installed rsp broker status did not remain absent and cache-free')

      brokerCleanupArmed = true
      const brokerStart = runResult(process.execPath, [installedBin, 'broker', 'start', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const brokerStartStdout = brokerStartOutputForValidation(brokerStart.stdout)
      brokerPid = recordBrokerPidFromOutput(brokerStartStdout)
      if (brokerStart.status !== 0)
        fail(`Installed rsp broker start failed: ${brokerStart.stderr.trim()}`)
      const brokerStartOutput = parseJsonIfPossible(brokerStartStdout)
      if (!brokerStartOutput)
        fail('Installed rsp broker start did not return valid JSON')
      if (brokerStartOutput.state !== 'running'
        || brokerStartOutput?.reused !== false
        || typeof brokerStartOutput?.broker?.instanceId !== 'string') {
        fail(`Installed rsp broker start failed: ${brokerStart.stderr.trim()}`)
      }

      const brokerStatus = runResult(process.execPath, [installedBin, 'broker', 'status', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const brokerStatusOutput = brokerStatus.status === 0 ? JSON.parse(brokerStatus.stdout) : null
      if (brokerStatus.status !== 0
        || brokerStatusOutput?.state !== 'running'
        || brokerStatusOutput?.broker?.instanceId !== brokerStartOutput.broker.instanceId) {
        fail('Installed rsp broker status did not reuse the started Broker identity')
      }

      const webCommand = runResult(process.execPath, [installedBin, 'web', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const webCommandOutput = webCommand.status === 0 ? parseJsonIfPossible(webCommand.stdout) : null
      if (webCommand.status !== 0
        || webCommandOutput?.command !== 'web'
        || webCommandOutput?.ok !== true
        || webCommandOutput?.opened !== false
        || typeof webCommandOutput?.url !== 'string'
        || webCommandOutput.url.includes('#')
        || webCommand.stdout.includes(brokerStartOutput.controlToken ?? 'never-present')) {
        fail(`Installed rsp web safe non-interactive command failed: ${webCommand.stderr.trim()}`)
      }
      webObservatory = runInstalledWebSmoke({
        discovery: join(brokerCacheRoot, 'discovery.json'),
        projectRoot,
      })

      const brokerStop = runResult(process.execPath, [installedBin, 'broker', 'stop', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const brokerStopOutput = brokerStop.status === 0 ? JSON.parse(brokerStop.stdout) : null
      if (brokerStop.status !== 0 || brokerStopOutput?.stopped !== true)
        fail(`Installed rsp broker stop failed: ${brokerStop.stderr.trim()}`)
      if (!Number.isSafeInteger(brokerPid) || !waitForProcessExit(brokerPid))
        fail('Installed rsp broker process remained alive after explicit stop')

      const brokerAfter = runResult(process.execPath, [installedBin, 'broker', 'status', '--json'], {
        cwd: projectRoot,
        env: brokerEnvironment,
      })
      const brokerAfterOutput = brokerAfter.status === 0 ? JSON.parse(brokerAfter.stdout) : null
      if (brokerAfter.status !== 0
        || brokerAfterOutput?.state !== 'absent'
        || existsSync(join(brokerCacheRoot, 'discovery.json'))) {
        fail('Installed rsp broker shutdown did not remove its owned discovery metadata')
      }
      brokerLifecycle = {
        before: brokerBeforeOutput.state,
        start: brokerStartOutput.state,
        reused: brokerStartOutput.reused,
        status: brokerStatusOutput.state,
        stop: brokerStopOutput.stopped,
        processExited: true,
        after: brokerAfterOutput.state,
      }
    }
    finally {
      if (brokerCleanupArmed) {
        if (!Number.isSafeInteger(brokerPid)) {
          const cleanupStatus = runResult(process.execPath, [installedBin, 'broker', 'status', '--json'], {
            cwd: projectRoot,
            env: brokerEnvironment,
          })
          brokerPid = recordBrokerPidFromOutput(cleanupStatus.stdout)
        }
        runResult(process.execPath, [installedBin, 'broker', 'stop', '--json'], {
          cwd: projectRoot,
          env: brokerEnvironment,
        })
        if (Number.isSafeInteger(brokerPid))
          waitForProcessExit(brokerPid)
      }
    }
    const nonTtyUi = runResult(process.execPath, [installedBin, 'ui'], { cwd: projectRoot, env: { ...process.env, CI: 'false', TERM: 'xterm-256color' } })
    const invalidLocale = runResult(process.execPath, [installedBin, 'ui', '--lang', 'fr'], { cwd: projectRoot, env: { ...process.env, CI: 'false', TERM: 'xterm-256color' } })
    const expectedNonTtyError = '  Error: rsp ui requires an interactive terminal; use rsp status or rsp status --json instead\n'
    const expectedLocaleError = '  Error: --lang must be auto, en, or zh-CN\n'
    if (nonTtyUi.status !== 1 || nonTtyUi.stdout !== '' || nonTtyUi.stderr !== expectedNonTtyError)
      fail('Installed rsp ui non-TTY error boundary was not concise')
    if (invalidLocale.status !== 1 || invalidLocale.stdout !== '' || invalidLocale.stderr !== expectedLocaleError)
      fail('Installed rsp ui locale error boundary was not concise')

    const installedManifest = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'))
    if (installedManifest.name !== packResult.name || installedManifest.version !== packResult.version)
      fail(`Installed package identity mismatch: ${installedManifest.name}@${installedManifest.version}`)
    const skillRoot = join(installedRoot, 'skills')
    const installedSkills = readdirSync(skillRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    if (JSON.stringify(installedSkills) !== JSON.stringify(EXPECTED_PACKAGED_SKILLS))
      fail(`Installed Skill inventory mismatch: ${installedSkills.join(', ')}`)
    for (const skill of installedSkills)
      validateSkill(skillRoot, skill)
    const projectSkills = readdirSync(join(projectRoot, '.agents', 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    if (JSON.stringify(projectSkills) !== JSON.stringify(EXPECTED_PACKAGED_SKILLS))
      fail(`Installed project Skill inventory mismatch: ${projectSkills.join(', ')}`)

    const designReferences = readdirSync(join(skillRoot, 'rsp-design', 'references')).sort()
    if (JSON.stringify(designReferences) !== JSON.stringify(EXPECTED_DESIGN_REFERENCES))
      fail(`rsp-design reference inventory mismatch: ${designReferences.join(', ')}`)

    const coreReferences = readdirSync(join(skillRoot, 'rsp', 'references')).sort()
    if (JSON.stringify(coreReferences) !== JSON.stringify(EXPECTED_CORE_REFERENCES))
      fail(`rsp core reference inventory mismatch: ${coreReferences.join(', ')}`)

    const releaseReferences = readdirSync(join(skillRoot, 'rsp-release-docs', 'references')).sort()
    if (JSON.stringify(releaseReferences) !== JSON.stringify(EXPECTED_RELEASE_REFERENCES))
      fail(`rsp-release-docs reference inventory mismatch: ${releaseReferences.join(', ')}`)

    const installedFiles = walkNoSymlinks(installedRoot)
      .map(path => relative(installedRoot, path).split(sep).join('/'))
      .sort()
    report = {
      inventory: {
        files: packageFiles,
        installedFiles,
        skills: installedSkills,
        defaultProjectSkills,
        projectSkills,
      },
      package: `${packResult.name}@${packResult.version}`,
      runtime: { node: process.version, npm: runNpm(['--version']) },
      entrySmoke: {
        help: true,
        version,
        npmExecVersion,
        init: true,
        skillsInstall: true,
        skillsInstallIdempotent: true,
        optionalSkillInstall: true,
        optionalSkillInstallIdempotent: true,
        statusJson: true,
        specsJson: true,
        runtimeStore: {
          schema: `${runtimeSmokeOutput.schema.major}.${runtimeSmokeOutput.schema.version}`,
          eventCount: runtimeSmokeOutput.eventCount,
          manageCapability: runtimeSmokeOutput.manageCapability,
          manageRunId: runtimeSmokeOutput.manageRunId,
          manageSourceSequence: runtimeSmokeOutput.manageSourceSequence,
          disposal: runtimeSmokeOutput.after,
          sqliteDisabled: disabledRuntimeOutput.code,
          ordinaryCliWithoutSqlite: true,
        },
        brokerLifecycle,
        webObservatory,
        nonTtyUi: { exitCode: nonTtyUi.status, stderr: nonTtyUi.stderr.trim() },
        invalidLocale: { exitCode: invalidLocale.status, stderr: invalidLocale.stderr.trim() },
      },
      prepareReleaseNotesReferences: releaseReferences,
      rspCoreReferences: coreReferences,
      rspDesignReferences: designReferences,
      tarballSha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
    }
  }
  finally {
    rmSync(workspace, { force: true, recursive: true })
  }

  if (process.argv.includes('--json'))
    process.stdout.write(`${JSON.stringify(report)}\n`)
  else
    process.stdout.write(`Clean install valid: ${report.package}\nSHA-256: ${report.tarballSha256}\nSkills: ${report.inventory.skills.join(', ')}\nFiles: ${report.inventory.files.join(', ')}\n`)
}

try {
  main()
}
catch (error) {
  process.stderr.write(`Clean install invalid: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
