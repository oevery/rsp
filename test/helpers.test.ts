import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { collectArchiveChecklist, collectArchiveReadiness, countCheckboxes, detectDeltaSections, generateChangeContent, generateDesignContent, generateSpecContent, getDurableReviewCandidateTargets, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter, parseScenarios, parseYamlLines, renderRspAgentsBlock } from '../src/core/helpers.js'

describe('parseYamlLines', () => {
  it('parses key-value pairs', () => {
    const result = parseYamlLines(['name: foo', 'stage: propose'])
    expect(result).toEqual({ name: 'foo', stage: 'propose' })
  })

  it('parses lists', () => {
    const result = parseYamlLines(['tags:', '  - backend', '  - ui'])
    expect(result).toEqual({ tags: ['backend', 'ui'] })
  })

  it('supports quoted scalars and inline lists', () => {
    const result = parseYamlLines(['kind: "fix"', 'tags: [backend, ui]'])
    expect(result).toEqual({ kind: 'fix', tags: ['backend', 'ui'] })
  })

  it('handles empty input', () => {
    expect(parseYamlLines([])).toEqual({})
  })
})

describe('parseFrontmatter', () => {
  it('extracts frontmatter from markdown content', () => {
    const content = `---
kind: fix
---
# Change`
    const result = parseFrontmatter(content)
    expect(result).toEqual({ kind: 'fix' })
  })

  it('returns null when no frontmatter', () => {
    expect(parseFrontmatter('# Just a heading')).toBeNull()
  })
})

describe('countCheckboxes', () => {
  it('counts todo, progress, done, and dropped checkboxes', () => {
    const content = `- [ ] todo
- [/] in progress
- [x] done
- [-] dropped`
    expect(countCheckboxes(content)).toEqual({ todo: 1, progress: 1, done: 1, dropped: 1, total: 4 })
  })
})

describe('detectDeltaSections', () => {
  it('detects ADDED, MODIFIED, and REMOVED markers', () => {
    const content = `## Spec
### ADDED
- x
### MODIFIED
- y
### REMOVED
- z`
    const result = detectDeltaSections(content)
    expect(result).toEqual({ added: true, modified: true, removed: true })
  })

  it('returns false when no deltas exist', () => {
    const content = `## Spec
### Acceptance
#### Scenario: ok
- GIVEN x
- WHEN y
- THEN z`
    expect(detectDeltaSections(content)).toEqual({ added: false, modified: false, removed: false })
  })
})

describe('parseScenarios', () => {
  it('extracts Given/When/Then scenarios', () => {
    const content = `#### Scenario: Valid login
- GIVEN a user
- WHEN they log in
- THEN they see dashboard`
    const scenarios = parseScenarios(content)
    expect(scenarios).toHaveLength(1)
    expect(scenarios[0].heading).toBe('Valid login')
    expect(scenarios[0].steps).toHaveLength(3)
  })
})

describe('hasMeaningfulBlockers', () => {
  it('returns false for none', () => {
    const content = `## Blockers
- none`
    expect(hasMeaningfulBlockers(content)).toBe(false)
  })

  it('returns true for a real blocker', () => {
    const content = `## Blockers
- waiting on api migration`
    expect(hasMeaningfulBlockers(content)).toBe(true)
  })

  it('ignores well-formed HTML comments but keeps incomplete comments fail-closed', () => {
    const commented = `## Blockers
- none
<!--
- requires \`ignored\`: example only
operator guidance
-->`
    const incomplete = `## Blockers
- none
<!-- unresolved guidance`

    expect(hasMeaningfulBlockers(commented)).toBe(false)
    expect(hasMeaningfulBlockers(incomplete)).toBe(true)
  })
})

