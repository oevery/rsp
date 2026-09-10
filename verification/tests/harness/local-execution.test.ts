import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { executeLocalCommand, localCommandEvidence } from '../../harness/local-execution.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('verification runtime evidence harness', () => {
  it('derives command, workspace, artifact, and timing evidence from a real process', () => {
    const receipt = executeLocalCommand({
      root,
      command: 'node',
      args: ['-e', 'process.stdout.write(\'authorization: Bearer abcdefghijkl /Users/person/private.txt\')'],
      artifactPaths: ['package.json'],
    })

    expect(receipt).toMatchObject({
      command_failures: [],
      host_observed: { exit_code: 0, timeout: false },
      artifacts: [expect.objectContaining({ path: 'package.json', observed: true, sha256: expect.any(String) })],
    })
    expect(receipt.events.map(event => event.type)).toEqual(['command_started', 'command_completed', 'workspace_observed'])
    expect(localCommandEvidence(receipt)[0]).toMatchObject({ id: 'event-1', provenance: { source: 'host', observed: true } })
    expect(receipt.host_observed.changed_paths).toEqual([])
    expect(receipt.events[2]).toMatchObject({ details: { changed_paths: 0 } })
    expect(receipt.host_observed.stdout).toContain('[REDACTED]')
    expect(receipt.host_observed.stdout).toContain('<absolute-path>')
    expect(JSON.stringify(receipt)).not.toContain('abcdefghijkl')
    expect(localCommandEvidence(receipt).length).toBeGreaterThan(3)
  })

  it('records files nested below an observed artifact directory', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'rsp-artifact-tree-'))
    try {
      mkdirSync(join(fixture, 'reports', 'run-1'), { recursive: true })
      writeFileSync(join(fixture, 'reports', 'run-1', 'package.tgz'), 'tarball')
      const receipt = executeLocalCommand({
        root: fixture,
        command: 'node',
        args: ['-e', 'process.exit(0)'],
        artifactPaths: ['reports'],
      })

      expect(receipt.artifacts).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'reports', kind: 'directory', observed: true }),
        expect.objectContaining({ path: 'reports/run-1/package.tgz', observed: true, bytes: 7, sha256: expect.any(String) }),
      ]))
      expect(receipt.artifacts.filter(artifact => artifact.path === 'reports/run-1/package.tgz')).toHaveLength(1)
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it('retains command failure and unavailable capability evidence', () => {
    const failed = executeLocalCommand({ root, command: 'node', args: ['-e', 'process.exit(7)'] })
    const unavailable = executeLocalCommand({ root, command: 'rsp-verification-command-that-does-not-exist' })

    expect(failed).toMatchObject({ command_failures: [expect.objectContaining({ exit_code: 7, expected_exit_code: 0 })] })
    expect(unavailable.command_failures).toHaveLength(1)
    expect(unavailable.unavailable).toHaveLength(1)
  })

  it('detects content changes to an already-dirty tracked file', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'rsp-dirty-delta-'))
    try {
      spawnSync('git', ['init', '-q', fixture])
      writeFileSync(join(fixture, 'tracked.txt'), 'base\n')
      spawnSync('git', ['-C', fixture, 'add', 'tracked.txt'])
      spawnSync('git', ['-C', fixture, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'base'])
      writeFileSync(join(fixture, 'tracked.txt'), 'pre-existing-dirty\n')
      const receipt = executeLocalCommand({ root: fixture, command: 'node', args: ['-e', 'require("node:fs").writeFileSync("tracked.txt", "changed-again\\n")'] })

      expect(receipt.host_observed.changed_paths).toEqual(['tracked.txt'])
      expect(receipt.events[2]).toMatchObject({ details: { changed_paths: 1 } })
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it('detects content changes to an already-dirty Unicode tracked file', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'rsp-unicode-delta-'))
    const filename = '已存在的脏文件.txt'
    try {
      spawnSync('git', ['init', '-q', fixture])
      writeFileSync(join(fixture, filename), 'base\n')
      spawnSync('git', ['-C', fixture, 'add', filename])
      spawnSync('git', ['-C', fixture, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'base'])
      writeFileSync(join(fixture, filename), 'pre-existing-dirty\n')
      const receipt = executeLocalCommand({ root: fixture, command: 'node', args: ['-e', 'require("node:fs").writeFileSync(process.argv[1], "changed-again\\n")', filename] })

      expect(receipt.host_observed.changed_paths).toEqual([filename])
      expect(receipt.events[2]).toMatchObject({ details: { changed_paths: 1 } })
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it('rejects symlink cwd escapes and does not inherit arbitrary environment values', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'rsp-isolation-'))
    const outside = mkdtempSync(join(tmpdir(), 'rsp-isolation-outside-'))
    const previousCanary = process.env.VERIFICATION_CANARY
    try {
      symlinkSync(outside, join(fixture, 'linked'), 'dir')
      expect(() => executeLocalCommand({ root: fixture, cwd: 'linked', command: 'node', args: ['-e', 'process.exit(0)'] })).toThrow('through a symlink')

      process.env.VERIFICATION_CANARY = 'private-canary'
      const receipt = executeLocalCommand({ root: fixture, command: 'node', args: ['-e', 'process.stdout.write(process.env.VERIFICATION_CANARY ?? \'missing\')'] })
      expect(receipt.host_observed.stdout).toBe('missing')

      const argumentReceipt = executeLocalCommand({ root: fixture, command: 'node', args: ['-e', 'process.exit(0)', '--token', 'private-canary'] })
      expect(argumentReceipt.host_observed.command).toContain('--token [REDACTED]')

      const nestedNode = executeLocalCommand({ root: fixture, command: 'zsh', args: ['-c', `${process.execPath} -e \"process.stdout.write('nested-node')\"`] })
      expect(nestedNode.command_failures).toEqual([])
      expect(nestedNode.host_observed.stdout).toBe('nested-node')
    }
    finally {
      if (previousCanary === undefined)
        delete process.env.VERIFICATION_CANARY
      else
        process.env.VERIFICATION_CANARY = previousCanary
      rmSync(fixture, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })
})
