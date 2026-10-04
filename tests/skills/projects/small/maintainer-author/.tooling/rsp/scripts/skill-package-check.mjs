#!/usr/bin/env node
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownFrontmatter, markdownLinks, parseMarkdown, visibleMarkdownSource } from '../src/core/markdown.mjs'
import { parseYamlDocument, yamlMapping } from '../src/core/yaml.mjs'

function contained(root, path) {
  const local = relative(root, path)
  return local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local)
}

// Maintainer/package gate only: never asserts Skill prose or executes resources.
export function checkSkillPackage(directory) {
  const root = resolve(directory)
  const errors = []
  const fail = (file, code) => errors.push({ path: relative(root, file) || '.', code })
  try {
    if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink())
      throw new Error('unsafe package root')
    const entrypoint = join(root, 'SKILL.md')
    if (!lstatSync(entrypoint).isFile() || lstatSync(entrypoint).isSymbolicLink())
      throw new Error('unsafe entrypoint')
    const document = parseMarkdown(readFileSync(entrypoint, 'utf8'))
    const matter = markdownFrontmatter(document)
    let metadata
    try {
      if (!matter)
        throw new Error('missing frontmatter')
      metadata = yamlMapping(parseYamlDocument(matter.value))
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
        throw new Error('invalid frontmatter')
    }
    catch {
      fail(entrypoint, 'invalid-frontmatter')
    }
    if (metadata) {
      if (typeof metadata.name !== 'string' || metadata.name !== basename(root) || metadata.name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(metadata.name))
        fail(entrypoint, 'invalid-name')
      if (typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024)
        fail(entrypoint, 'invalid-description')
      if (metadata.license !== undefined && typeof metadata.license !== 'string')
        fail(entrypoint, 'invalid-license')
      if (metadata.metadata !== undefined && (!metadata.metadata || typeof metadata.metadata !== 'object' || Array.isArray(metadata.metadata) || Object.values(metadata.metadata).some(value => typeof value !== 'string')))
        fail(entrypoint, 'invalid-metadata')
    }
    if (matter && !visibleMarkdownSource(document, { includeCode: true }).trim())
      fail(entrypoint, 'empty-instructions')

    function checkLink(file, url) {
      if (!url || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(url) || url.startsWith('//'))
        return
      try {
        const local = decodeURIComponent(url.split(/[?#]/u, 1)[0])
        const target = resolve(dirname(file), local)
        if (isAbsolute(local) || !contained(root, target) || !contained(realpathSync(root), realpathSync(target))) {
          fail(file, 'resource-outside-package')
          return
        }
        if (!lstatSync(target).isFile() && !lstatSync(target).isDirectory())
          fail(file, 'invalid-resource')
      }
      catch {
        fail(file, 'missing-or-invalid-resource')
      }
    }
    function walk(path) {
      const stat = lstatSync(path)
      if (stat.isSymbolicLink()) {
        fail(path, 'unsafe-resource')
      }
      else if (stat.isDirectory()) {
        for (const name of readdirSync(path).sort())
          walk(join(path, name))
      }
      else if (stat.isFile() && path.endsWith('.md')) {
        const markdown = path === entrypoint ? document : parseMarkdown(readFileSync(path, 'utf8'))
        for (const url of markdownLinks(markdown, { includeDefinitions: true }))
          checkLink(path, url)
      }
    }
    walk(root)
  }
  catch {
    fail(root, 'unreadable-package')
  }
  return { status: errors.length ? 'failed' : 'passed', errors }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = resolve(process.argv[2] ?? 'skills')
  try {
    const packages = readdirSync(directory).sort().map(name => ({ name, ...checkSkillPackage(join(directory, name)) }))
    const status = packages.length && packages.every(item => item.status === 'passed') ? 'passed' : 'failed'
    process.stdout.write(`${JSON.stringify({ status, packages }, null, 2)}\n`)
    process.exitCode = status === 'passed' ? 0 : 1
  }
  catch {
    process.stderr.write('Skill package inventory is unreadable.\n')
    process.exitCode = 1
  }
}