describe('generateChangeContent', () => {
  it('includes change name in heading', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('# Change: my-change')
  })

  it('uses the provided summary as the observable outcome', () => {
    const content = generateChangeContent('my-change', 'A cool change')
    expect(content).toContain('- Outcome: A cool change')
  })

  it('contains required sections', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- Boundaries:')
    expect(content).toContain('- Coverage:')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
    expect(content).not.toContain('Durable updates:')
  })

  it('renders a shorter lite template with required sections', () => {
    const content = generateChangeContent('small-fix', 'Fix small issue', 'fix', { lite: true })
    expect(content).toContain('kind: "fix"')
    expect(content).toContain('- Outcome: Fix small issue')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- [ ] <…>')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
    expect(content).toContain('- Coverage:')
    expect(content).not.toContain('Durable updates:')
    expect(content).toContain('- [ ] <…> — proves: <…>')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('reminds the user to choose kind explicitly', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('kind: "<choose: feature | fix | refactor | docs | ops | research>"')
  })

  it('uses a neutral bootstrap scaffold for project-setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('# Change: project-setup')
    expect(content).toContain('.rsp/specs/design.md')
    expect(content).toContain('CONTEXT.md')
    expect(content).toContain('AGENTS.md')
    expect(content).toContain('rsp doctor — proves: <…>')
    expect(content).not.toContain('Capture the project model')
    expect(content).not.toContain('Stable navigation and context')
    expect(content).toContain('- Current facts:')
    expect(content).toContain('- Lasting rationale:')
  })

  it('preserves kind-specific delta markers without authored guidance prose', () => {
    const content = generateChangeContent('docs-update', 'Improve docs', 'docs')
    expect(content).toContain('### MODIFIED')
    expect(content).toContain('- Requirement: <…>')
    expect(content).not.toContain('documentation accuracy')
    expect(generateChangeContent('new-capability', '', 'feature')).toContain('### ADDED')
    expect(generateChangeContent('investigate', '', 'research')).toContain('### ADDED')
  })

  it('does not let the fix template invent an unexplained root cause', () => {
    const content = generateChangeContent('repair-cache', 'Repair cache behavior', 'fix')
    expect(content).toContain('- Approach:\n  - <…>')
    expect(content).not.toContain('confirmed cause')
    expect(content).not.toContain('<root cause analysis and fix strategy>')
    expect(content).not.toContain('regression test')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('uses neutral placeholders for affected areas and verification', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('- Affected areas:\n  - <…>\n  - <…>')
    expect(content).toContain('- [ ] <…> — proves: <…>')
    expect(content).toContain('- Constraints:\n  - <…>')
  })

  it('does not make a new test the default automated evidence for any change kind', () => {
    for (const kind of ['feature', 'fix', 'refactor', 'docs', 'research', 'ops'] as const) {
      const content = generateChangeContent(`${kind}-change`, `${kind} outcome`, kind)
      expect(content).toContain('- [ ] <…> — proves: <…>')
      expect(content).not.toContain('regression test')
    }
  })

  it('keeps durable review separate from implementation verification', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('- Coverage:\n  - <…>')
    expect(content).not.toContain('Durable updates:')
    expect(content).not.toContain('before archive')
  })

  it('uses consistent verification and durable-outcome ownership in project setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('- Manual or environment:\n  - [ ] <…>')
    expect(content).toContain('- Coverage:\n  - <…>')
    expect(content).toContain('- Durable outcome targets:')
    expect(content).not.toContain('## Durable Outcomes')
  })
})

describe('generateSpecContent', () => {
  it('uses a durable-truth oriented structure', () => {
    const content = generateSpecContent('status')
    expect(content).toContain('# Status')
    expect(content).toContain('## Purpose')
    expect(content).toContain('## Stable Facts')
    expect(content).toContain('## Boundaries')
    expect(content).toContain('## Constraints')
    expect(content).not.toContain('## Details')
    expect(content).toContain('- <…>')
    expect(content).not.toContain('why this project-level spec exists')
  })

  it('keeps project design structure without authored guidance prose', () => {
    const content = generateDesignContent('示例项目')
    expect(content).toContain('# Project Design: 示例项目')
    expect(content).toContain('## Stable Facts')
    expect(content).toContain('- <…>')
    expect(content).not.toContain('future agents or developers')
  })
})

