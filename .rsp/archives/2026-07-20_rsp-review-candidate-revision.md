---
kind: "research"
---

# Change: rsp-review-candidate-revision

## Proposal
- Summary: Revise the research-only rsp-review candidate for restraint, document completeness, and lower context cost
- Why:
  - The pinned evaluation found false-positive missing-test findings in both clean code cases, missed one unresolved rollback choice, and measured 31.44% median and 87.60% maximum candidate input overhead.
  - The next candidate must correct those concrete failures without weakening correctness, authority, read-only, mixed-change, or ambiguity behavior.
- Scope:
  - Produce one new immutable candidate version under `research/candidates/skills/rsp-review/`.
  - Narrow when missing regression coverage becomes a Finding and require unresolved ungrounded choices to surface in Document review.
  - Replace the current 160-line progressive-reference package with a compact single-file candidate, then compare it with the same pinned eight-case matrix and cost thresholds.
  - Retain exact outputs, identities, normalized evidence, and a promote, revise, or reject recommendation under `research/evaluations/rsp-review/`.
- Non-goals:
  - Moving the candidate into `skills/` or `.agents/skills`, changing published RSP behavior, or publishing/releasing the package.
  - Adding review personas, additional review categories, a router, Managed Controller behavior, or a general benchmark framework.
  - Lowering quality gates to make the compact candidate appear cheaper.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: bounded candidate revision
  - Missing tests are Findings only when explicit authority requires them or the change introduces materially risky observable behavior such as a new failure branch, state transition, concurrency, persistence, security, or public contract shape; otherwise absent coverage belongs only in Coverage.
  - Document review reports unresolved choices that affect product, operations, rollback, migration, or completion when no authority resolves them.
  - The candidate remains one host-neutral, report-only capability with separate Code and Document states and one deduplicated report.
- Requirement: comparable evaluation
  - The revised candidate is frozen before a new eight-case baseline/candidate matrix using the same model, effort, sandbox, fixtures, and predeclared quality and cost thresholds as the prior pinned evaluation.
  - The report records candidate, fixture, harness, matrix, and output hashes and does not reuse evidence from the previous candidate hash as promotion evidence.

### Acceptance
#### Scenario: clean changes preserve restraint
- GIVEN the restraint-clean and skipped-document fixtures
- WHEN the compact candidate reviews their code-only changes
- THEN Code is clean, Document is skipped, and absent tests do not become Findings

#### Scenario: document ambiguity remains visible
- GIVEN the document fixture contains an unresolved rollback choice with no resolving authority
- WHEN the compact candidate reviews the implementation plan
- THEN the unresolved choice is reported together with the other required document observations

#### Scenario: revision is judged without moving the gate
- GIVEN the frozen compact candidate and complete paired matrix
- WHEN the scorecard is evaluated
- THEN all hard quality gates and the existing 30% median and 50% per-case input-overhead limits determine promote, revise, or reject

## Design
- Approach:
  - Treat the previous pinned matrix as the red evidence and change only instructions tied to its observed failures and cost.
  - Inline the essential Code and Document axes into `SKILL.md`, remove optional reference reads, preserve the fixed-scope/authority/report/read-only contract, and increment the date-based content version.
  - Run portable contract and harness tests before freezing the candidate, then execute a fresh serial matrix with `gpt-5.6-terra` at `low` effort and an explicitly recorded provider.
  - Score semantic equivalence manually against fixture observations while deriving mutation, identity, event, usage, and cost facts from normalized metadata.
- Affected areas:
  - `research/candidates/skills/rsp-review/`
  - `research/evaluations/rsp-review/<date>-compact-<provider>/`
  - `scripts/rsp-review-eval.mjs`, its type declarations, and focused tests for explicit third-party provider selection
- Constraints:
  - Do not edit the candidate after the new matrix starts; any behavior change requires another run identity.
  - Keep raw host events and temporary workspaces ignored under `.cache/`.
  - Do not infer unavailable metrics, commit secrets, or install the candidate into project discovery.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement and statically validate the compact candidate revision
- [x] Freeze the compact candidate identity before live evaluation
- [x] Run the complete pinned baseline/candidate matrix
- [x] Score behavior, restraint, authority, duplication, and cost against the unchanged gates
- [x] Retain exact outputs and record the promote/revise/reject recommendation
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts`
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py research/candidates/skills/rsp-review`
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run typecheck`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check --focused`
- Manual:
  - [x] Confirm all retained outputs match matrix hashes and no run changed its prepared workspace
  - [x] Confirm the recommendation applies the prior quality and cost gates without editing the candidate during evaluation
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
