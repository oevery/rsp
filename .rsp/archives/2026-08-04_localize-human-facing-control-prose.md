---
kind: "refactor"
---

# Change: localize-human-facing-control-prose

## Proposal
- Outcome: Localize user-visible RSP control prose while preserving canonical technical values
- Why:
  - Response prose already follows the user's language, but long-running RSP updates can still use English control phrases such as gate names, retry labels, receipt results, or review states as the main human-facing narration.
  - Canonical values must remain exact for auditability, yet they do not need to replace a localized explanation in ordinary progress updates.
- Scope:
  - Define one response-language rule for user-visible progress updates, phase or stage descriptions, control results, worker receipts, stop reasons, and handoffs.
  - Require localized natural-language narration while retaining canonical technical values in parentheses or code formatting when their exact identity matters.
  - Project the shared rule into standalone RSP Skills that can produce user-visible execution output without loading Core prose directly.
  - Synchronize the authored fallback and add contract coverage for the response boundary.
- Non-goals:
  - Do not translate persisted canonical headings, paths, commands, identifiers, WorkRefs, enum values, result schemas, or existing artifacts.
  - Do not change workflow routing, authority, worker dispatch, acceptance, closeout, or Git behavior.
  - Do not attempt to localize hidden Codex host reasoning summaries or add a translation catalog.

## Spec
### MODIFIED
- Requirement: response language covers observable control narration
  - Every user-visible RSP progress update, phase or stage description, control result, worker receipt, stop reason, and handoff uses natural-language narration selected by the response-language precedence.
  - A canonical technical value remains unchanged when exact identity matters, but it does not stand alone as the human-facing label when the response language differs; the response provides a localized explanation and retains the exact value in parentheses or code formatting.
  - This response-only rule never changes persisted artifact language or host-owned hidden reasoning summaries.

### Acceptance
#### Scenario: Chinese managed progress preserves exact control values without English-led narration
- GIVEN a Chinese response context and a managed run that reports a gate, receipt result, retry, stop, or review state
- WHEN RSP emits a user-visible update or handoff
- THEN the natural-language narration is Chinese and any required canonical value is retained as a secondary exact token rather than the primary English label

#### Scenario: artifact and protocol values remain stable
- GIVEN a localized response references an existing Change, command, path, WorkRef, disposition, or result schema
- WHEN the response is rendered
- THEN those technical values remain unchanged and no persisted artifact is translated

## Design
- Approach:
  - Extend Core's existing response-versus-artifact boundary instead of introducing per-language terminology tables.
  - Keep one complete rule in Core and the authored fallback; standalone execution Skills carry only a concise pointer to that boundary unless they already define a stronger localized output contract.
  - Protect the behavior through semantic contract tests rather than fixed Chinese phrase templates.
- Boundaries:
  - Core owns response-language selection and the complete observable-control narration rule.
  - Discipline and Manage Skills own their result schemas but localize only the surrounding human-facing narration.
  - Codex host UI, hidden reasoning summaries, and machine-consumed values remain outside RSP ownership.
- Affected areas:
  - `.rsp/specs/skill-system.md`
  - `skills/rsp/SKILL.md`, standalone execution Skills, and `rules/rsp-rules.md`
  - generated `.rsp/rsp-rules.md` and focused language/runtime contract tests
- Constraints:
  - Avoid duplicating a glossary or translating canonical values.
  - Preserve progressive disclosure and existing Skill authority boundaries.

## Tasks
- [x] Add the observable control-narration boundary to the stable Skill System Spec, Core, and fallback rules.
- [x] Project the boundary into standalone execution Skills without duplicating its full definition.
- [x] Add focused contract coverage and synchronize the generated fallback.

## Verify
- Automated:
  - [x] Focused artifact-language, managed WorkerEnvelope/receipt, and beta composition contracts passed, including a Chinese behavior scorer that rejects an English-only primary result label while preserving the exact result token — proves: localized narration coverage, private Inspect/Verify propagation, and stable technical values.
  - [x] `mise exec -- pnpm run build`, authored/generated fallback byte comparison, `mise exec -- pnpm run lint`, full 55 files / 659 tests, and `git diff --check` passed — proves: package-wide compatibility.
- Manual or environment:
  - [x] Independent Verify inspected Core, Manage, Shape, implementation, review, commit, release, and audit output contracts; confirmed the complete rule has one owner, standalone Skills contain only concise projections, canonical values remain exact secondary tokens, and retained research evidence is unchanged. Final fixed-scope Code and Document re-review was `clean` after the private Inspect/Verify receipt-language finding was resolved.
- Coverage:
  - Does not validate or modify Codex host reasoning-summary rendering.

## Blockers
- none
