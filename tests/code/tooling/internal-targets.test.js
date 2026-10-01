import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it } from 'vitest'
import { treeFiles } from '../../skills/runner/core/files.mjs'
import { compositionIdentity } from '../../skills/runner/observers/workspace.mjs'

const cli = fileURLToPath(new URL('../../../scripts/prepare-internal-targets.mjs', import.meta.url))
const temporary = []
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-internal-cli-test-'))
  temporary.push(directory)
  const output = join(directory, 'output')
  mkdirSync(output)
  const invoke = args => spawnSync(process.execPath, [cli, ...args], {
    cwd: directory,
    env: { ...process.env, TMPDIR: output, TMP: output, TEMP: output },
    encoding: 'utf8',
    timeout: 5000,
  })
  const makePackage = (parent, name) => {
    const path = join(directory, parent, name)
    mkdirSync(path, { recursive: true })
    writeFileSync(join(path, 'SKILL.md'), `---
name: ${name}
description: A CLI fixture package.
---
Use the supplied task.
`)
    writeFileSync(join(path, 'task.mjs'), 'console.log(42)')
    chmodSync(join(path, 'task.mjs'), 0o755)
    return path
  }
  return { directory, output, invoke, makePackage }
}

it('copies only selected packages into unique targets, preserving bytes, executable bits and sources', () => {
  const { directory, invoke, makePackage } = fixture()
  const alpha = makePackage('source', 'alpha')
  const beta = makePackage('source', 'beta')
  makePackage('source', 'unselected')
  const before = treeFiles(join(directory, 'source'), { rejectLinks: true })
  const result = invoke(['source/beta', 'source/alpha'])
  expect(result.status, result.stderr).toBe(0)
  const report = JSON.parse(result.stdout)
  expect(report.composition).toBe(join(report.root, 'skills'))
  expect(report.fileCount).toBe(4)
  expect(readdirSync(report.composition).sort()).toEqual(['alpha', 'beta'])
  expect(report.identity).toEqual(compositionIdentity(report.composition))
  expect(report.identity.skills).toEqual(['alpha', 'beta'])
  for (const source of [alpha, beta]) {
    const name = source === alpha ? 'alpha' : 'beta'
    const target = join(report.composition, name)
    expect(treeFiles(target, { rejectLinks: true })).toEqual(treeFiles(source, { rejectLinks: true }))
    expect(readFileSync(join(target, 'task.mjs'), 'utf8')).toBe('console.log(42)')
    expect(lstatSync(join(target, 'task.mjs')).mode & 0o111).toBe(0o111)
  }
  const second = invoke([alpha])
  expect(second.status, second.stderr).toBe(0)
  expect(JSON.parse(second.stdout).root).not.toBe(report.root)
  expect(treeFiles(join(directory, 'source'), { rejectLinks: true })).toEqual(before)
})

it('rejects missing targets, duplicate names and links before allocating output or touching external content', () => {
  const { directory, output, invoke, makePackage } = fixture()
  const first = makePackage('first', 'sample')
  const duplicate = makePackage('second', 'sample')
  const outside = makePackage('outside', 'external')
  const externalBefore = treeFiles(outside, { rejectLinks: true })
  symlinkSync(outside, join(directory, 'linked'), 'dir')
  const nested = makePackage('nested', 'with-link')
  symlinkSync(join(outside, 'task.mjs'), join(nested, 'outside.mjs'))
  for (const args of [[], ['missing'], [first, duplicate], ['linked'], [first, nested]]) {
    const result = invoke(args)
    expect(result.status, result.stderr).toBe(1)
    expect(result.stdout).toBe('')
    expect(JSON.parse(result.stderr)).toEqual({ error: expect.any(String) })
    expect(readdirSync(output)).toEqual([])
    expect(treeFiles(outside, { rejectLinks: true })).toEqual(externalBefore)
  }
})

it.skipIf(process.platform === 'win32')('rejects special files without reading or copying them', () => {
  const { output, invoke, makePackage } = fixture()
  const source = makePackage('source', 'fifo-package')
  execFileSync('mkfifo', [join(source, 'pipe')])
  const result = invoke([source])
  expect(result.status, result.stderr).toBe(1)
  expect(result.stdout).toBe('')
  expect(readdirSync(output)).toEqual([])
  expect(lstatSync(join(source, 'pipe')).isFIFO()).toBe(true)
})
