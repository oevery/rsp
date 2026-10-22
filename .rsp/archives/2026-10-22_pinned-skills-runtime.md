---
kind: "feature"
---

# Change: pinned-skills-runtime

## Proposal
<!-- State the intended outcome, why it matters, scope, and non-goals; do not narrate execution. -->
- Outcome: Pin project CLI execution and retire the Rules fallback.
- Why:
  - Routine work must not silently select a new CLI or another workflow protocol.
- Scope:
  - Setup, protected migration, agent guidance, diagnostics and current documentation.
- Non-goals:
  - No release, global configuration, remote delivery, paid models or consumer-project migration.

## Spec
<!-- Describe the contract delta and acceptance conditions, referencing affected existing Specs; do not copy the full baseline or implementation steps. -->
### ADDED
- Requirement: Record the exact CLI package version in `.rsp/version` during init.
  - Generate an exact invocation in AGENTS; reject ordinary CLI commands from a different version before effects. Diagnostics and help remain available.
- Requirement: Adopt another version only through `update --adopt-version`.
  - Neither init nor ordinary doctor repair silently repins. Legacy projects establish their initial pin through authorized update.
- Requirement: Skills are the only executable workflow.
  - Missing required Skills stop dependent agent work, not trigger fallback reading or implicit installation. Do not generate or ship Rules.
- Requirement: Retired fallback deletion requires explicit `update --remove-legacy-rules`.
  - Preflight regular files and retain rollback; preserve unrelated or customized content until deletion authority is given.
- Requirement: Doctor reports pin and Skill tree drift.
  - Only explicit `doctor --check-updates` reads stable registry metadata with bounded timeout. Failure is informational; no check upgrades anything.

### Acceptance
#### Scenario: Routine selection and explicit migration
- GIVEN an initialized pinned project
- WHEN a different CLI runs an ordinary command or init
- THEN reject before mutation and name the exact invocation and explicit migration route.

#### Scenario: Skills-only setup and legacy preservation
- GIVEN installed Skills and an optional retired fallback
- WHEN setup, update or diagnostics runs
- THEN use no fallback, generate no Rules, preserve old files without explicit removal, and report missing or divergent Skills.

## Design
<!-- Explain the approach, responsibility boundaries, and necessary tradeoffs; keep simple changes brief and avoid repeating requirements or tasks. -->
- Approach:
  - Use a declarative pin and generated exact command rather than adding a host-project package-manager dependency. Guard selection at the CLI boundary and recheck explicit adoption inside update's lock.
- Boundaries:
  - Update owns pin/entry changes and selected legacy-file removal under its rollback journal. Doctor reuses the existing package Skill inventory; ordinary CLI execution performs no registry lookup. An npx launcher can still fetch the selected package with separate authority. This cannot retrofit guards into older published CLIs or prove model compliance.
- Affected areas:
  - Runtime CLI/setup, package inventory, Skills, current docs and authoritative CLI/distribution/workflow contracts.
- Constraints:
  - Preserve historical release and evaluation evidence; source changes do not imply publication under the current manifest version.

## Tasks
<!-- List checkable work and mark completion only after outcomes exist; prescribe order only where correctness, safety, or migration requires it. -->
- [x] Init records `.rsp/version`; AGENTS gives the exact invocation; the CLI rejects mismatches and update requires explicit adoption. Doctor reports version/suite drift and provides an explicit bounded metadata check.
- [x] Removed authored and self-hosted Rules, their generation/runtime requirements and package/image inventory. Explicit legacy removal retains unrelated content and the update rollback boundary. Both removed tracked files remain recoverable through Git.
- [x] Reconciled CLI/distribution/workflow/architecture Specs, Core/setup guidance, bilingual current docs, migration guidance and maintainer source-candidate invocation. Historical releases and evaluation inputs remain unchanged.
- [x] Completed implementation, package, docs and offline Skill checks without paid models or external delivery.

## Verify
<!-- Connect acceptance to verification methods; after execution retain actual results, gaps, and limits, not command transcripts. -->
### Required
- Automated:
  - [x] `mise exec -- pnpm run test`: build and 18 test files / 95 tests passed before the final positional-argument rejection. Final affected reruns passed: 30 CLI/lifecycle/update-notice tests and 12 package/install tests, covering the final built candidate and exact tarball. Unaffected tooling evidence is reused.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint`: passed.
  - [x] `mise exec -- pnpm run docs:check` and `mise exec -- pnpm run docs:build`: passed; 8 bilingual page pairs and 32 checked Markdown files.
  - [x] Skill package validation: all 7 passed; Skill security preflight: 41 files, zero findings.
  - [x] Frozen uv environment checked; offline native validation: 47 Harbor tasks valid, no behavioral acceptance run.
  - [x] `mise exec -- node dist/cli.mjs check pinned-skills-runtime`: the selected Change is structurally valid.
### Optional
- Manual or environment:
  - Actual agent compliance and context-cost improvement need separately authorized native execution.
- Coverage:
  - No live models, global changes, publication, automatic upgrades or arbitrary downgrade compatibility claim.
  - Fixed-scope Code and Document review against `84197c60d16719643fa3a72c52309a16c11f9181` found and resolved five accepted issues: version-flag prefixes bypassed selection; delayed terminal confirmation could install after pin drift; incomplete legacy inspection could delete Rules and adopt a new pin despite failure; detached boolean operands could enable protected update flags; build metadata could produce a false upgrade notice. Final re-review found no remaining actionable issue in this boundary; it is not an independent-worker review.
  - Negative controls reproduced all five issues before their corrections. One update-notice fixture initially reused a consumed Response; fresh per-request responses established the actual semantic RED. The PTY check waits for raw mode as well as first paint before sending confirmation.
  - Earlier check failures were corrected: the update-notice unit test called the dist-only package-root reader, lint found import/property style issues, migration links resolved outside the site root, and the rollback test over-specified rejection wording. Final passing results supersede those failed checks; no original live evaluation evidence was reinterpreted.
  - Local `doctor --json` passed with no issues, a matching CLI pin and matching suite. No real registry availability, agent compliance, independent-worker review or cost improvement is established.

## Blockers
<!-- Name unresolved decisions or dependencies that prevent progress; use none when there are no blockers. -->
- none