describe('documentation command examples', () => {
  it('keeps the published RSP skill conformant and independently versioned', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatter).not.toBeNull()

    const metadata = parseYaml(frontmatter![1]!) as Record<string, unknown>
    expect(Object.keys(metadata).sort()).toEqual([
      'description',
      'license',
      'metadata',
      'name',
    ])
    expect(metadata.name).toBe('rsp')
    expect(typeof metadata.description).toBe('string')
    expect((metadata.description as string).length).toBeLessThanOrEqual(1024)
    expect(metadata.license).toBe('MIT')

    const custom = metadata.metadata as Record<string, unknown>
    expect(custom.author).toBe('oevery')
    expect(custom.version).toBe('2026.07.29.2')
    expect(Object.values(custom).every(value => typeof value === 'string')).toBe(true)
    expect(custom.version).toMatch(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/)
  })

  it('keeps environment-specific RTK guidance out of distributed protocol surfaces', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')
    expect(skill).not.toContain('rtk')
    expect(rules).not.toContain('RTK')
  })

  it('explains npx usage in the getting-started guides', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { version: string }
    const guide = readFileSync(join(root, 'docs', 'en', 'getting-started.md'), 'utf-8')
    const chineseGuide = readFileSync(join(root, 'docs', 'zh-CN', 'getting-started.md'), 'utf-8')
    expect(guide).toContain('For opt-in beta evaluation, pin the exact prerelease identity')
    expect(guide).toContain(`npx -y @oevery/rsp@${packageJson.version} init`)
    expect(guide).toContain('skills install --dry-run')
    expect(guide).toContain(`npx -y @oevery/rsp@${packageJson.version} skills install`)
    expect(guide).toContain('suggest `npx -y @oevery/rsp create <name>` for tracked work')
    expect(chineseGuide).toContain('进行 opt-in beta 评估时，应固定精确 prerelease 身份')
    expect(chineseGuide).toContain(`npx -y @oevery/rsp@${packageJson.version} init`)
    expect(chineseGuide).toContain('suggest `npx -y @oevery/rsp create <name>` for tracked work')
  })

  it('marks the canonical-only protocol release as a breaking version', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { version: string }
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf-8')

    expect(packageJson.version).toBe('3.1.0-beta.5')
    expect(changelog).toContain('Reposition the product as Reliable Software Practice')
    expect(changelog).toContain('Separate deterministic readiness from semantic durable review and archive guidance')
    expect(changelog).toContain('## 3.0.0 (2026-07-23)')
  })

  it('keeps high-value guardrails in rules and skill', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')
    const coreReferences = [
      'conflict-handling.md',
      'durable-review.md',
      'groups-dependencies.md',
      'managed-routing.md',
      'release-operations.md',
      'reopen-recovery.md',
      'setup-repair.md',
    ].map(name => readFileSync(join(root, 'skills', 'rsp', 'references', name), 'utf-8')).join('\n')
    const contract = `${skill}\n${coreReferences}`

    expect(rules).toContain('This file is the minimal fallback protocol for agents that cannot load the `rsp` skill.')
    expect(rules).toContain('Read nearest `AGENTS.md`')
    expect(rules).toContain('Treat `focus.d/` as the only current-focus source.')
    expect(rules).toContain('Do not create archive entries directly; use `npx -y @oevery/rsp archive <name>`.')
    expect(rules).toContain('does not grant commit, push, publication, deletion, or external approval authority')
    expect(skill).toContain('Only `focus.d/` markers select current work')
    expect(skill).toMatch(/Do not use it for unrelated coding or create a Change for a simple session task/)
    expect(skill).toContain('metadata:')
    expect(skill).toContain('author: oevery')
    expect(skill).toContain('version: "2026.07.29.2"')
    expect(contract).toContain('Executable WorkRefs are `<change>` or one direct `<group>/<change>` child.')
    expect(contract).toContain('`<group>/brief`, stored as `<group>/00-brief.md`, is not executable or focusable.')
    expect(contract).toContain('`plan.nodes`, `ready`, `edges`, `blocked`, and `waves`')
    expect(contract).toContain('Choose current facts and rationale independently.')
    expect(contract).toContain('Spec delta markers are planning aids and are never promoted automatically.')
    expect(contract).toContain('Do not directly create command-owned files')
    expect(contract).toMatch(/does not execute archive or grant staging, commit, push, publication/)
    expect(skill).not.toContain('Minimal example:')
  })

  it('documents the localized durable decision contract and consolidated Skill guidance', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const setup = readFileSync(join(root, 'skills', 'rsp', 'references', 'setup-repair.md'), 'utf-8')
    const readme = readFileSync(join(root, 'README.md'), 'utf-8')
    const skillsGuide = readFileSync(join(root, 'docs', 'en', 'guides', 'skills.md'), 'utf-8')
    const zhSkillsGuide = readFileSync(join(root, 'docs', 'zh-CN', 'guides', 'skills.md'), 'utf-8')
    const gettingStarted = readFileSync(join(root, 'docs', 'en', 'getting-started.md'), 'utf-8')
    const zhGettingStarted = readFileSync(join(root, 'docs', 'zh-CN', 'getting-started.md'), 'utf-8')
    const cliReference = readFileSync(join(root, 'docs', 'en', 'reference', 'cli.md'), 'utf-8')
    const zhCliReference = readFileSync(join(root, 'docs', 'zh-CN', 'reference', 'cli.md'), 'utf-8')
    const projectDesign = readFileSync(join(root, '.rsp', 'specs', 'design.md'), 'utf-8')
    const projectSpecs = [
      'cli-contracts.md',
      'core-model.md',
      'distribution.md',
      'skill-system.md',
      'tui.md',
    ].map(name => readFileSync(join(root, '.rsp', 'specs', name), 'utf-8')).join('\n')

    expect(skill).toContain('localized continuation with these semantic fields in order')
    expect(skill).toContain('Localize headings and labels')
    expect(skill).toContain('- <localized Current-fact target label>: <exact file path or N/A>')
    expect(skill).not.toContain('Short example:')
    expect(setup).toContain('`fixed` entries are real filesystem mutations')
    expect(setup).toContain('an empty list means nothing changed')
    expect(readme).not.toContain('Surface matrix:')
    expect(skillsGuide).toContain('Compose the suite from evidence')
    expect(skillsGuide).toContain('No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority')
    expect(cliReference).toContain('a healthy project returns `fixed: []`')
    expect(gettingStarted).toContain('Simple current-session tasks should not create RSP changes unless tracking is intentionally needed')
    expect(zhCliReference).toContain('健康项目会返回 `fixed: []`')
    expect(zhSkillsGuide).toContain('按证据组合套件')
    expect(zhSkillsGuide).toContain('任何 Skill 都不推断 commit、push、publication、deployment、approval 或 human-acceptance 权限')
    expect(zhGettingStarted).toContain('简单的当前会话任务默认不应创建 RSP change')
    expect(projectDesign).toContain('[CLI Contracts](./cli-contracts.md)')
    expect(projectDesign).toContain('[Skill System](./skill-system.md)')
    expect(projectSpecs).toContain('`rsp add spec` rewrites only changed indexes in the affected directory chain')
    expect(projectSpecs).toContain('`rsp doctor --fix` reports only real filesystem mutations')
    expect(projectSpecs).toContain('`rsp create --lite` is for intentionally tracked small Changes')
    expect(projectSpecs).toContain('`.rsp/rsp-rules.md` is the minimal fallback')
    expect(projectSpecs).toContain('Keep safety, authority, readiness, verification, and completion criteria checkable')
    expect(readme).toContain('use `.rsp/rsp-rules.md` only when the Skill is unavailable')
    expect(readme).not.toContain('## JSON output')
    expect(readme).not.toContain('## Single-file change template')
  })

  it('builds durable review candidate targets consistently', () => {
    expect(getDurableReviewCandidateTargets()).toEqual([
      '.rsp/specs/design.md',
    ])
  })

  it('documents external workflow tradeoffs in the design philosophy', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const design = readFileSync(join(root, 'docs', 'design-philosophy.md'), 'utf-8')

    expect(design).toContain('## 外部工作流取舍')
    expect(design).toContain('### 与 spec-kit 的边界')
    expect(design).toContain('### 与 OpenSpec 的边界')
    expect(design).toContain('不自动把 change `Spec` delta 合并进 durable specs')
    expect(design).toContain('不把简单当前会话任务自动提升为 RSP change')
    expect(design).toContain('`.rsp/rsp-rules.md` 不是完整规范副本，而是 skill 不可用时仍能安全运行的最小协议')
    expect(design).toContain('`skills/` 是按需加载的 agent 操作手册')
    expect(design).toContain('fallback protocol 保持为最小兼容层，`skills/` 保持为详细操作层')
    expect(design).toContain('体积预算不能优先于准确性')
    expect(design).toContain('具体性只服务于减少操作误判')
    expect(design).toContain('RSP skill 要求 agent 将 `## Tasks`、实现和 `## Verify` 回写保持同步')
  })

  it('keeps AGENTS read order aligned with the recommended workflow', () => {
    const block = renderRspAgentsBlock()
    expect(block).toContain('RSP tracks current work, stable specs, and archives under `.rsp/`.')
    expect(block).toContain('1. Nearest `AGENTS.md` for project or module instructions.')
    expect(block).toContain('2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.')
    expect(block).toContain('3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.')
    expect(block).toContain('4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.')
    expect(block).toContain('5. Only the relevant Specs and Decision Records under the configured authoritative path.')
    expect(block).toContain('If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.')
    expect(block).toContain('Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.')
  })

  it('keeps AGENTS read order aligned with rules read order semantics', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')
    const block = renderRspAgentsBlock()

    expect(rules).toContain('Read nearest `AGENTS.md` and relevant `CONTEXT.md` before RSP work.')
    expect(rules).toContain('If the `rsp` skill is unavailable, read this file before operating `.rsp/`.')
    expect(rules).toContain('If `focus.d/` is empty and the user has not provided a concrete task')
    expect(rules).toContain('Treat `focus.d/` as the only current-focus source.')
    expect(rules).toContain('For grouped work, read the sibling Group Brief before the focused child Change.')
    expect(block).toContain('3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.')
    expect(block).toContain('4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.')
  })
})

