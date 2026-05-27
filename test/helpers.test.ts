import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { changeNameFromPath, collectArchiveChecklist, collectArchiveReadiness, countCheckboxes, detectDeltaSections, extractSection, generateChangeContent, generateProjectRulesContent, generateRulesContent, generateSpecContent, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter, parseScenarios, parseYamlLines, renderRspAgentsBlock } from '../src/core/helpers.js'

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
})

describe('generateChangeContent', () => {
  it('includes change name in heading', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('# Change: my-change')
  })

  it('includes summary when provided', () => {
    const content = generateChangeContent('my-change', 'A cool change')
    expect(content).toContain('- Summary: A cool change')
  })

  it('contains required sections', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- [ ] Finalize the proposal, spec, and design details for this change')
    expect(content).toContain('- [ ] Verify the result and update any required durable docs or rules')
  })

  it('renders a shorter lite template with required sections', () => {
    const content = generateChangeContent('small-fix', 'Fix small issue', 'fix', { lite: true })
    expect(content).toContain('kind: "fix"')
    expect(content).toContain('- Summary: Fix small issue')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- [ ] Implement the small change')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
  })

  it('reminds the user to choose kind explicitly', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('kind: "<choose: feature | fix | refactor | docs | ops | research>"')
  })

  it('uses a bootstrap-oriented template for project-setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('# Change: project-setup')
    expect(content).toContain('.rsp/specs/design.md')
    expect(content).toContain('.rsp/rules/project-rules.md')
    expect(content).toContain('Review AGENTS.md and confirm the RSP entry points to the right project files')
    expect(content).toContain('Run rsp doctor')
    expect(content).toContain('do not promote task history, debugging notes, or one-off implementation context')
  })

  it('uses a docs-oriented template when kind is docs', () => {
    const content = generateChangeContent('docs-update', 'Improve docs', 'docs')
    expect(content).toContain('Requirement: documentation accuracy')
    expect(content).toContain('reader follows the updated guidance')
    expect(content).toContain('<concrete doc path, directory, module doc, or documentation surface 1>')
    expect(content).toContain('<exact markdown, docs, link, lint, build, or check command if applicable>')
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

  it('uses more concrete affected area and verification placeholders', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('<concrete file path, directory, module, or subsystem 1>')
    expect(content).toContain('<concrete file path, directory, module, or subsystem 2 if needed>')
    expect(content).toContain('<exact test, lint, build, or check command>')
    expect(content).toContain('<exact end-to-end scenario to validate>')
    expect(content).toContain('<behavior, compatibility, performance, safety, or scope constraint that must hold>')
  })

  it('tightens durable update guidance in verify', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('write only stable facts to the smallest correct target file before archive')
    expect(content).toContain('do not promote task history, debugging notes, or one-off implementation context')
    expect(content).toContain('- Durable updates:\n  - [ ] Decide whether this change produced durable knowledge')
  })

  it('uses consistent verify indentation in project setup template', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('- Manual:\n  - [ ] Review .rsp/specs/design.md and confirm it matches the repository\n- Durable updates:')
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

describe('rules templates', () => {
  it('keeps project rules focused on durable constraints', () => {
    const content = generateProjectRulesContent('demo-project')
    expect(content).toContain('Do not put temporary debugging steps here.')
  })

  it('uses durable wording for generic rules templates', () => {
    const content = generateRulesContent('security-rules')
    expect(content).toContain('description: Durable rules for Security Rules')
  })
})

describe('documentation command examples', () => {
  it('keeps RTK guidance only in rules, not in the skill', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')
    expect(skill).not.toContain('rtk')
    expect(rules).toContain('If RTK is available')
  })

  it('explains npx usage in the README', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const readme = readFileSync(join(root, 'README.md'), 'utf-8')
    expect(readme).toContain('Otherwise use `npx -y @oevery/rsp <command>`')
  })

  it('keeps high-value guardrails in rules and skill', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')

    expect(rules).toContain('This file is the canonical RSP rules source.')
    expect(rules).toContain('These rules are tool-agnostic and apply even when the agent does not support skills.')
    expect(rules).toContain('If the agent supports Agent Skills, load the `rsp` skill for initialization, audit or repair, and durable-decision tasks.')
    expect(rules).toContain('Do not create archive entries directly under `.rsp/archives/`; use `npx -y @oevery/rsp archive <name>`.')
    expect(rules).toContain('Create or update `specs/` only for durable project-level facts that are stable, reusable, and worth rereading in later sessions.')
    expect(rules).toContain('Prefer updating `specs/design.md` or an existing durable file before creating a new spec file.')
    expect(skill).toContain('Do not treat unfocused files in `changes/` as current work')
    expect(skill).toContain('metadata:')
    expect(skill).toContain('author: oevery')
    expect(skill).toContain('version: 2.0.3')
    expect(skill).toContain('## When not to use')
    expect(skill).toContain('## Expected outputs')
    expect(skill).toContain('When unsure whether a fact is truly durable, prefer `No durable update needed` over speculative promotion.')
    expect(skill).toContain('Default to no spec writeback unless the change produced project-level durable knowledge that future work must reread.')
    expect(skill).toContain('When `rsp ready --json` or `rsp show --json` includes `durableReview`')
    expect(skill).toContain('Convert each actionable `## Tasks` checkbox into your agent-local task tracker')
    expect(skill).toContain('update the corresponding checkbox in the change file in the same working session')
    expect(skill).toContain('Prefer `specs/design.md` or an existing durable file before creating a new spec file.')
    expect(skill).toContain('if you cannot identify a concrete durable target or concrete durable facts, do not invent them')
    expect(skill).toContain('After rule or skill changes, prefer a fresh session and reread `AGENTS.md` plus `.rsp/rules/*.md`.')
  })

  it('documents the minimal durable decision example and surface matrix', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const skill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf-8')
    const readme = readFileSync(join(root, 'README.md'), 'utf-8')

    expect(skill).toContain('Minimal example:')
    expect(skill).toContain('- Target: .rsp/specs/design.md')
    expect(readme).toContain('Surface matrix:')
    expect(readme).toContain('| `.rsp/rules/rsp-rules.md` | Agents | Canonical normative rules source |')
    expect(readme).not.toContain('## JSON output')
    expect(readme).not.toContain('## Single-file change template')
  })

  it('documents external workflow tradeoffs in the design philosophy', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const design = readFileSync(join(root, 'docs', 'design-philosophy.md'), 'utf-8')

    expect(design).toContain('## 外部工作流取舍')
    expect(design).toContain('### 与 spec-kit 的边界')
    expect(design).toContain('### 与 OpenSpec 的边界')
    expect(design).toContain('不自动把 change `Spec` delta 合并进 durable specs')
    expect(design).toContain('RSP skill 要求 agent 将 `## Tasks`、实现和 `## Verify` 回写保持同步')
  })

  it('keeps AGENTS read order aligned with the recommended workflow', () => {
    const block = renderRspAgentsBlock()
    expect(block).toContain('RSP keeps durable rules, specs, and current work under `.rsp/`.')
    expect(block).toContain('Treat AGENTS.md as navigation only; keep durable rules and design in `.rsp/`.')
    expect(block).toContain('1. .rsp/rules/rsp-rules.md')
    expect(block).toContain('2. .rsp/focus.d/')
    expect(block).toContain('3. matching .rsp/changes/*.md for the focused entries')
    expect(block).toContain('4. .rsp/specs/design.md')
    expect(block).toContain('5. .rsp/specs/INDEX.md')
    expect(block).toContain('6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files')
    expect(block).toContain('If `.rsp/focus.d/` is empty, ask what to work on or suggest `npx -y @oevery/rsp create <name>`.')
    expect(block).toContain('If your agent supports Agent Skills, load `rsp` for setup, repair, and durable-decision tasks.')
  })

  it('keeps AGENTS read order aligned with rules read order semantics', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const rules = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf-8')
    const block = renderRspAgentsBlock()

    expect(rules).toContain('2. Read `.rsp/rules/rsp-rules.md` in full.')
    expect(rules).toContain('3. Read `focus.d/`.')
    expect(rules).toContain('5. Read each `changes/<name>.md` file marked in `focus.d/`.')
    expect(rules).toContain('6. Read `specs/design.md` and `specs/INDEX.md`.')
    expect(rules).toContain('`specs/INDEX.md` lists only additional spec files beyond `specs/design.md`.')
    expect(rules).toContain('7. Read only the relevant additional `rules/` and `specs/` files.')
    expect(block).toContain('1. .rsp/rules/rsp-rules.md')
    expect(block).toContain('2. .rsp/focus.d/')
    expect(block).toContain('3. matching .rsp/changes/*.md for the focused entries')
    expect(block).toContain('4. .rsp/specs/design.md')
    expect(block).toContain('5. .rsp/specs/INDEX.md')
    expect(block).toContain('6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files')
  })
})

describe('changeNameFromPath', () => {
  it('strips .md extension', () => {
    expect(changeNameFromPath('/changes', '/changes/login.md')).toBe('login')
  })

  it('preserves subdirectory structure', () => {
    expect(changeNameFromPath('/changes', '/changes/auth/login.md')).toBe('auth/login')
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
