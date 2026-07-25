import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { collectArchiveChecklist, collectArchiveReadiness, countCheckboxes, detectDeltaSections, extractSection, generateChangeContent, generateSpecContent, getDurableReviewCandidateTargets, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter, parseScenarios, parseYamlLines, renderRspAgentsBlock } from '../src/core/helpers.js'

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

describe('extractSection', () => {
  it('extracts a named section body', () => {
    const content = `## Proposal
- Summary: hello

## Spec
### ADDED`
    expect(extractSection(content, 'Proposal')).toContain('Summary: hello')
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
    expect(content).toContain('- [ ] Implement the small change')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
    expect(content).toContain('- Coverage:')
    expect(content).not.toContain('Durable updates:')
    expect(content).toContain('<cheapest decisive check; retain a new test only when justified, or not applicable: reason>')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('reminds the user to choose kind explicitly', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('kind: "<choose: feature | fix | refactor | docs | ops | research>"')
  })

  it('uses a bootstrap-oriented template for project-setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('# Change: project-setup')
    expect(content).toContain('.rsp/specs/design.md')
    expect(content).toContain('Stable navigation and context are reflected in project-owned CONTEXT.md when that convention exists')
    expect(content).toContain('Stable agent instructions are reflected in the nearest project-owned AGENTS.md when needed')
    expect(content).toContain('Review project-owned CONTEXT.md and AGENTS.md and confirm the RSP entry points to the right project files')
    expect(content).toContain('project-owned CONTEXT.md and the nearest AGENTS.md contain only the stable context and instructions assigned to them by Host Project conventions')
    expect(content).not.toContain('Stable validation or workflow constraints are reflected in the nearest project-owned AGENTS.md when needed')
    expect(content).toContain('Run rsp doctor')
    expect(content).toContain('- Current facts:')
    expect(content).toContain('- Lasting rationale:')
    expect(content).toContain('CONTEXT.md')
  })

  it('uses a docs-oriented template when kind is docs', () => {
    const content = generateChangeContent('docs-update', 'Improve docs', 'docs')
    expect(content).toContain('Requirement: documentation accuracy')
    expect(content).toContain('reader follows the updated guidance')
    expect(content).toContain('<concrete doc path, directory, module doc, or documentation surface 1>')
    expect(content).toContain('<cheapest decisive check; retain a new test only when justified, or not applicable: reason>')
  })

  it('uses a research-oriented template when kind is research', () => {
    const content = generateChangeContent('investigate-cache', 'Investigate cache behavior', 'research')
    expect(content).toContain('Requirement: research outcome recording')
    expect(content).toContain('research question is resolved')
    expect(content).toContain('gather evidence')
    expect(content).toContain('note any follow-up implementation work if needed')
  })

  it('uses an ops-oriented template when kind is ops', () => {
    const content = generateChangeContent('deploy-pipeline', 'Harden deploy pipeline', 'ops')
    expect(content).toContain('Requirement: operational behavior')
    expect(content).toContain('operational path succeeds')
    expect(content).toContain('<rollback, safety, reliability, environment, or scope constraint that must hold>')
  })

  it('does not let the fix template invent an unexplained root cause', () => {
    const content = generateChangeContent('repair-cache', 'Repair cache behavior', 'fix')
    expect(content).toContain('<confirmed cause and correction strategy, or exact evidence needed to establish the cause>')
    expect(content).not.toContain('<root cause analysis and fix strategy>')
    expect(content).not.toContain('regression test')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('uses concrete affected areas and value-sensitive verification placeholders', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('<concrete file path, directory, module, or subsystem 1>')
    expect(content).toContain('<concrete file path, directory, module, or subsystem 2 if needed>')
    expect(content).toContain('<cheapest decisive check; retain a new test only when justified, or not applicable: reason> — proves: <behavior or scope covered>')
    expect(content).toContain('<exact acceptance scenario, or unavailable/not applicable: owner and reason>')
    expect(content).toContain('<behavior, compatibility, performance, safety, or scope constraint that must hold>')
  })

  it('does not make a new test the default automated evidence for any change kind', () => {
    for (const kind of ['feature', 'fix', 'refactor', 'docs', 'research', 'ops'] as const) {
      const content = generateChangeContent(`${kind}-change`, `${kind} outcome`, kind)
      expect(content).toContain('<cheapest decisive check; retain a new test only when justified, or not applicable: reason>')
    }
  })

  it('keeps durable review separate from implementation verification', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('- Coverage:\n  - <omitted or unavailable relevant coverage and reason, or none>')
    expect(content).not.toContain('Durable updates:')
    expect(content).not.toContain('before archive')
  })

  it('uses consistent verification and durable-outcome ownership in project setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('- Manual or environment:\n  - [ ] Review .rsp/specs/design.md and project-owned context or instructions and confirm they match the repository')
    expect(content).toContain('- Coverage:\n  - none')
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
    expect(custom.version).toBe('2026.07.25.1')
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

  it('explains npx usage in the README', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { version: string }
    const readme = readFileSync(join(root, 'README.md'), 'utf-8')
    const chineseReadme = readFileSync(join(root, 'README.zh-CN.md'), 'utf-8')
    expect(readme).toContain('For opt-in beta evaluation, pin the exact prerelease identity')
    expect(readme).toContain(`npx -y @oevery/rsp@${packageJson.version} init`)
    expect(readme).toContain('rsp skills install --dry-run')
    expect(readme).toContain(`npx -y @oevery/rsp@${packageJson.version} skills install`)
    expect(readme).toContain('suggest `npx -y @oevery/rsp create <name>` for tracked work')
    expect(chineseReadme).toContain('进行 opt-in beta 评估时，应固定精确 prerelease 身份')
    expect(chineseReadme).toContain(`npx -y @oevery/rsp@${packageJson.version} <command>`)
    expect(chineseReadme).toContain(`npx -y @oevery/rsp@${packageJson.version} init`)
    expect(chineseReadme).toContain('suggest `npx -y @oevery/rsp create <name>` for tracked work')
  })

  it('marks the canonical-only protocol release as a breaking version', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { version: string }
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf-8')

    expect(packageJson.version).toBe('3.1.0-beta.0')
    expect(changelog).toContain('Reposition the product as Reliable Software Practice')
    expect(changelog).toContain('Separate deterministic readiness from semantic durable review and archive guidance')
    expect(changelog).toContain('## 3.0.0 (2026-07-23)')
  })

  it('keeps high-value guardrails in rules and skill', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')

    expect(rules).toContain('This file is the minimal fallback protocol for agents that cannot load the `rsp` skill.')
    expect(rules).toContain('Read nearest `AGENTS.md`')
    expect(rules).toContain('If the `rsp` skill is unavailable')
    expect(rules).toContain('Treat `focus.d/` as the only current-focus source.')
    expect(rules).toContain('Every Change is one Markdown file')
    expect(rules).toContain('Before archive, decide independently whether current facts need a Spec or scoped-instruction update and whether lasting rationale needs a Decision Record.')
    expect(rules).toContain('Do not create archive entries directly; use `npx -y @oevery/rsp archive <name>`.')
    expect(rules).toContain('does not grant commit, push, publication, deletion, or external approval authority')
    expect(skill).toContain('do not treat unfocused files in `changes/` as current work')
    expect(skill).toContain('Do not create an RSP change for a simple current-session task')
    expect(skill).toContain('only when the user explicitly wants RSP tracking for a small, straightforward change')
    expect(skill).toContain('metadata:')
    expect(skill).toContain('author: oevery')
    expect(skill).toContain('version: "2026.07.25.1"')
    expect(skill).toContain('Resolve executable Change names as either `<change>` or one direct `<group>/<change>` child.')
    expect(skill).toContain('Treat logical `<group>/brief`, physically stored as `<group>/00-brief.md`, as non-executable and non-focusable.')
    expect(rules).toContain('With no focus, status uses Group Brief declaration order and derived blockers to recommend the first executable slice.')
    expect(rules).toContain('no graph file or delivery state is persisted')
    expect(skill).toContain('plan.nodes`, `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves')
    expect(skill).toContain('## When not to use')
    expect(skill).toContain('### Pre-archive durable decision')
    expect(skill).toContain('Prefer no update on either axis when there is no concrete stable fact or lasting rationale worth rereading.')
    expect(skill).toContain('Run `npx -y @oevery/rsp show --focused --json` or `npx -y @oevery/rsp ready <name> --json`')
    expect(skill).toContain('Treat `durableReview.factCandidateTargets` and `durableReview.decisionRecordsPath` as advisory routing context')
    expect(skill).toContain('selected Change, then relevant Specs and Decision Records')
    expect(skill).toContain('Read only the current Change, relevant Specs and Decision Records')
    expect(skill).toContain('Treat `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) as planning aids only')
    expect(skill).toContain('Treat `rsp check` warnings as deterministic hygiene signals, not as the durable-update decision.')
    expect(skill).toContain('Convert actionable `## Tasks` checkboxes into your agent-local task tracker')
    expect(skill).toContain('Keep implementation sequential by default')
    expect(skill).toContain('Update `## Tasks`, `## Verify`, and any invalidated `## Proposal`, `## Spec`, or `## Design`')
    expect(skill).toContain('the change changed a project boundary, default, or constraint')
    expect(skill).toContain('project-wide design, boundaries, defaults, and durable context -> `.rsp/specs/design.md`')
    expect(skill).toContain('Prefer `.rsp/specs/design.md` or an existing durable file before creating a new spec file.')
    expect(skill).toContain('Do not choose generated indexes, `.rsp/rsp-rules.md`, or the managed RSP block in `AGENTS.md` as ordinary durable writeback targets')
    expect(skill).toContain('If you cannot identify concrete durable content, do not invent it.')
    expect(skill).toContain('CLI `archiveReady: judgment` means the skill or a human must decide')
    expect(skill).toContain('Recommend explicit archive as the next action')
    expect(skill).toContain('does not execute archive or grant authority to stage, commit, push, or publish')
    expect(skill).not.toContain('Minimal example:')
  })

  it('documents the localized durable decision contract and surface matrix', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const readme = readFileSync(join(root, 'README.md'), 'utf-8')
    const zhReadme = readFileSync(join(root, 'README.zh-CN.md'), 'utf-8')
    const projectDesign = readFileSync(join(root, '.rsp', 'specs', 'design.md'), 'utf-8')

    expect(skill).toContain('Use these semantic fields in this exact order.')
    expect(skill).toContain('Localize the heading and human-facing labels to the response language')
    expect(skill).toContain('- <localized Current-fact target label>: <exact file path or N/A>')
    expect(skill).not.toContain('Short example:')
    expect(skill).toContain('Treat `doctor --fix` `fixed` entries as actual filesystem changes')
    expect(skill).toContain('An empty `fixed` array or `No safe fixes needed.` means the repair pass changed nothing.')
    expect(readme).toContain('Surface matrix:')
    expect(readme).toContain('compose the suite as evidence requires')
    expect(readme).toContain('no Skill infers Git continuation, commit, delivery, or an automatic retry loop')
    expect(readme).toContain('a healthy project returns `fixed: []`')
    expect(readme).toContain('simple current-session tasks should not create RSP changes unless tracking is intentionally needed')
    expect(zhReadme).toContain('健康项目会返回 `fixed: []`')
    expect(zhReadme).toContain('应按证据组合套件')
    expect(zhReadme).toContain('任何 Skill 都不会推断 Git continuation、commit、delivery 权限或自动重试')
    expect(zhReadme).toContain('简单的当前会话任务默认不应创建 RSP change')
    expect(projectDesign).toContain('Generated index builders avoid rewriting unchanged `INDEX.md` files.')
    expect(projectDesign).toContain('`rsp doctor --fix` reports only actual filesystem changes in its `fixed` output')
    expect(projectDesign).toContain('`rsp create --lite` is a short template for explicitly tracked small changes')
    expect(projectDesign).toContain('`.rsp/rsp-rules.md` is the minimal tool-agnostic fallback protocol')
    expect(projectDesign).toContain('The `rsp` skill is the preferred detailed operational guide')
    expect(projectDesign).toContain('Skill compactness must not remove guidance about change creation, durable writeback, archive readiness')
    expect(readme).toContain('| `.rsp/rsp-rules.md` | Agents without the skill | Minimal tool-agnostic fallback protocol |')
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
  it('includes guidance comment in default template Spec section', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in feature template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'feature')
    expect(content).toContain('<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in fix template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'fix')
    expect(content).toContain('<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in refactor template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'refactor')
    expect(content).toContain('<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in docs template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'docs')
    expect(content).toContain('<!-- Describe what the reader should see or experience. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in research template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'research')
    expect(content).toContain('<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->')
  })

  it('includes guidance comment in ops template Spec section', () => {
    const content = generateChangeContent('test', 'summary', 'ops')
    expect(content).toContain('<!-- Describe the reliable operational outcome. Implementation notes belong in ## Design. -->')
  })
})
