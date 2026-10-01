#!/usr/bin/env node

import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { isMap, parseDocument } from 'yaml'

const distributionNames = new Set(['copying', 'license', 'notice', 'third-party-notices']
  .flatMap(name => [name, `${name}.md`, `${name}.txt`]))

function within(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

function isDistribution(path, packageRoot) {
  return dirname(path) === packageRoot && distributionNames.has(basename(path).toLowerCase())
}

function documentFiles(root) {
  const files = []
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink())
        continue
      const path = join(directory, entry.name)
      if (entry.isDirectory())
        visit(path)
      else if (entry.isFile() && (entry.name.toLowerCase().endsWith('.md') || isDistribution(path, root)))
        files.push(path)
    }
  }
  visit(root)
  return files
}

function readDocument(path) {
  const bytes = readFileSync(path)
  const text = bytes.toString('utf8')
  const lines = text.split(/\r\n|\n|\r/u)
  let body = text
  // Recognize a YAML mapping, not Markdown between thematic breaks. Field
  // validity remains the package checker's responsibility; syntax errors here
  // retain the source as body rather than failing this diagnostic scan.
  if (lines[0] === '---') {
    const end = lines.findIndex((line, index) => index > 0 && (line === '---' || line === '...'))
    if (end > 0) {
      const metadata = parseDocument(lines.slice(1, end).join('\n'), { logLevel: 'silent' })
      if (metadata.errors.length === 0 && isMap(metadata.contents))
        body = lines.slice(end + 1).join('\n')
    }
  }
  const nodes = []
  function visit(node) {
    nodes.push(node)
    for (const child of node.children ?? [])
      visit(child)
  }
  visit(fromMarkdown(body))
  const definitions = new Map()
  for (const node of nodes) {
    if (node.type === 'definition' && !definitions.has(node.identifier))
      definitions.set(node.identifier, node.url)
  }
  const urls = nodes.flatMap((node) => {
    if (node.type === 'link' || node.type === 'image')
      return [node.url]
    if (node.type === 'linkReference' || node.type === 'imageReference')
      return definitions.has(node.identifier) ? [definitions.get(node.identifier)] : []
    return []
  })
  const blocks = nodes.filter(node => node.type === 'paragraph')
    .map(node => body.slice(node.position.start.offset, node.position.end.offset).replace(/\s+/gu, ' ').trim())
    .filter(value => value.length >= 40)
  return {
    urls,
    blocks,
    diagnostics: {
      files: 1,
      markdown_files: path.toLowerCase().endsWith('.md') ? 1 : 0,
      bytes: bytes.length,
      lines: text === '' ? 0 : lines.length - (/[\r\n]$/u.test(text) ? 1 : 0),
      words: text.trim() === '' ? 0 : text.trim().split(/\s+/u).length,
    },
  }
}

