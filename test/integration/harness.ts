import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll } from 'vitest'
import { CHANGES_DIR, clearConfigCache, RSP_DIR } from '../../src/core/config.js'
import { renderGroupBrief } from '../support/rsp-documents.js'

export { renderChange, renderGeneratedIndexMetadata, renderGroupBrief } from '../support/rsp-documents.js'

let testDir: string
let origCwd: string
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export function rspPath(...parts: string[]) {
  return join(testDir, RSP_DIR, ...parts)
}

export function changesPath(...parts: string[]) {
  return join(testDir, CHANGES_DIR, ...parts)
}

export function focusDPath(...parts: string[]) {
  return rspPath('focus.d', ...parts)
}

export function archivePath(...parts: string[]) {
  return rspPath('archives', ...parts)
}

export function specPath(...parts: string[]) {
  return rspPath('specs', ...parts)
}

export function cliPath() {
  return join(repoRoot, 'dist', 'cli.mjs')
}

export async function createRspFixture(prefix: string, directories: string[] = ['specs', 'changes']): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  for (const directory of directories)
    await mkdir(join(root, RSP_DIR, directory), { recursive: true })
  await writeFile(join(root, RSP_DIR, 'rsp-rules.md'), '# RSP\n')
  if (directories.includes('specs'))
    await writeFile(join(root, RSP_DIR, 'specs', 'design.md'), '# Design\n')
  return root
}

export async function completeOpenChange(root: string, name: string): Promise<void> {
  const path = join(root, '.rsp', 'changes', `${name}.md`)
  await writeFile(path, completeReopenChange(await readFile(path, 'utf-8')))
}

export function completeReopenChange(content: string): string {
  return content
    .replace('kind: "<choose: feature | fix | refactor | docs | ops | research>"', 'kind: feature')
    .replaceAll('- [ ]', '- [x]')
}

export async function createClosedGroupProject(prefix: string): Promise<string> {
  const root = join(tmpdir(), prefix, randomUUID())
  await mkdir(root, { recursive: true })
  execSync(`node ${cliPath()} init`, { cwd: root })
  execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: root })
  await writeFile(join(root, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
  execSync(`node ${cliPath()} create release/api`, { cwd: root })
  execSync(`node ${cliPath()} create release/ui`, { cwd: root })
  await completeOpenChange(root, 'release/api')
  await completeOpenChange(root, 'release/ui')
  execSync(`node ${cliPath()} archive release/api`, { cwd: root })
  execSync(`node ${cliPath()} archive release/ui`, { cwd: root })
  execSync(`node ${cliPath()} group close release`, { cwd: root })
  return root
}

beforeAll(async () => {
  testDir = join(tmpdir(), 'rsp-int-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)

  const dirs = ['specs', 'changes', 'archives', 'focus.d']
  for (const d of dirs)
    await mkdir(rspPath(d), { recursive: true })

  await writeFile(rspPath('rsp-rules.md'), '# RSP Rules\n')
  await writeFile(specPath('design.md'), '# Project Design: Integration Test\n')
})

afterAll(() => {
  process.chdir(origCwd)
  clearConfigCache()
})
