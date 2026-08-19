import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const checker = join(root, 'scripts', 'release-metadata-check.mjs')
const version = '4.2.0-beta.3'

function fixture(overrides: Partial<Record<string, string>> = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-release-metadata-check-'))
  const files: Record<string, string> = {
    'package.json': JSON.stringify({ name: '@example/rsp', version }),
    'CHANGELOG.md': `# Changelog\n\n## ${version} (2026-07-25)\n\n- Ship the finalized release.\n\n## 4.1.0 (2026-06-01)\n`,
    'README.md': `# Example\n\nUse \`npx -y @example/rsp@${version}\`.\n`,
    'README.zh-CN.md': `# 示例\n\n使用 \`npx -y @example/rsp@${version}\`。\n`,
    [`docs/releases/${version}.md`]: `# RSP ${version}\n\n**Full comparison:** [v4.1.0...v${version}](https://example.test/compare/v4.1.0...v${version})\n`,
    ...overrides,
  }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(directory, path, '..'), { recursive: true })
    writeFileSync(join(directory, path), content)
  }
  return directory
}

function run(directory: string) {
  return spawnSync(process.execPath, [checker, '--root', directory], { encoding: 'utf8' })
}

describe('release metadata check', () => {
  it('accepts finalized metadata for the package version', () => {
    const directory = fixture()
    try {
      const result = run(directory)
      expect(result.status, result.stderr).toBe(0)
      expect(result.stdout).toContain('Release metadata check passed for @example/rsp@4.2.0-beta.3.')
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects an Unreleased heading only when it belongs to the package version', () => {
    const directory = fixture({
      'CHANGELOG.md': `# Changelog\n\n## ${version} (Unreleased)\n\n- Current work.\n\n## 4.1.0 (Unreleased)\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`CHANGELOG.md:3: release heading for ${version} must not be marked Unreleased`)
      expect(result.stderr).toContain(`CHANGELOG.md:3: release heading for ${version} must include a finalized YYYY-MM-DD date`)
      expect(result.stderr.match(/must not be marked Unreleased/gu)).toHaveLength(1)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects a target changelog heading without a finalized date', () => {
    const directory = fixture({
      'CHANGELOG.md': `# Changelog\n\n## ${version}\n\n- Current work.\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`CHANGELOG.md:3: release heading for ${version} must include a finalized YYYY-MM-DD date`)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects a mutable HEAD comparison with its exact source line', () => {
    const directory = fixture({
      [`docs/releases/${version}.md`]: `# RSP ${version}\n\nSummary.\n\n**Full comparison:** [v4.1.0...HEAD](https://example.test/compare/v4.1.0...HEAD)\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`docs/releases/${version}.md:5: release comparison must end at an immutable version tag, not HEAD`)
      expect(result.stderr).toContain(`docs/releases/${version}.md:1: release notes must include an immutable comparison ending at v${version}`)
      expect(result.stderr.match(/release comparison must end at an immutable version tag/gu)).toHaveLength(1)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('requires the release-note H1 and comparison target to match the package version', () => {
    const directory = fixture({
      [`docs/releases/${version}.md`]: '# RSP 4.2.0-beta.2\n\n**Full comparison:** [v4.1.0...v4.2.0-beta.2](https://example.test/compare/v4.1.0...v4.2.0-beta.2)\n',
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`docs/releases/${version}.md:1: release-note H1 must identify package version ${version}`)
      expect(result.stderr).toContain(`docs/releases/${version}.md:3: release comparison must end at current package version v${version}`)
      expect(result.stderr.match(/release comparison must end at current package version/gu)).toHaveLength(1)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('requires one current exact npx example in either README', () => {
    const directory = fixture({
      'README.md': '# Example\n\nMigrating from 3.0.0 remains supported.\n\n```bash\nnpx -y @example/rsp@4.2.0-beta.2 init\n```\n',
      'README.zh-CN.md': '# 示例\n\n历史版本 3.0.0 的迁移说明仍然有效。\n\n```bash\nnpx -y @example/rsp@4.2.0-beta.1 doctor\n```\n',
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`README.md:1: README must include an exact npx example for current package version ${version}`)
      expect(result.stderr).toContain(`README.zh-CN.md:1: README must include an exact npx example for current package version ${version}`)
      expect(result.stderr.match(/README must include an exact npx example for current package version/gu)).toHaveLength(2)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('allows historical exact commands when a current exact example remains present', () => {
    const directory = fixture({
      'README.md': `# Example\n\nCurrent: \`npx -y @example/rsp@${version} init\`.\n\nRollback: \`npx -y @example/rsp@4.1.0 init\`.\n`,
      'README.zh-CN.md': `# 示例\n\n当前：\`npx -y @example/rsp@${version} init\`。\n\n回退：\`npx -y @example/rsp@4.1.0 init\`。\n`,
    })
    try {
      const result = run(directory)
      expect(result.status, result.stderr).toBe(0)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('requires @latest examples for a stable release', () => {
    const stableVersion = '4.2.0'
    const directory = fixture({
      'package.json': JSON.stringify({ name: '@example/rsp', version: stableVersion }),
      'CHANGELOG.md': `# Changelog\n\n## ${stableVersion} (2026-07-30)\n\n- Ship the stable release.\n`,
      'README.md': '# Example\n\nUse `npx -y @example/rsp@latest init`.\n',
      'README.zh-CN.md': '# 示例\n\n使用 `npx -y @example/rsp@latest init`。\n',
      [`docs/releases/${stableVersion}.md`]: `# RSP ${stableVersion}\n\n**Full comparison:** [v4.1.0...v${stableVersion}](https://example.test/compare/v4.1.0...v${stableVersion})\n`,
    })
    try {
      const result = run(directory)
      expect(result.status, result.stderr).toBe(0)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects a fixed stable version where @latest is required', () => {
    const stableVersion = '4.2.0'
    const directory = fixture({
      'package.json': JSON.stringify({ name: '@example/rsp', version: stableVersion }),
      'CHANGELOG.md': `# Changelog\n\n## ${stableVersion} (2026-07-30)\n\n- Ship the stable release.\n`,
      'README.md': `# Example\n\nUse \`npx -y @example/rsp@${stableVersion} init\`.\n`,
      'README.zh-CN.md': `# 示例\n\n使用 \`npx -y @example/rsp@${stableVersion} init\`。\n`,
      [`docs/releases/${stableVersion}.md`]: `# RSP ${stableVersion}\n\n**Full comparison:** [v4.1.0...v${stableVersion}](https://example.test/compare/v4.1.0...v${stableVersion})\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr.match(/README must use @latest for the current stable package example/gu)).toHaveLength(2)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects known future-publication phrases without banning unrelated release prose', () => {
    const directory = fixture({
      'README.md': `# Example\n\nThese registry commands remain unavailable until ${version} is published.\n\nUse \`npx -y @example/rsp@${version}\`.\n`,
      [`docs/releases/${version}.md`]: `# RSP ${version}\n\nPublication requires separate authority. This stable boundary remains true.\n\n**Full comparison:** [v4.1.0...v${version}](https://example.test/compare/v4.1.0...v${version})\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('README.md:3: package-facing text must not claim that the current version is unavailable')
      expect(result.stderr).not.toContain(`docs/releases/${version}.md`)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('allows general post-publication workflow guidance', () => {
    const directory = fixture({
      'README.md': `# Example\n\nUse \`npx -y @example/rsp@${version}\`. After publication, reconcile the hosted release against the candidate ref.\n`,
    })
    try {
      const result = run(directory)
      expect(result.status, result.stderr).toBe(0)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('rejects equivalent current-release future-publication variants', () => {
    const directory = fixture({
      [`docs/releases/${version}.md`]: `# RSP ${version}\n\nAfter this prerelease is published, use the exact registry identity.\n\n**Full comparison:** [v4.1.0...v${version}](https://example.test/compare/v4.1.0...v${version})\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`docs/releases/${version}.md:3: package-facing text must not present the current release as future`)
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it('reports repository line numbers for violations inside the target changelog section', () => {
    const directory = fixture({
      'CHANGELOG.md': `# Changelog\n\nPreface.\n\n## ${version} (2026-07-25)\n\nThis prerelease has only local tarball validation until separately authorized publication.\n\n## 4.1.0 (2026-06-01)\n`,
    })
    try {
      const result = run(directory)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('CHANGELOG.md:7: release text must not retain local-preparation status')
    }
    finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
