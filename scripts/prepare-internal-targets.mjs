#!/usr/bin/env node
import assert from 'node:assert/strict'
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { checkSkillPackage } from './skill-package-check.mjs'

function countFiles(path) {
  const stat = lstatSync(path)
  assert(!stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), 'Only real files and directories may be copied')
  if (stat.isFile())
    return 1
  return readdirSync(path).reduce((count, name) => count + countFiles(join(path, name)), 0)
}

const args = process.argv.slice(2)
let root
try {
  if (args.length === 1 && args[0] === '--help') {
    console.log(`Usage: node prepare-internal-targets.mjs <authored-package-directory>...
Run this helper from its original repository with installed dependencies.
Paths resolve from the working directory. Select real, link-free packages with unique names.
Success prints JSON: root, composition, skills, fileCount.
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
      source.fileCount = countFiles(source.path)
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
      assert.equal(countFiles(target), source.fileCount)
      assert.deepEqual(checkSkillPackage(target), { status: 'passed', errors: [] })
    }
    const skills = sources.map(source => source.name)
    const fileCount = sources.reduce((count, source) => count + source.fileCount, 0)
    console.log(JSON.stringify({ root, composition, skills, fileCount }, null, 2))
  }
}
catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), ...(root ? { root } : {}) }))
  process.exitCode = 1
}
