#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

export const SKILL_SECURITY_RULESET_VERSION = 1
export const DEFAULT_MAX_FINDINGS = 50

const MAX_FILE_BYTES = 1024 * 1024
const allowedExtensions = new Set([
  '.bash',
  '.cjs',
  '.css',
  '.csv',
  '.gif',
  '.html',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.pdf',
  '.pl',
  '.png',
  '.ps1',
  '.py',
  '.rb',
  '.sh',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
  '.zsh',
])
const scriptExtensions = new Set([
  '.bash',
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.pl',
  '.ps1',
  '.py',
  '.rb',
  '.sh',
  '.ts',
  '.tsx',
  '.zsh',
])
const binaryAssetExtensions = new Set([
  '.gif',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
])
const dependencyManifestNames = new Set([
  'bun.lock',
  'bun.lockb',
  'composer.json',
  'composer.lock',
  'deno.json',
  'deno.jsonc',
  'gemfile',
  'gemfile.lock',
  'go.mod',
  'go.sum',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'poetry.lock',
  'pyproject.toml',
  'requirements.txt',
  'uv.lock',
  'yarn.lock',
])
const metadataNames = /(?:^|[-_.])(?:manifest|metadata|mcp|plugin)(?:[-_.]|$)/iu
const secretRules = [
  ['private key material', /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/gu],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/gu],
  ['GitHub token', /\bgh[oprsu]_[A-Za-z0-9]{20,}\b/gu],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/gu],
  ['generic assigned credential', /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*['"][\w./+~=-]{20,}['"]/giu],
]
const scriptRules = [
  ['script-egress', 'network egress primitive', [
    /\b(?:curl|wget)\s+(?:-[^\n ]+(?:[\n ]\s*|[\t\v\f\r\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]))*https?:\/\//giu,
    /\bfetch\s*\(/gu,
    /\b(?:https?|net|tls)\.(?:get|request|connect|createConnection)\s*\(/gu,
    /\b(?:axios|requests)\.(?:get|post|put|patch|delete|request)\s*\(/gu,
    /\b(?:urllib\.request\.urlopen|httpx\.(?:get|post|request))\s*\(/gu,
  ]],
  ['script-process', 'process execution primitive', [
    /(?:from\s+['"]node:child_process['"]|require\s*\(\s*['"](?:node:)?child_process['"]\s*\))/gu,
    /\b(?:child_process\.)?(?:exec|execFile|spawn|spawnSync|execSync)\s*\(/gu,
    /\b(?:subprocess\.(?:run|Popen|call|check_call|check_output)|os\.system)\s*\(/gu,
    /\b(?:bash|sh|zsh|pwsh|powershell)\s+-c\b/gu,
  ]],
  ['script-dynamic-execution', 'dynamic code execution primitive', [
    /\beval\s*\(/gu,
    /\bnew\s+Function\s*\(/gu,
    /\bvm\.(?:runInContext|runInNewContext|runInThisContext|compileFunction)\s*\(/gu,
    /\bexec\s*\(/gu,
  ]],
]
const promptInjectionPatterns = [
  /\b(?:ignore|disregard|override)\s+(?:all\s+)?(?:previous|prior|system|developer)\s+(?:instructions?|messages?|prompts?)\b/giu,
  /\b(?:reveal|print|return|expose)\s+(?:the\s+)?(?:hidden\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)\b/giu,
  /\b(?:bypass|disable|evade)\s+(?:all\s+)?(?:safety|security|permission|authorization|policy)\s+(?:checks?|rules?|controls?|restrictions?)\b/giu,
  /\bdo\s+not\s+(?:tell|inform|notify)\s+(?:the\s+)?user\b/giu,
]

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

function location(text, index) {
  const lines = text.slice(0, index).split('\n')
  return { line: lines.length, column: lines.at(-1).length + 1 }
}

function finding(rule, path, message, at = {}) {
  return { rule, path, line: at.line ?? null, column: at.column ?? null, message }
}

function compareFindings(left, right) {
  return left.path.localeCompare(right.path, 'en')
    || left.rule.localeCompare(right.rule, 'en')
    || (left.line ?? 0) - (right.line ?? 0)
    || (left.column ?? 0) - (right.column ?? 0)
    || left.message.localeCompare(right.message, 'en')
}

function uniqueSorted(findings) {
  const seen = new Set()
  return findings.sort(compareFindings).filter((item) => {
    const key = [item.rule, item.path, item.line, item.column, item.message].join('\0')
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })
}

function firstMatch(text, patterns) {
  let selected = null
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match && (selected === null || match.index < selected.index))
      selected = match
  }
  return selected
}

function permissions(path, mode, directory = false) {
  const findings = []
  if ((mode & 0o022) !== 0)
    findings.push(finding('unsafe-permission', path, 'group- or world-writable permission bits are not allowed'))
  if ((mode & 0o6000) !== 0)
    findings.push(finding('unsafe-permission', path, 'set-user-ID and set-group-ID permission bits are not allowed'))
  if (!directory && (mode & 0o111) !== 0 && !scriptExtensions.has(extname(path).toLowerCase()))
    findings.push(finding('unsafe-permission', path, 'non-script files must not be executable'))
  return findings
}

function inspectSecrets(path, text) {
  const findings = []
  for (const [kind, pattern] of secretRules) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match)
      findings.push(finding('embedded-secret', path, `suspected ${kind}; matched value redacted`, location(text, match.index)))
  }
  return findings
}

function inspectScript(path, text) {
  const findings = []
  for (const [rule, message, patterns] of scriptRules) {
    const match = firstMatch(text, patterns)
    if (match)
      findings.push(finding(rule, path, message, location(text, match.index)))
  }
  return findings
}

function inspectDependency(path, text) {
  const name = basename(path).toLowerCase()
  if (!dependencyManifestNames.has(name))
    return []
  const findings = [finding('dependency-manifest', path, 'bundled Skill contains a dependency manifest or lockfile')]
  if (name === 'package.json') {
    try {
      const manifest = JSON.parse(text)
      const scripts = isObject(manifest.scripts) ? manifest.scripts : {}
      for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
        if (typeof scripts[hook] === 'string' && scripts[hook].trim() !== '') {
          findings.push(finding('dependency-install-hook', path, `package manifest declares ${hook} install lifecycle hook`))
          break
        }
      }
    }
    catch {
      findings.push(finding('dependency-manifest-invalid', path, 'package manifest is not valid JSON'))
    }
  }
  return findings
}

function inspectPrompt(path, text) {
  if (!['.md', '.txt'].includes(extname(path).toLowerCase()))
    return []
  const match = firstMatch(text, promptInjectionPatterns)
  return match
    ? [finding('prompt-injection-imperative', path, 'high-confidence instruction override or concealment imperative', location(text, match.index))]
    : []
}

function broadPermission(value, path = []) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const match = broadPermission(value[index], [...path, String(index)])
      if (match)
        return match
    }
    return null
  }
  if (!isObject(value))
    return null
  for (const key of Object.keys(value).sort()) {
    const item = value[key]
    const next = [...path, key]
    if (/^(?:permissions?|scopes?|allowed[_-]?tools?|tools?)$/iu.test(key)) {
      const values = Array.isArray(item) ? item : [item]
      if (values.some(entry => typeof entry === 'string' && /^(?:\*|all|admin|root|write:\*)$/iu.test(entry.trim())))
        return next.join('.')
      if (isObject(item) && Object.entries(item).some(([name, enabled]) => enabled === true && /^(?:\*|all|admin|root|write:\*)$/iu.test(name)))
        return next.join('.')
    }
    const match = broadPermission(item, next)
    if (match)
      return match
  }
  return null
}

function inspectMcp(path, text) {
  const extension = extname(path).toLowerCase()
  const name = basename(path)
  const pathSegments = path.split('/')
  const metadataCandidate = metadataNames.test(name) || pathSegments.includes('agents')
  let metadata
  try {
    if (extension === '.json' && metadataCandidate) {
      metadata = JSON.parse(text)
    }
    else if (['.yaml', '.yml'].includes(extension) && metadataCandidate) {
      metadata = parseYaml(text)
    }
    else if (name === 'SKILL.md' && text.startsWith('---\n')) {
      const end = text.indexOf('\n---\n', 4)
      if (end === -1)
        return []
      metadata = parseYaml(text.slice(4, end))
    }
    else {
      return []
    }
  }
  catch {
    return metadataCandidate
      ? [finding('mcp-metadata-invalid', path, 'Skill host or MCP metadata is not valid structured data')]
      : []
  }
  const key = broadPermission(metadata)
  return key ? [finding('broad-mcp-permission', path, `MCP metadata grants an unrestricted permission at ${key}`)] : []
}

function inspectFile(absolutePath, relativePath, stat) {
  const findings = permissions(relativePath, stat.mode)
  const bytes = readFileSync(absolutePath)
  const identity = sha256(bytes)
  const extension = extname(relativePath).toLowerCase()
  const dependencyManifest = dependencyManifestNames.has(basename(relativePath).toLowerCase())
  if (!allowedExtensions.has(extension) && !dependencyManifest) {
    findings.push(finding('unsafe-file-type', relativePath, 'unsupported bundled Skill file extension'))
    return { findings, identity }
  }
  if (stat.size > MAX_FILE_BYTES) {
    findings.push(finding('unsafe-file-type', relativePath, 'file exceeds the inspection size limit'))
    return { findings, identity }
  }
  if (binaryAssetExtensions.has(extension))
    return { findings, identity }
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  catch {
    findings.push(finding('unsafe-file-type', relativePath, 'file is not valid UTF-8 text'))
    return { findings, identity }
  }
  if (text.includes('\0')) {
    findings.push(finding('unsafe-file-type', relativePath, 'binary content is not allowed in a text Skill file'))
    return { findings, identity }
  }
  findings.push(...inspectSecrets(relativePath, text))
  if (scriptExtensions.has(extension) || text.startsWith('#!') || (stat.mode & 0o111) !== 0)
    findings.push(...inspectScript(relativePath, text))
  findings.push(...inspectDependency(relativePath, text))
  findings.push(...inspectPrompt(relativePath, text))
  findings.push(...inspectMcp(relativePath, text))
  return { findings, identity }
}

function inspectTree(skillsRoot) {
  const findings = []
  const identities = new Map()
  let scannedFiles = 0
  function visit(directory, prefix = '') {
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      const absolutePath = resolve(directory, entry.name)
      const stat = lstatSync(absolutePath)
      if (entry.isSymbolicLink()) {
        findings.push(finding('unsafe-file-type', path, 'symbolic links are not allowed in bundled Skills'))
      }
      else if (entry.isDirectory()) {
        findings.push(...permissions(path, stat.mode, true))
        visit(absolutePath, path)
      }
      else if (!entry.isFile()) {
        findings.push(finding('unsafe-file-type', path, 'only regular files and directories are allowed'))
      }
      else {
        scannedFiles++
        const inspected = inspectFile(absolutePath, path, stat)
        identities.set(path, inspected.identity)
        findings.push(...inspected.findings)
      }
    }
  }
  visit(skillsRoot)
  return { findings: uniqueSorted(findings), identities, scannedFiles }
}

function exactKeys(value, expected) {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
}

function suppressionFailure(message, index = null) {
  const suffix = index === null ? '' : ` at suppressions[${index}]`
  return finding('suppression-malformed', '<suppressions>', message + suffix)
}

function loadSuppressions(root, skillsRoot, suppressionPath) {
  if (suppressionPath === undefined)
    return { suppressions: [], findings: [] }
  const absolutePath = resolve(root, suppressionPath)
  if (!inside(root, absolutePath) || inside(skillsRoot, absolutePath))
    return { suppressions: [], findings: [suppressionFailure('suppression manifest must be repository-owned and outside root/skills')] }
  let manifest
  try {
    const stat = lstatSync(absolutePath)
    if (!stat.isFile() || stat.isSymbolicLink() || !inside(realpathSync(root), realpathSync(absolutePath)))
      throw new Error('unsafe manifest path')
    manifest = JSON.parse(readFileSync(absolutePath, 'utf8'))
  }
  catch {
    return { suppressions: [], findings: [suppressionFailure('suppression manifest is missing or invalid JSON')] }
  }
  if (!isObject(manifest) || !exactKeys(manifest, ['version', 'suppressions']) || manifest.version !== 1 || !Array.isArray(manifest.suppressions))
    return { suppressions: [], findings: [suppressionFailure('manifest must contain exactly version: 1 and a suppressions array')] }
  const suppressions = []
  const findings = []
  const seen = new Set()
  for (let index = 0; index < manifest.suppressions.length; index++) {
    const item = manifest.suppressions[index]
    if (!isObject(item) || !exactKeys(item, ['path', 'reason', 'rule', 'sha256'])) {
      findings.push(suppressionFailure('entry must contain exactly rule, path, sha256, and reason', index))
      continue
    }
    const valid = typeof item.rule === 'string' && /^[a-z][a-z0-9-]+$/u.test(item.rule)
      && typeof item.path === 'string' && item.path !== '' && !item.path.startsWith('/')
      && !item.path.includes('\\') && item.path.split('/').every(part => part !== '' && part !== '.' && part !== '..')
      && typeof item.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(item.sha256)
      && typeof item.reason === 'string' && item.reason.trim() !== ''
    if (!valid) {
      findings.push(suppressionFailure('entry values are invalid', index))
      continue
    }
    const identity = [item.rule, item.path, item.sha256].join('\0')
    if (seen.has(identity)) {
      findings.push(finding('suppression-duplicate', item.path, `duplicate suppression for ${item.rule}`))
      continue
    }
    seen.add(identity)
    suppressions.push({ rule: item.rule, path: item.path, sha256: item.sha256, reason: item.reason.trim(), index })
  }
  return { suppressions, findings }
}

function applySuppressions(rawFindings, identities, data) {
  const findings = [...data.findings]
  const suppressed = []
  const valid = new Map()
  const used = new Set()
  for (const suppression of data.suppressions) {
    if (identities.get(suppression.path) !== suppression.sha256) {
      findings.push(finding('suppression-stale', suppression.path, `content hash does not match suppression for ${suppression.rule}`))
      continue
    }
    const key = `${suppression.rule}\0${suppression.path}`
    valid.set(key, [...(valid.get(key) ?? []), suppression])
  }
  for (const item of rawFindings) {
    const match = valid.get(`${item.rule}\0${item.path}`)?.[0]
    if (match) {
      used.add(match.index)
      suppressed.push({ ...item, reason: match.reason, sha256: match.sha256 })
    }
    else {
      findings.push(item)
    }
  }
  for (const entries of valid.values()) {
    for (const item of entries) {
      if (!used.has(item.index))
        findings.push(finding('suppression-unused', item.path, `suppression did not match a ${item.rule} finding`))
    }
  }
  return { findings: uniqueSorted(findings), suppressed: uniqueSorted(suppressed) }
}

export function scanSkillSecurityPreflight(options = {}) {
  const root = resolve(options.root ?? process.cwd())
  const skillsRoot = resolve(root, 'skills')
  const maxFindings = Number.isInteger(options.maxFindings)
    ? Math.min(Math.max(options.maxFindings, 1), DEFAULT_MAX_FINDINGS)
    : DEFAULT_MAX_FINDINGS
  let tree
  try {
    const stat = lstatSync(skillsRoot)
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('invalid skills root')
    tree = inspectTree(skillsRoot)
  }
  catch {
    tree = {
      findings: [finding('skill-tree-invalid', '<skills>', 'root/skills is missing, unreadable, or not a real directory')],
      identities: new Map(),
      scannedFiles: 0,
    }
  }
  const data = loadSuppressions(root, skillsRoot, options.suppressions)
  const applied = applySuppressions(tree.findings, tree.identities, data)
  return {
    version: SKILL_SECURITY_RULESET_VERSION,
    ok: applied.findings.length === 0,
    scanned_files: tree.scannedFiles,
    findings: applied.findings.slice(0, maxFindings),
    suppressed: applied.suppressed.slice(0, maxFindings),
    total_findings: applied.findings.length,
    total_suppressed: applied.suppressed.length,
    truncated: applied.findings.length > maxFindings || applied.suppressed.length > maxFindings,
  }
}

export function formatSkillSecurityPreflight(result) {
  const lines = [
    `Skill security preflight: ${result.ok ? 'pass' : 'fail'} (${result.scanned_files} files, ${result.total_findings} findings, ${result.total_suppressed} suppressed)`,
  ]
  for (const item of result.findings) {
    const at = item.line === null ? '' : `:${item.line}${item.column === null ? '' : `:${item.column}`}`
    lines.push(`- ${item.rule} ${item.path}${at}: ${item.message}`)
  }
  for (const item of result.suppressed) {
    const at = item.line === null ? '' : `:${item.line}${item.column === null ? '' : `:${item.column}`}`
    lines.push(`- suppressed ${item.rule} ${item.path}${at}: ${item.reason}`)
  }
  if (result.truncated)
    lines.push(`- output truncated to ${Math.max(result.findings.length, result.suppressed.length)} entries per section`)
  return `${lines.join('\n')}\n`
}

function parseArguments(argv) {
  const options = { root: process.cwd(), json: false }
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--json') {
      options.json = true
    }
    else if (argument === '--root' || argument === '--suppressions') {
      const value = argv[++index]
      if (!value || value.startsWith('--'))
        throw new Error(`${argument} requires a value`)
      options[argument.slice(2)] = value
    }
    else {
      throw new Error(`unknown argument: ${argument}`)
    }
  }
  return options
}

export function main(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? (value => process.stdout.write(value))
  const stderr = io.stderr ?? (value => process.stderr.write(value))
  try {
    const options = parseArguments(argv)
    const result = scanSkillSecurityPreflight(options)
    const output = options.json ? `${JSON.stringify(result, null, 2)}\n` : formatSkillSecurityPreflight(result)
    if (options.json || result.ok)
      stdout(output)
    else
      stderr(output)
    return result.ok ? 0 : 1
  }
  catch (error) {
    stderr(`Skill security preflight error: ${error instanceof Error ? error.message : String(error)}\n`)
    return 2
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main()
