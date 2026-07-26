import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { clearConfigCache, DEFAULT_REQUIRED_SECTIONS, inspectRspConfig, loadRspConfig, resolveKinds, resolveManagePolicy, resolveRequiredSections, VALID_KINDS } from '../src/core/config.js'

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

describe('resolveManagePolicy', () => {
  it('preserves explicit-managed local-closeout behavior when config is absent', () => {
    expect(resolveManagePolicy({})).toEqual({ activation: 'explicit', closeout: 'local' })
  })

  it('resolves configured values and fails closed when config is invalid', () => {
    const config = { manage: { activation: 'auto' as const, closeout: 'lifecycle' as const } }
    expect(resolveManagePolicy(config)).toEqual({ activation: 'auto', closeout: 'lifecycle' })
    expect(resolveManagePolicy(config, { configValid: false })).toEqual({ activation: 'explicit', closeout: 'manual' })
  })
})

describe('loadRspConfig', () => {
  it('reads .rsp/config.yaml from disk', async () => {
    const configDir = join(tmpdir(), 'rsp-config-read-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), `kinds:
  - fix
  - docs
decisions:
  path: docs/adr/
manage:
  activation: auto
  closeout: lifecycle
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config).toEqual({
        kinds: ['fix', 'docs'],
        decisions: { path: 'docs/adr' },
        manage: { activation: 'auto', closeout: 'lifecycle' },
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

  it('rejects unsupported top-level fields instead of silently ignoring them', async () => {
    const configDir = join(tmpdir(), 'rsp-config-unknown-field-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), 'kindz: [fix]\n')

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "kindz" is not supported')
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('rejects non-string, empty, and duplicate kind values', async () => {
    const configDir = join(tmpdir(), 'rsp-config-invalid-kinds-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    const configPath = join(configDir, '.rsp', 'config.yaml')

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      await writeFile(configPath, 'kinds: [fix, 1]\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "kinds" must contain only non-empty strings')

      clearConfigCache()
      await writeFile(configPath, 'kinds: [fix, ""]\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "kinds" must contain only non-empty strings')

      clearConfigCache()
      await writeFile(configPath, 'kinds: [fix, fix]\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "kinds" contains duplicate entries: fix')
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('strictly validates Manage shape, keys, and enum values', async () => {
    const configDir = join(tmpdir(), 'rsp-config-invalid-manage-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    const configPath = join(configDir, '.rsp', 'config.yaml')

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      await writeFile(configPath, 'manage: auto\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "manage" must be a YAML mapping')

      clearConfigCache()
      await writeFile(configPath, 'manage:\n  mode: auto\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "manage.mode" is not supported')

      clearConfigCache()
      await writeFile(configPath, 'manage:\n  activation: always\n  closeout: full\n')
      const inspection = await inspectRspConfig()
      expect(inspection.issues).toEqual([
        'config.yaml field "manage.activation" must be one of: explicit, auto',
        'config.yaml field "manage.closeout" must be one of: manual, lifecycle, local',
      ])
      expect(resolveManagePolicy(inspection.config, { configValid: inspection.issues.length === 0 }))
        .toEqual({ activation: 'explicit', closeout: 'manual' })
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('retains an empty kinds list so callers can resolve built-in defaults', async () => {
    const configDir = join(tmpdir(), 'rsp-config-empty-kinds-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    await writeFile(join(configDir, '.rsp', 'config.yaml'), 'kinds: []\n')

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config.kinds).toEqual([])
      expect(resolveKinds(config)).toEqual(VALID_KINDS)
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

  it('does not reuse cached Decision Record routing after the process changes projects', async () => {
    const firstDir = join(tmpdir(), 'rsp-config-cwd-first-test', randomUUID())
    const secondDir = join(tmpdir(), 'rsp-config-cwd-second-test', randomUUID())
    await mkdir(join(firstDir, '.rsp'), { recursive: true })
    await mkdir(join(secondDir, '.rsp'), { recursive: true })
    await writeFile(join(firstDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/first-adr\n')
    await writeFile(join(secondDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/second-adr\n')

    const cwd = process.cwd()
    try {
      process.chdir(firstDir)
      expect(await loadRspConfig()).toEqual({ kinds: undefined, decisions: { path: 'docs/first-adr' } })

      process.chdir(secondDir)
      expect(await loadRspConfig()).toEqual({ kinds: undefined, decisions: { path: 'docs/second-adr' } })
    }
    finally {
      process.chdir(cwd)
    }
  })
})
