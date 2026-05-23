import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { clearConfigCache, DEFAULT_REQUIRED_SECTIONS, loadRspConfig, resolvePriorities, resolveRequiredSections, resolveStatuses, VALID_PRIORITIES, VALID_STATUSES } from '../src/core/config.js'

afterEach(() => {
  clearConfigCache()
})

describe('resolveStatuses', () => {
  it('returns defaults when config has no statuses', () => {
    expect(resolveStatuses({})).toEqual(VALID_STATUSES)
  })

  it('returns defaults when statuses is empty array', () => {
    expect(resolveStatuses({ statuses: [] })).toEqual(VALID_STATUSES)
  })

  it('returns custom statuses from config', () => {
    const result = resolveStatuses({ statuses: ['draft', 'review', 'done'] })
    expect(result).toEqual(['draft', 'review', 'done'])
  })
})

describe('resolvePriorities', () => {
  it('returns defaults when config has no priorities', () => {
    expect(resolvePriorities({})).toEqual(VALID_PRIORITIES)
  })

  it('returns defaults when priorities is empty array', () => {
    expect(resolvePriorities({ priorities: [] })).toEqual(VALID_PRIORITIES)
  })

  it('returns custom priorities from config', () => {
    const result = resolvePriorities({ priorities: ['low', 'critical'] })
    expect(result).toEqual(['low', 'critical'])
  })
})

describe('resolveRequiredSections', () => {
  it('returns defaults when config has no sections', () => {
    expect(resolveRequiredSections({})).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })

  it('returns defaults when sections is empty array', () => {
    expect(resolveRequiredSections({ required_sections: [] })).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })

  it('returns custom sections from config', () => {
    const result = resolveRequiredSections({ required_sections: ['Spec', 'Plan', 'Tests'] })
    expect(result).toEqual(['Spec', 'Plan', 'Tests'])
  })
})

describe('loadRspConfig', () => {
  it('reads .rsp/config.yaml from disk', async () => {
    const configDir = join(tmpdir(), 'rsp-config-read-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), `statuses:
  - draft
  - review
priorities:
  - low
  - critical
required_sections:
  - Spec
  - Plan
  - Tests
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config).toEqual({
        statuses: ['draft', 'review'],
        priorities: ['low', 'critical'],
        required_sections: ['Spec', 'Plan', 'Tests'],
      })
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('returns cached config until clearConfigCache is called', async () => {
    const configDir = join(tmpdir(), 'rsp-config-cache-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    const configPath = join(configDir, '.rsp', 'config.yaml')
    await writeFile(configPath, `statuses:
  - draft
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const first = await loadRspConfig()
      expect(first).toEqual({ statuses: ['draft'], priorities: undefined, required_sections: undefined })

      await writeFile(configPath, `statuses:
  - blocked
`)

      const cached = await loadRspConfig()
      expect(cached).toEqual({ statuses: ['draft'], priorities: undefined, required_sections: undefined })

      clearConfigCache()
      const refreshed = await loadRspConfig()
      expect(refreshed).toEqual({ statuses: ['blocked'], priorities: undefined, required_sections: undefined })
    }
    finally {
      process.chdir(cwd)
    }
  })
})