function localMarkdownLinks(path, packageRoot, document) {
  const links = []
  for (const url of document.urls) {
    if (!url || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/iu.test(url))
      continue
    let target
    try {
      target = decodeURIComponent(url.split(/[?#]/u, 1)[0])
    }
    catch {
      continue
    }
    if (isAbsolute(target) || !target.toLowerCase().endsWith('.md'))
      continue
    const resolved = resolve(dirname(path), target)
    if (within(packageRoot, resolved))
      links.push(resolved)
  }
  return [...new Set(links)].sort()
}

function reachableMarkdown(entrypoint, packageRoot, markdown, documents) {
  const allowed = new Set(markdown)
  const reached = new Set([entrypoint])
  const pending = [entrypoint]
  while (pending.length > 0) {
    const current = pending.pop()
    for (const target of localMarkdownLinks(current, packageRoot, documents.get(current))) {
      if (!allowed.has(target) || reached.has(target))
        continue
      reached.add(target)
      pending.push(target)
    }
  }
  return reached
}

function diagnostics(files, documents) {
  const result = { files: 0, markdown_files: 0, words: 0, bytes: 0, lines: 0 }
  for (const path of files) {
    for (const key of Object.keys(result))
      result[key] += documents.get(path).diagnostics[key]
  }
  return result
}

function discoverPackages(root) {
  const locations = [
    { directory: join(root, 'skills'), kind: 'published' },
    { directory: join(root, '.agents', 'skills'), kind: 'maintainer' },
  ]
  const packages = []
  for (const location of locations) {
    let entries
    try {
      if (!lstatSync(location.directory).isDirectory() || realpathSync(location.directory) !== location.directory)
        continue
      entries = readdirSync(location.directory, { withFileTypes: true })
    }
    catch (error) {
      if (error?.code === 'ENOENT')
        continue
      throw error
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.isSymbolicLink())
        continue
      const packageRoot = join(location.directory, entry.name)
      const entrypoint = join(packageRoot, 'SKILL.md')
      try {
        if (!lstatSync(entrypoint).isFile())
          continue
      }
      catch {
        continue
      }
      packages.push({ name: entry.name, kind: location.kind, packageRoot, entrypoint })
    }
  }
  return packages.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
}

export function scanSkillContext(options = {}) {
  const inputRoot = resolve(options.root ?? process.cwd())
  const root = realpathSync(inputRoot)
  let selected = discoverPackages(root)
  if (options.packages !== undefined) {
    if (!Array.isArray(options.packages) || !options.packages.length)
      throw new Error('Select at least one canonical package path')
    const paths = options.packages.map((path) => {
      const requested = resolve(inputRoot, path)
      for (const item of selected) {
        const suffix = relative(root, item.packageRoot)
        const candidateRoot = suffix.split(sep).reduce(parent => dirname(parent), requested)
        if (resolve(candidateRoot, suffix) !== requested)
          continue
        // Resolve only the repository-root prefix. The canonical package
        // suffix stays literal, so a linked package projection cannot match.
        try {
          if (realpathSync(candidateRoot) === root)
            return item.packageRoot
        }
        catch {
          // An unavailable root alias cannot identify a canonical package.
        }
      }
      throw new Error(`Unknown or non-canonical package: ${requested}`)
    })
    selected = selected.filter(item => paths.includes(item.packageRoot))
  }
  const documents = new Map()
  const packages = selected.map((item) => {
    const files = documentFiles(item.packageRoot)
    for (const path of files)
      documents.set(path, readDocument(path))
    const markdown = files.filter(path => path.toLowerCase().endsWith('.md'))
    const distribution = files.filter(path => isDistribution(path, item.packageRoot))
    const context = markdown.filter(path => !distribution.includes(path))
    const references = context.filter(path => path !== item.entrypoint)
    const reached = reachableMarkdown(item.entrypoint, item.packageRoot, context, documents)
    const { files: _count, ...markdownDiagnostics } = diagnostics(markdown, documents)
    return {
      name: item.name,
      kind: item.kind,
      entrypoint: relative(root, item.entrypoint),
      markdown_files: markdown.map(path => relative(root, path)),
      distribution_markdown: distribution.filter(path => path.toLowerCase().endsWith('.md')).map(path => relative(root, path)),
      distribution_files: distribution.map(path => relative(root, path)),
      reachable_markdown: [...reached].sort().map(path => relative(root, path)),
      unreachable_markdown: context.filter(path => !reached.has(path)).map(path => relative(root, path)),
      diagnostics: markdownDiagnostics,
      diagnostics_by_role: {
        total: diagnostics(files, documents),
        entrypoint: diagnostics([item.entrypoint], documents),
        references: diagnostics(references, documents),
        distribution: diagnostics(distribution, documents),
      },
    }
  })

  const occurrences = new Map()
  for (const item of packages) {
    const distribution = new Set(item.distribution_markdown)
    for (const path of item.markdown_files.filter(path => !distribution.has(path))) {
      for (const value of documents.get(join(root, path)).blocks) {
        const paths = occurrences.get(value) ?? new Set()
        paths.add(path)
        occurrences.set(value, paths)
      }
    }
  }
  const repeated_prose = [...occurrences.entries()]
    .filter(([, paths]) => paths.size > 1)
    .map(([text, paths]) => ({ text, paths: [...paths].sort() }))
    .sort((a, b) => a.text.localeCompare(b.text))

  return { schema_version: 1, root, packages, repeated_prose, diagnostics_only: true }
}

export function formatSkillContext(result) {
  const lines = [`Skill context: ${result.packages.length} canonical package(s)`]
  for (const item of result.packages) {
    const d = item.diagnostics
    lines.push(`- ${item.kind} ${item.name}: ${d.markdown_files} md, ${d.words} words, ${d.bytes} bytes, ${d.lines} lines`)
    for (const [role, counts] of Object.entries(item.diagnostics_by_role))
      lines.push(`  ${role}: ${counts.files} documents, ${counts.words} words, ${counts.bytes} bytes, ${counts.lines} lines`)
    if (item.distribution_files.length > 0)
      lines.push(`  distribution: ${item.distribution_files.join(', ')}`)
    if (item.unreachable_markdown.length > 0)
      lines.push(`  unreachable: ${item.unreachable_markdown.join(', ')}`)
  }
  lines.push(`Exact cross-file readable paragraph groups: ${result.repeated_prose.length}`)
  lines.push('Words are whitespace-delimited, not tokens. Reachability is static, not actual loading or model discovery.')
  lines.push('Counts and repetitions are diagnostics, not correctness thresholds; package checks own missing/broken resources.')
  return `${lines.join('\n')}\n`
}

export function main(argv = process.argv.slice(2), io = {}) {
  let root = process.cwd()
  let json = false
  const packages = []
  const write = io.stdout ?? (value => process.stdout.write(value))
  if (argv.length === 1 && argv[0] === '--help') {
    write('Usage: node scripts/scan-skill-context.mjs [--root directory] [--package canonical-path]... [--json]\nPackage paths resolve relative to --root. Omit --package for all canonical packages. Diagnostics only.\n')
    return 0
  }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--json') {
      json = true
    }
    else if ((arg === '--root' || arg === '--package') && argv[index + 1] && !argv[index + 1].startsWith('--')) {
      const value = argv[++index]
      if (arg === '--root')
        root = value
      else
        packages.push(value)
    }
    else {
      throw new Error(`Unknown or incomplete argument: ${arg}`)
    }
  }
  const result = scanSkillContext({ root, ...(packages.length ? { packages } : {}) })
  write(json ? `${JSON.stringify(result, null, 2)}\n` : formatSkillContext(result))
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main()
  }
  catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