describe('normalizeLogicalPath', () => {
  it('normalizes backslashes to forward slashes', () => {
    expect(normalizeLogicalPath('auth\\login')).toBe('auth/login')
  })
})

describe('collectArchiveChecklist', () => {
  it('reports incomplete tasks and verify items', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [ ] unimplemented task

## Verify
- Automated:
  - [ ] not run
- Manual:
  - [ ] not checked
`
    const warnings = collectArchiveChecklist(content)
    expect(warnings.some(w => w.includes('task item(s) still incomplete'))).toBe(true)
    expect(warnings.some(w => w.includes('Verify checklist item(s) are still incomplete'))).toBe(true)
  })

  it('reports active blockers', () => {
    const content = `## Blockers
- waiting on api migration`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toContain('active blockers are present in the change file')
  })

  it('reports missing scenarios', () => {
    const content = `## Spec
### ADDED
- Requirement: test`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toContain('no Scenario blocks found (some changes do not need them)')
  })

  it('returns empty when all checks pass', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [x] done

## Verify
- Automated:
  - [x] done
- Manual:
  - [x] done

## Spec
### ADDED
- Requirement: test

### Acceptance
#### Scenario: test works
- GIVEN x
- WHEN y
- THEN z

## Blockers
- none
`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toEqual([])
  })
})

describe('collectArchiveReadiness', () => {
  it('returns exact incomplete task and verify counts', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [ ] task one
- [ ] task two
- [x] task three

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] smoke test
- Durable updates:
  - [ ] decide writeback

## Spec
### ADDED
- Requirement: test

### Acceptance
#### Scenario: test works
- GIVEN x
- WHEN y
- THEN z

## Blockers
- none
`
    const readiness = collectArchiveReadiness(content)
    expect(readiness.taskTodos).toHaveLength(2)
    expect(readiness.verifyTodos).toHaveLength(3)
    expect(readiness.activeBlockers).toBe(false)
    expect(readiness.missingScenarios).toBe(false)
    expect(readiness.scenarioCount).toBe(1)
  })
})

describe('behavior-first spec templates', () => {
  it('omits scaffold comments for every change kind', () => {
    for (const kind of [undefined, 'feature', 'fix', 'refactor', 'docs', 'research', 'ops'] as const) {
      const content = generateChangeContent('test', 'summary', kind)
      expect(content).not.toContain('<!--')
    }
  })
})
