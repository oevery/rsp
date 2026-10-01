#!/usr/bin/env node
import assert from 'node:assert/strict'
import { cpSync, lstatSync, mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { treeFiles } from '../tests/skills/runner/core/files.mjs'
import { compositionIdentity } from '../tests/skills/runner/observers/workspace.mjs'
import { checkSkillPackage } from './skill-package-check.mjs'

const args = process.argv.slice(2)
let root
try {
  if (args.length === 1 && args[0] === '--help') {
    console.log(`Usage: node prepare-internal-targets.mjs <authored-package-directory>...
Run this helper from its original repository with installed dependencies.
Paths resolve from the working directory. Select real, link-free packages with unique names.
Success prints JSON: root, composition, identity, fileCount.
Failure exits nonzero; stderr identifies any retained temporary root. No source is changed.
Prepared packages do not replace the repository tools used to evaluate them.`)
  }
  else {
    if (!args.length || args.some(arg => arg.startsWith('--')))
      throw new Error('Supply authored package directories; use --help for usage')
    const sources = args.map(path => ({ path: resolve(path), name: basename(resolve(path)) }))
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))
    if (new Set(sources.map(source => source.name)).size !== sources.length)
      throw new Error('Package names must be unique')
    // Validate every source before allocating a destination; never traverse links.
    for (const source of sources) {
      source.files = treeFiles(source.path, { rejectLinks: true })
      assert.deepEqual(checkSkillPackage(source.path), { status: 'passed', errors: [] })
    }
    root = mkdtempSync(join(tmpdir(), 'rsp-internal-targets-'))
    const composition = join(root, 'skills')
    mkdirSync(composition)
    for (const source of sources) {
      const target = join(composition, source.name)
      cpSync(source.path, target, {
        recursive: true,
        force: false,
        errorOnExist: true,
        filter(path) {
          const stat = lstatSync(path)
          assert(!stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), 'Only real files and directories may be copied')
          return true
        },
      })
      assert.deepEqual(treeFiles(target, { rejectLinks: true }), source.files)
      assert.deepEqual(checkSkillPackage(target), { status: 'passed', errors: [] })
    }
    for (const source of sources)
      assert.deepEqual(treeFiles(source.path, { rejectLinks: true }), source.files)
    const identity = compositionIdentity(composition)
    assert.deepEqual(identity.skills, sources.map(source => source.name))
    const fileCount = sources.reduce((count, source) => count + Object.keys(source.files).length, 0)
    console.log(JSON.stringify({ root, composition, identity, fileCount }, null, 2))
  }
}
catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), ...(root ? { root } : {}) }))
  process.exitCode = 1
}
