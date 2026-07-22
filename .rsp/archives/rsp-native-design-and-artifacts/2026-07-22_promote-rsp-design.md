---
kind: "feature"
---

# Change: rsp-native-design-and-artifacts/promote-rsp-design

## Proposal
- Summary: Promote a concise `rsp-design` discipline for resolving tracked domain, module, and evidence-seeking design questions.
- Why:
  - RSP currently delegates design questions to project-selected external Skills, so a clean package cannot complete a common Shape-to-Implement path without separately installed Matt capabilities.
- Scope:
  - Add one independently invocable `rsp-design` Skill with progressive references for domain modeling, module/seam design, and reversible exploration.
  - Return conclusions, alternatives, evidence, and remaining owner decisions to the same selected Change without implementing production behavior.
  - Add static and behavioral qualification plus package discovery for the new Skill.
- Non-goals:
  - Copying Matt's skill prose or packaging, creating a generic architecture-report generator, or owning project lifecycle state.
  - Automatically writing current facts, Decision Records, project context, production code, Git state, or publication output.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-design` resolves exactly one material design question for an explicit or unambiguously focused WorkRef.
  - It reads project authority and the smallest relevant code/evidence chain before proposing alternatives.
  - It chooses only the applicable domain, module, or reversible-exploration procedure and does not preload unrelated guidance.
  - It distinguishes owner decisions from evidence-driven design conclusions and never invents product intent.
  - It writes only an authorized selected Change `Design` update; all other output is returned as a bounded result for Shape or the user.
  - It reports the selected WorkRef, question, evidence, recommendation, alternatives/tradeoffs, unresolved decisions, artifact routing, and smallest next action in the requested/project/conversation language.

### Acceptance
#### Scenario: Shape delegates a domain ownership question
- GIVEN a selected non-ready Change has one material domain ownership decision and the installed suite contains no external Matt Skills
- WHEN `rsp-design` is invoked with that WorkRef and question
- THEN it inspects existing vocabulary, lifecycle, invariants, and ownership evidence
- AND returns a recommended model plus alternatives to the same Change without implementing it or writing durable current truth

#### Scenario: design evidence is insufficient
- GIVEN a module question depends on an unobserved runtime or interface behavior
- WHEN the cheapest safe evidence is a reversible probe
- THEN `rsp-design` describes or performs only an explicitly authorized disposable exploration outside production owners
- AND reports cleanup, observed evidence, and any remaining owner decision without presenting the probe as durable architecture

## Design
- Approach:
  - Independently reimplement the RSP-specific design interface from accepted Matt mechanisms and the current `rsp-shape` return seam.
  - Keep the root `SKILL.md` concise and load one capability-local reference only when its design mode applies.
  - Reuse the existing Skill conformance/evaluation harness and add unseen restraint cases covering missing authority, no durable-write authority, and prototype cleanup.
  - Provenance: accepted report `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md`; recommendation `R5` plus capability rows `C03`/`C07` in `research/models/rsp-capability-coverage.md`; source paths `skills/engineering/codebase-design/SKILL.md`, `skills/engineering/domain-modeling/SKILL.md`, and `skills/engineering/prototype/SKILL.md`; base revision `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`; adoption mode `independent-reimplementation`.
- Affected areas:
  - `skills/rsp-design/`
  - `scripts/validate-skills.mjs`, `scripts/evaluate-skills.mjs`, and capability fixtures/tests as required
  - package inventory and user-facing Skill documentation
- Constraints:
  - Revise `research/models/rsp-matt-first-daily-capability-audit.md` recommendation D2 after the maintainer's real-project finding that separately installed design Skills make the distributed daily workflow incomplete; cite its accepted Matt source report/revision and use `independent-reimplementation` rather than copying upstream prose.
  - Record upstream provenance as `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md`, revision `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`, source paths `skills/engineering/codebase-design/SKILL.md`, `skills/engineering/domain-modeling/SKILL.md`, and `skills/engineering/prototype/SKILL.md`, with adoption mode `independent-reimplementation`.
  - Preserve the current artifact ownership model and do not turn Design into a hidden router or controller.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Create and validate the concise `rsp-design` Skill and progressive references
- [x] Add focused behavior/restraint and package-discovery coverage
- [x] Run focused validation and record fresh evidence

## Verify
- Automated:
  - [x] `uvx --from skills-ref agentskills validate skills/rsp-design`
    - Observed 2026-07-22: passed; the package intentionally has no separate `validate:skills` script.
  - [x] focused `mise exec -- pnpm test -- <selected skill evaluation/tests>`
    - Observed 2026-07-22: `mise exec -- pnpm exec vitest run test/rsp-design-skill-contract.test.ts test/rsp-design-behavior.test.ts test/skill-contract.test.ts` passed 10 tests; focused ESLint also passed.
    - Observed 2026-07-22: `npm pack --dry-run --ignore-scripts --json` listed the root Skill and all three progressive references.
- Manual:
  - [x] Exercise domain and missing-authority behavior fixtures plus one exact installed-package module-seam journey.
    - Observed 2026-07-22: focused behavior fixtures passed and the `device-discovery-boundary` Shape → Design → Implement → Review → durable journey passed against package SHA-256 `6b07aaedfa04539013b564eb6640968b3e9b6783dd8259feddcb099155bae4b7`.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] Stable product facts were written to `.rsp/specs/design.md`; no project-owned instruction update was required.

## Blockers
- none
