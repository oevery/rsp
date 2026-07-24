import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function worktreeRegistry(repository = root) {
  return spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: repository, encoding: 'utf8' }).stdout
}

function isolatedRepository(prefix: string) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), prefix))
  const repository = join(temporaryRoot, 'repository')
  const workspaceRoot = join(temporaryRoot, 'workspaces')
  execFileSync('git', ['clone', '--quiet', '--no-local', root, repository])
  mkdirSync(workspaceRoot)
  return { temporaryRoot, repository, workspaceRoot }
}

describe('package evidence orchestrator', () => {
  it('cleans its transient workspace when preparation fails', () => {
    const before = new Set(readdirSync(tmpdir()).filter(name => name.startsWith('rsp-package-evidence-')))
    const result = spawnSync(process.execPath, [join(root, 'scripts', 'package-evidence.mjs'), '--baseline-ref', 'missing-evidence-ref'], { cwd: root, encoding: 'utf8' })
    const after = readdirSync(tmpdir()).filter(name => name.startsWith('rsp-package-evidence-') && !before.has(name))
    expect(result.status).not.toBe(0)
    expect(after).toEqual([])
  })

  it('removes a registered worktree and transient directory after an injected failure', () => {
    const fixture = isolatedRepository('rsp-package-evidence-test-')
    const before = worktreeRegistry(fixture.repository)
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'package-evidence.mjs'), '--baseline-ref', '8d351c270b1116e9d1b2929208ee898cd7f7e998', '--repository', fixture.repository], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, RSP_PACKAGE_EVIDENCE_FAIL_AFTER_WORKTREE: '1', RSP_PACKAGE_EVIDENCE_TMP_ROOT: fixture.workspaceRoot },
      })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('injected failure after worktree registration')
      expect(readdirSync(fixture.workspaceRoot)).toEqual([])
      expect(worktreeRegistry(fixture.repository)).toBe(before)
    }
    finally {
      rmSync(fixture.temporaryRoot, { force: true, recursive: true })
    }
  })

  it('reports worktree remove failure, prunes, and verifies registry recovery', () => {
    const fixture = isolatedRepository('rsp-package-evidence-remove-test-')
    const before = worktreeRegistry(fixture.repository)
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'package-evidence.mjs'), '--baseline-ref', '8d351c270b1116e9d1b2929208ee898cd7f7e998', '--repository', fixture.repository], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          RSP_PACKAGE_EVIDENCE_FAIL_AFTER_WORKTREE: '1',
          RSP_PACKAGE_EVIDENCE_FAIL_WORKTREE_REMOVE: '1',
          RSP_PACKAGE_EVIDENCE_TMP_ROOT: fixture.workspaceRoot,
        },
      })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('Package evidence cleanup warning: git worktree remove failed: injected worktree remove failure')
      expect(readdirSync(fixture.workspaceRoot)).toEqual([])
      expect(worktreeRegistry(fixture.repository)).toBe(before)
    }
    finally {
      rmSync(fixture.temporaryRoot, { force: true, recursive: true })
    }
  })
})
