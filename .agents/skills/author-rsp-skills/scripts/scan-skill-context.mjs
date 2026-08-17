#!/usr/bin/env node

import { lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g

function within(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

function markdownFiles(root) {
  const files = []
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink())
        continue
      const path = join(directory, entry.name)
      if (entry.isDirectory())
        visit(path)
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        files.push(path)
    }
  }
  visit(root)
  return files
}

function localMarkdownLinks(path, packageRoot) {
  const links = []
  for (const match of readFileSync(path, 'utf8').matchAll(linkPattern)) {
    let target = match[1].trim().replace(/^<|>$/g, '')
    if (!target || target.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(target))
      continue
    target = target.split('#', 1)[0].split('?', 1)[0]
    try {
      target = decodeURIComponent(target)
    }
    catch {
      continue
    }
    if (!target.toLowerCase().endsWith('.md'))
      continue
    const resolved = resolve(dirname(path), target)
    if (within(packageRoot, resolved))
      links.push(resolved)
  }
  return [...new Set(links)].sort()
}

function reachableMarkdown(entrypoint, packageRoot, markdown) {
  const allowed = new Set(markdown)
  const reached = new Set([entrypoint])
  const pending = [entrypoint]
  while (pending.length > 0) {
    const current = pending.shift()
    for (const target of localMarkdownLinks(current, packageRoot)) {
      if (!allowed.has(target) || reached.has(target))
        continue
      reached.add(target)
      pending.push(target)
    }
  }
  return reached
}

function diagnostics(files) {
  let bytes = 0
  let lines = 0
  let words = 0
  for (const path of files) {
    const text = readFileSync(path, 'utf8')
    bytes += statSync(path).size
    lines += text === '' ? 0 : text.split(/\r?\n/).length
    words += text.trim() === '' ? 0 : text.trim().split(/\s+/u).length
  }
  return { markdown_files: files.length, words, bytes, lines }
}

function normalizedBlocks(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n\s*\r?\n/)
    .map(value => value.replace(/\s+/gu, ' ').trim())
    .filter(value => value.length >= 40 && !value.startsWith('---'))
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
  const root = realpathSync(resolve(options.root ?? process.cwd()))
  const packages = discoverPackages(root).map(item => {
    const markdown = markdownFiles(item.packageRoot)
    const reached = reachableMarkdown(item.entrypoint, item.packageRoot, markdown)
    return {
      name: item.name,
      kind: item.kind,
      entrypoint: relative(root, item.entrypoint),
      markdown_files: markdown.map(path => relative(root, path)),
      reachable_markdown: [...reached].sort().map(path => relative(root, path)),
      unreachable_markdown: markdown.filter(path => !reached.has(path)).map(path => relative(root, path)),
      diagnostics: diagnostics(markdown),
    }
  })

  const occurrences = new Map()
  for (const item of packages) {
    for (const path of item.markdown_files) {
      for (const value of normalizedBlocks(join(root, path))) {
        const paths = occurrences.get(value) ?? []
        paths.push(path)
        occurrences.set(value, paths)
      }
    }
  }
  const repeated_prose = [...occurrences.entries()]
    .filter(([, paths]) => new Set(paths).size > 1)
    .map(([text, paths]) => ({ text, paths: [...new Set(paths)].sort() }))
    .sort((a, b) => a.text.localeCompare(b.text))

  return {
    schema_version: 1,
    root,
    packages,
    repeated_prose,
    diagnostics_only: true,
  }
}

export function formatSkillContext(result) {
  const lines = [`Skill context: ${result.packages.length} canonical package(s)`]
  for (const item of result.packages) {
    const d = item.diagnostics
    lines.push(`- ${item.kind} ${item.name}: ${d.markdown_files} md, ${d.words} words, ${d.bytes} bytes, ${d.lines} lines`)
    if (item.unreachable_markdown.length > 0)
      lines.push(`  unreachable: ${item.unreachable_markdown.join(', ')}`)
  }
  lines.push(`Exact repeated prose groups: ${result.repeated_prose.length}`)
  lines.push('Counts and repetitions are diagnostics, not correctness thresholds.')
  return `${lines.join('\n')}\n`
}

export function main(argv = process.argv.slice(2), io = {}) {
  let root = process.cwd()
  let json = false
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--json')
      json = true
    else if (arg === '--root' && argv[index + 1])
      root = argv[++index]
    else
      throw new Error(`Unknown or incomplete argument: ${arg}`)
  }
  const result = scanSkillContext({ root })
  const write = io.stdout ?? (value => process.stdout.write(value))
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
