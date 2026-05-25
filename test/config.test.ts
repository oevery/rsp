import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { clearConfigCache, DEFAULT_REQUIRED_SECTIONS, loadRspConfig, resolveKinds, resolveRequiredSections, VALID_KINDS } from '../src/core/config.js'

afterEach(() => {
  clearConfigCache()
})

describe('resolveKinds', () => {
  it('returns defaults when config has no kinds', () => {
    expect(resolveKinds({})).toEqual(VALID_KINDS)
  })

  it('returns defaults when kinds is empty array', () => {
    expect(resolveKinds({ kinds: [] })).toEqual(VALID_KINDS)
  })

  it('returns custom kinds from config', () => {
    const result = resolveKinds({ kinds: ['fix', 'ops'] })
    expect(result).toEqual(['fix', 'ops'])
  })
})

describe('resolveRequiredSections', () => {
  it('returns defaults when config has no sections', () => {
    expect(resolveRequiredSections({})).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })

  it('keeps defaults because required_sections is not configurable', () => {
    expect(resolveRequiredSections({ required_sections: ['Proposal', 'Spec'] } as never)).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })
})

describe('loadRspConfig', () => {
  it('reads .rsp/config.yaml from disk', async () => {
    const configDir = join(tmpdir(), 'rsp-config-read-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), `kinds:
  - fix
  - docs
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config).toEqual({
        kinds: ['fix', 'docs'],
      })
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('supports standard YAML syntax in config.yaml', async () => {
    const configDir = join(tmpdir(), 'rsp-config-yaml-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), `kinds: ["fix", "docs"]
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config).toEqual({
        kinds: ['fix', 'docs'],
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
    await writeFile(configPath, `kinds:
  - fix
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const first = await loadRspConfig()
      expect(first).toEqual({ kinds: ['fix'] })

      await writeFile(configPath, `kinds:
  - docs
`)

      const cached = await loadRspConfig()
      expect(cached).toEqual({ kinds: ['fix'] })

      clearConfigCache()
      const refreshed = await loadRspConfig()
      expect(refreshed).toEqual({ kinds: ['docs'] })
    }
    finally {
      process.chdir(cwd)
    }
  })
})
