import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const cli = fileURLToPath(new URL('../../dist/cli.mjs', import.meta.url))
const loader = fileURLToPath(new URL('./reject-interactive-loader.mjs', import.meta.url))

function run(args: string[]) {
  return spawnSync(process.execPath, ['--no-warnings', '--experimental-loader', loader, cli, ...args], { encoding: 'utf8', env: { ...process.env, CI: 'true', TERM: 'dumb' } })
}

describe('cLI TUI routing and isolation', () => {
  it('keeps bare non-TTY invocation on normal help without loading interactive dependencies', () => {
    const result = run([])
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('RSP (Reliable Software Practice)')
    expect(result.stderr).not.toContain('interactive dependency loaded')
  })

  it('rejects explicit UI on a non-TTY with actionable static alternatives', () => {
    const result = run(['ui'])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('use rsp status or rsp status --json')
    expect(result.stderr).not.toContain('interactive dependency loaded')
  })

  it('rejects unsupported explicit locales before loading the TUI graph', () => {
    const result = run(['ui', '--lang', 'fr'])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('auto, en, or zh-CN')
    expect(result.stderr).not.toContain('interactive dependency loaded')
  })

  it('isolates root help/version/error and every registered subcommand help path', () => {
    const invocations = [
      ['--help'],
      ['--version'],
      ['--not-a-command'],
      ...['init', 'add', 'create', 'group', 'focus', 'unfocus', 'archive', 'ready', 'show', 'status', 'history', 'check', 'update', 'doctor'].map(command => [command, '--help']),
    ]
    for (const args of invocations) {
      const result = run(args)
      expect(result.stderr, args.join(' ')).not.toContain('interactive dependency loaded')
    }
  })

  it('accepts the exact command forms projected for Change and ready Group actions', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'rsp-tui-actions-'))
    try {
      mkdirSync(join(fixture, '.rsp', 'changes', 'delivery'), { recursive: true })
      mkdirSync(join(fixture, '.rsp', 'specs'), { recursive: true })
      writeFileSync(join(fixture, '.rsp', 'rsp-rules.md'), '# RSP\n')
      writeFileSync(join(fixture, '.rsp', 'specs', 'design.md'), '# Design\n')
      writeFileSync(join(fixture, '.rsp', 'changes', 'delivery', '00-brief.md'), '---\nkind: group\n---\n\n# Change Group: delivery\n\n## Goal\n- Deliver\n\n## Scope\n- API\n\n## Shared Constraints\n- none\n\n## Slices\n- `delivery/api`: API slice\n\n## Completion Conditions\n- [ ] complete\n\n## Durable Outcomes\n- none\n\n## Blockers\n- none\n')
      writeFileSync(join(fixture, '.rsp', 'changes', 'delivery', 'api.md'), '---\nkind: feature\n---\n\n# Change: delivery/api\n\n## Tasks\n- [ ] work\n\n## Verify\n- [ ] test\n\n## Blockers\n- none\n')
      const show = spawnSync(process.execPath, [cli, 'show', 'delivery/api'], { cwd: fixture, encoding: 'utf8' })
      const closeHelp = spawnSync(process.execPath, [cli, 'group', 'close', '--help'], { cwd: fixture, encoding: 'utf8' })
      expect(show.status).toBe(0)
      expect(show.stdout).toContain('delivery/api')
      expect(closeHelp.status).toBe(0)
    }
    finally {
      rmSync(fixture, { force: true, recursive: true })
    }
  })
})
