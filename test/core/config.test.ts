import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateConfigTemplate } from '../../src/commands/init.js'
import { clearConfigCache, DEFAULT_REQUIRED_SECTIONS, inspectRspConfig, loadRspConfig, reconcileRspConfigDefaults, resolveKinds, resolveLanguagePolicy, resolveManagePolicy, resolveRequiredSections, VALID_KINDS } from '../../src/core/config.js'

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

describe('resolveLanguagePolicy', () => {
  it('leaves every surface unset when project language is absent or config is invalid', () => {
    expect(resolveLanguagePolicy({})).toEqual({ artifacts: null, commit: null })
    expect(resolveLanguagePolicy({ language: { default: 'zh-CN' } }, { configValid: false }))
      .toEqual({ artifacts: null, commit: null })
  })

  it('uses the project default for both durable surfaces unless one overrides it', () => {
    expect(resolveLanguagePolicy({ language: { default: 'zh-CN' } }))
      .toEqual({ artifacts: 'zh-CN', commit: 'zh-CN' })
    expect(resolveLanguagePolicy({ language: { default: 'zh-CN', artifacts: 'en', commit: 'zh-CN' } }))
      .toEqual({ artifacts: 'en', commit: 'zh-CN' })
  })
})

describe('generated config language guidance', () => {
  it('writes every safe default as active YAML', () => {
    const template = generateConfigTemplate()
    expect(template).toContain('kinds: []')
    expect(template).toContain('decisions:\n  path: .rsp/specs/decisions')
    expect(template).toContain('language:\n  default: en\n  # artifacts: zh-CN\n  # commit: zh-CN')
    expect(template).toContain('manage:\n  activation: auto\n  closeout: local')
    expect(template).not.toContain('workspace:')
  })
})

describe('reconcileRspConfigDefaults', () => {
  it('fills missing defaults while preserving custom values and comments', () => {
    const result = reconcileRspConfigDefaults(`# Keep this project choice.
kinds:
  - lesson
manage:
  activation: explicit
language:
  default: zh-CN
`)

    expect(result.added).toEqual(['decisions.path', 'manage.closeout'])
    expect(result.changed).toBe(true)
    expect(result.content).toContain('# Keep this project choice.')
    expect(result.content).toContain('kinds:\n  - lesson')
    expect(result.content).toContain('activation: explicit')
    expect(result.content).toContain('closeout: local')
    expect(result.content).toContain('language:\n  default: zh-CN')
    expect(result.content).not.toContain('workspace:')
  })

  it('preserves inline comments during conservative backfill', () => {
    const raw = `kinds: [] # Keep the built-in classification set.
manage:
  activation: auto
  closeout: local
language:
  default: en
`
    const result = reconcileRspConfigDefaults(raw)

    expect(result.changed).toBe(true)
    expect(result.added).toEqual(['decisions.path'])
    expect(result.content).toContain('kinds: [] # Keep the built-in classification set.')
    expect(result.content).toContain('decisions:\n  path: .rsp/specs/decisions')
    expect(result.content).not.toContain('workspace:')
  })

  it('does not rewrite a complete config', () => {
    const raw = `${generateConfigTemplate()}`
    expect(reconcileRspConfigDefaults(raw)).toEqual({ content: raw, added: [], changed: false })
  })

  it('rebuilds generated layouts while preserving custom values', () => {
    const result = reconcileRspConfigDefaults(`# RSP project configuration
# Omit kinds or use [] to retain the built-in defaults.
# A non-empty kinds list replaces the built-in defaults; it does not extend them.
# Every entry must be a unique non-empty string.
#
# Built-in defaults:
#   kinds:               feature, fix, refactor, docs, ops, research
#
# kinds:
# - feature
# - fix
# - refactor
# - docs
# - ops
# - research

language:
  default: zh-CN

manage:
  activation: explicit
  closeout: local
`)

    expect(result.added).toEqual(['kinds', 'decisions.path'])
    expect(result.changed).toBe(true)
    expect(result.content).toContain('kinds: []')
    expect(result.content).toContain('decisions:\n  path: .rsp/specs/decisions')
    expect(result.content).toContain('language:\n  default: zh-CN')
    expect(result.content).toContain('  # artifacts: zh-CN')
    expect(result.content).toContain('  # commit: zh-CN')
    expect(result.content).toContain('manage:\n  activation: explicit\n  closeout: local')
    expect(result.content).not.toContain('workspace:')
    expect(result.content).not.toContain('# Omit kinds')
  })

  it('renders configured language overrides as active fields', () => {
    const result = reconcileRspConfigDefaults(`language:
  default: zh-CN
  artifacts: en
  commit: zh-CN
manage:
  activation: auto
  closeout: local
kinds: []
decisions:
  path: docs/adr
`)

    expect(result.content).toContain('language:\n  default: zh-CN\n  artifacts: en\n  commit: zh-CN')
    expect(result.content).not.toContain('workspace:')
    expect(result.content).not.toContain('# artifacts:')
    expect(result.content).not.toContain('# commit:')
  })

  it('rejects invalid config without producing replacement content', () => {
    expect(() => reconcileRspConfigDefaults('manage:\n  activation: always\n')).toThrow(
      'config.yaml field "manage.activation" must be one of: explicit, auto',
    )
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
language:
  default: zh-cn
  artifacts: EN
  commit: zh-cn
`)

    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      const config = await loadRspConfig()
      expect(config).toEqual({
        kinds: ['fix', 'docs'],
        decisions: { path: 'docs/adr' },
        manage: { activation: 'auto', closeout: 'lifecycle' },
        language: { default: 'zh-CN', artifacts: 'en', commit: 'zh-CN' },
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

  it('rejects the removed workspace configuration surface', async () => {
    const configDir = join(tmpdir(), 'rsp-config-removed-workspace-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    const configPath = join(configDir, '.rsp', 'config.yaml')
    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      await writeFile(configPath, 'workspace:\n  activation: explicit\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "workspace" is not supported')
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('strictly validates and canonicalizes project language configuration', async () => {
    const configDir = join(tmpdir(), 'rsp-config-invalid-language-test', randomUUID())
    await mkdir(join(configDir, '.rsp'), { recursive: true })
    const configPath = join(configDir, '.rsp', 'config.yaml')
    const cwd = process.cwd()
    process.chdir(configDir)

    try {
      await writeFile(configPath, 'language: zh-CN\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language" must be a YAML mapping')

      clearConfigCache()
      await writeFile(configPath, 'language:\n  artifacts: zh-CN\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language.default" is required')

      clearConfigCache()
      await writeFile(configPath, 'language:\n  default: en\n  response: zh-CN\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language.response" is not supported')

      clearConfigCache()
      await writeFile(configPath, 'language:\n  default: zh_CN\n  locale: zh-CN\n')
      const inspection = await inspectRspConfig()
      expect(inspection.issues).toEqual([
        'config.yaml field "language.locale" is not supported',
        'config.yaml field "language.default" must be a non-empty valid BCP 47 language tag',
      ])
      expect(resolveLanguagePolicy(inspection.config, { configValid: false }))
        .toEqual({ artifacts: null, commit: null })

      clearConfigCache()
      await writeFile(configPath, 'language:\n  default: ""\n  artifacts: []\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language.default" must be a non-empty valid BCP 47 language tag')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language.artifacts" must be a non-empty valid BCP 47 language tag')

      clearConfigCache()
      await writeFile(configPath, 'language:\n  default: zh-CN\n  commit: zh_CN\n')
      await expect(loadRspConfig()).rejects.toThrow('config.yaml field "language.commit" must be a non-empty valid BCP 47 language tag')
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
