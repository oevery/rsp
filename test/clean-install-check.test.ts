import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const expectedSkills = [
  'rsp',
  'rsp-address-review',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]

describe('clean install package check', () => {
  it('packs, installs, validates, reports, and cleans the exact package', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-test-'))
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot },
      })

      expect(result.status, result.stderr || result.stdout).toBe(0)
      const report = JSON.parse(result.stdout) as Record<string, any>
      expect(report.package).toBe('@oevery/rsp@3.0.0')
      expect(report.tarballSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(report.inventory.skills).toEqual(expectedSkills)
      expect(report.rspDesignReferences).toEqual([
        'domain-modeling.md',
        'module-seams.md',
        'reversible-exploration.md',
      ])
      expect(report.inventory.files).toContain('skills/rsp-design/SKILL.md')
      expect(report.inventory.files.some((path: string) => /^(?:research|\.rsp|\.agents|scripts|\.cache)(?:\/|$)/u.test(path))).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  }, 120_000)
})
