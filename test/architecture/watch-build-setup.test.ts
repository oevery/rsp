import type { TestProject } from 'vitest/node'
import { describe, expect, it, vi } from 'vitest'
import setup from '../support/watch-build-setup'

const { execFileSync } = vi.hoisted(() => ({
  execFileSync: vi.fn(),
}))

vi.mock('node:child_process', () => ({ execFileSync }))

describe('vitest watch build setup', () => {
  it('builds before workers and again before watch reruns', () => {
    const onTestsRerun = vi.fn()

    setup({ onTestsRerun } as unknown as TestProject)

    expect(execFileSync).toHaveBeenCalledTimes(1)
    expect(onTestsRerun).toHaveBeenCalledTimes(1)

    const rerun = onTestsRerun.mock.calls[0][0]
    rerun()

    expect(execFileSync).toHaveBeenCalledTimes(2)
    expect(execFileSync).toHaveBeenLastCalledWith(
      'pnpm',
      ['run', 'build'],
      expect.objectContaining({ stdio: 'pipe' }),
    )
  })
})
