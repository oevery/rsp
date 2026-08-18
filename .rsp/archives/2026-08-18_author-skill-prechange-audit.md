---
kind: "refactor"
---

# Change: author-skill-prechange-audit

## Proposal
- Outcome: Allow report-only Skill audits and classify non-context Markdown
- Why:
  - The `audit` mode currently requires a selected Change and artifact mutation authority even when the audit exists to decide whether a Change is justified.
  - The context scanner treats every Markdown file as runtime context, so package-root legal files such as `NOTICE.md` become false unreachable-context findings.
- Scope:
  - Split report-only audit authority from candidate mutation authority in the maintainer `author-rsp-skills` contract.
  - Classify package-root legal Markdown as distribution material while retaining it in package inventory and diagnostics.
  - Add deterministic contract and scanner coverage for both boundaries.
- Non-goals:
  - Change published RSP Skill behavior, Core/Manage routing, release materials, or publication authority.
  - Introduce configurable file-role rules, a general document taxonomy, or a new evaluation receipt.

## Spec
### MODIFIED
- Requirement: `author-rsp-skills` supports a report-only Pre-Change Audit without inventing a WorkRef.
  - It requires an explicit target corpus and read-only authority, returns findings only, and grants no candidate mutation or acceptance authority.
  - Any create, revise, concise, adapt, evaluate, or audit-repair mutation still requires a selected Change and explicit artifact mutation authority.
- Requirement: skill context diagnostics distinguish runtime context from package-root legal distribution Markdown.
  - Legal Markdown remains visible in `markdown_files` and package diagnostics.
  - It is excluded from reachability and repeated-prose findings and reported separately as `distribution_markdown`.
  - Ordinary unlinked contextual Markdown remains an `unreachable_markdown` finding.

### Acceptance
#### Scenario: report-only audit before a Change exists
- GIVEN an explicit authored corpus and read-only authority with no selected Change
- WHEN `author-rsp-skills` is used in `audit` mode
- THEN it may inspect and return findings with `WorkRef: N/A`, but it must stop before mutation or candidate acceptance

#### Scenario: candidate mutation remains tracked
- GIVEN an audit finding but no selected Change or mutation authority
- WHEN a repair or behavioral revision is proposed
- THEN the Skill stops and requires the owning RSP Change and mutation authority before editing

#### Scenario: legal distribution Markdown is not runtime context
- GIVEN a Skill package containing linked context, an unlinked contextual reference, and package-root `NOTICE.md`
- WHEN the context scanner runs
- THEN the notice remains in package inventory, appears under `distribution_markdown`, does not appear as unreachable context, and does not contribute repeated prose

## Design
- Approach:
  - Express the authority split directly in the entrypoint trigger, selection, work, stop, and return contracts.
  - Classify only well-known package-root legal Markdown names; avoid heuristics based on document content.
  - Preserve scanner schema version 1 by adding one backward-compatible package field and retaining existing fields.
- Boundaries:
  - `audit` remains read-only unless an independently authorized repair is routed back through a selected Change.
  - Distribution classification affects diagnostics only; it does not remove files from packaging or security checks.
- Affected areas:
  - `.agents/skills/author-rsp-skills/SKILL.md`
  - `.agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` and its declaration
  - `test/author-rsp-skills.test.ts`
- Constraints:
  - Keep one-level progressive resources, existing evaluation ownership, and all review/Git/archive/release stops unchanged.
  - Do not classify ordinary package documentation as distribution material.

## Tasks
- [x] Revise the maintainer contract to support bounded report-only Pre-Change Audit.
- [x] Add distribution Markdown classification and deterministic tests without weakening unreachable-context detection.
- [x] Run focused tests, typecheck, lint, scanner diagnostics, security/package checks, RSP checks, and diff hygiene.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/author-rsp-skills.test.ts` — 1 file and 5 tests passed; proves authority and scanner behavior remain deterministic.
  - [x] `mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — passed; proves declarations and repository static contracts remain valid.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --json` — live corpus reported `skills/rsp-implement/NOTICE.md` under `distribution_markdown`, retained it in `markdown_files`, and reported no unreachable contextual Markdown.
  - [x] `mise exec -- pnpm run skills:security-check && mise exec -- pnpm run release:check` — security preflight passed for 40 files with 0 findings; release metadata, docs, build, typecheck, lint, 74 files and 828 tests, and clean-install package inventory passed.
  - [x] `node dist/cli.mjs check author-skill-prechange-audit --json && git diff --check` — proves focused RSP validity and patch hygiene.
### Optional
- Manual or environment:
  - [x] Current-versus-candidate provider holdout — `combo/gpt-5.6-sol` at high reasoning ran two unseen cases in isolated disposable Git workspaces through `scripts/skill-candidate-evaluation.mjs`. Current identity `ef3636221ca4fd1cbec011f7bb24c82e3eb594c9d7986c51b0225667b335245a` passed Trigger and Boundary but failed Compliance and task result in both cases because it returned an empty WorkRef. Candidate identity `4038f3a8c02e0c3b821446fa1820fbbcc20a35d894ccb2533fd02e73ac796f5a` passed all four dimensions in both cases, returned `WorkRef: N/A`, preserved the findings under repair pressure, created no candidate, and left every observed workspace clean. The evaluator returned `candidate-eligible` with no regressions, candidate failures, or missing evidence.
- Coverage:
  - `pre-change-read-only-audit` proves the explicit report-only return contract; `audit-repair-without-authority` proves the same audit can return findings without expanding mutation authority. Both current and candidate refused mutation, while only the candidate satisfied the exact WorkRef and task-result contract. This is one provider/model path and does not establish universal provider generality or performance superiority.

## Blockers
- none

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.agents/skills/author-rsp-skills/SKILL.md`
- Facts to write: Report-only Pre-Change Audit requires an explicit corpus and read-only authority, returns `WorkRef: N/A`, and stops before mutation; tracked candidate or repair work still requires a selected Change and mutation authority. Context diagnostics classify package-root legal Markdown separately without removing it from package inventory.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none
- Archive ready: yes
