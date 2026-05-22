import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LOCK_PATH, RSP_DIR } from '../src/core/config.js'
import { withRspLock } from '../src/core/lock.js'

let testDir: string
let origCwd: string

beforeAll(async () => {
  testDir = join(tmpdir(), 'rsp-lock-test', randomUUID())
  await mkdir(testDir, { recursive: true })
  origCwd = process.cwd()
  process.chdir(testDir)
})

beforeEach(async () => {
  // Ensure clean state
  const lockFile = join(testDir, RSP_DIR, '.lock')
  if (existsSync(lockFile))
    await unlink(lockFile)
})

afterEach(async () => {
  const lockFile = join(testDir, RSP_DIR, '.lock')
  if (existsSync(lockFile))
    await unlink(lockFile)
})

afterAll(() => {
  process.chdir(origCwd)
})

describe('withRspLock', () => {
  it('creates and removes lock file around operation', async () => {
    const lockPath = join(testDir, LOCK_PATH)

    await withRspLock('test', async () => {
      expect(existsSync(lockPath)).toBe(true)
      const content = await readFile(lockPath, 'utf-8')
      expect(content).toContain('test')
      expect(content).toContain(String(process.pid))
    })

    expect(existsSync(lockPath)).toBe(false)
  })

  it('returns the operation result', async () => {
    const result = await withRspLock('test', async () => 42)
    expect(result).toBe(42)
  })

  it('removes lock even when operation throws', async () => {
    const lockPath = join(testDir, LOCK_PATH)
    await expect(
      withRspLock('test', async () => {
        throw new Error('oops')
      }),
    ).rejects.toThrow('oops')

    expect(existsSync(lockPath)).toBe(false)
  })

  it('cleans up stale lock from dead PID', async () => {
    const lockPath = join(testDir, LOCK_PATH)
    const deadPid = 999999999
    await mkdir(join(testDir, RSP_DIR), { recursive: true })
    await writeFile(lockPath, `${deadPid}\ntest\n2026-01-01T00:00:00.000Z`)

    const result = await withRspLock('test', async () => 'ok')
    expect(result).toBe('ok')
    expect(existsSync(lockPath)).toBe(false)
  })

  it('throws on active lock conflict', async () => {
    const lockPath = join(testDir, LOCK_PATH)
    await mkdir(join(testDir, RSP_DIR), { recursive: true })
    await writeFile(lockPath, `${process.pid}\ntest\n${new Date().toISOString()}`)

    await expect(
      withRspLock('test', async () => 'should not run'),
    ).rejects.toThrow(/locked/)
  })

  it('cleans up malformed lock file', async () => {
    const lockPath = join(testDir, LOCK_PATH)
    await mkdir(join(testDir, RSP_DIR), { recursive: true })
    await writeFile(lockPath, 'not-a-pid')

    const result = await withRspLock('test', async () => 'cleaned')
    expect(result).toBe('cleaned')
  })
})
