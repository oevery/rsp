import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { showConfig } from '../../src/commands/config.js'
import { clearConfigCache } from '../../src/core/config.js'

afterEach(() => {
  clearConfigCache()
})

describe('showConfig', () => {
  it('projects effective language and Manage values without inspecting work state', async () => {
    const root = join(tmpdir(), 'rsp-config-command-test', `${Date.now()}-valid`)
    await mkdir(join(root, '.rsp'), { recursive: true })
    await writeFile(join(root, '.rsp', 'config.yaml'), ['language:', '  default: zh-CN', 'manage:', '  activation: auto', '  closeout: lifecycle'].join('\n'))
    await writeFile(join(root, '.rsp', 'changes'), 'not a directory')

    const cwd = process.cwd()
    process.chdir(root)
    try {
      const result = await showConfig()
      expect(result).toMatchObject({
        command: 'config',
        ok: true,
        summary: {
          kinds: ['feature', 'fix', 'refactor', 'docs', 'ops', 'research'],
          decisions: { path: '.rsp/specs/decisions' },
          manage: { activation: 'auto', closeout: 'lifecycle' },
          language: { artifacts: 'zh-CN', commit: 'zh-CN' },
        },
        diagnostics: [],
      })
    }
    finally {
      process.chdir(cwd)
    }
  })

  it('fails closed on invalid configuration without scanning work state', async () => {
    const root = join(tmpdir(), 'rsp-config-command-test', `${Date.now()}-invalid`)
    await mkdir(join(root, '.rsp'), { recursive: true })
    await writeFile(join(root, '.rsp', 'config.yaml'), ['language:', '  default: nope invalid'].join('\n'))
    await writeFile(join(root, '.rsp', 'changes'), 'not a directory')

    const cwd = process.cwd()
    process.chdir(root)
    try {
      const result = await showConfig()
      expect(result.ok).toBe(false)
      expect(result.diagnostics[0]).toMatchObject({ code: 'invalid_config', path: '.rsp/config.yaml' })
    }
    finally {
      process.chdir(cwd)
    }
  })
})
