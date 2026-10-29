---
kind: "refactor"
---

# Change: explicit-capability-entry

## Proposal
- Outcome: Ordinary requests load their selected capability without unrelated Core routing, while unresolved ownership and coordination still reach the proper owner.
- Scope: managed AGENTS Entry and its self-host projection; Core setup guidance; Review's common and method-specific rules; their authoritative contracts and affected installation/update checks.
- Non-goals: a new lightweight mode, configuration or Skill; retirement of Implement status vocabulary or optional rendering; changes to runtime selection, Git safeguards, tracking requirements or global environments; paid model evaluation.

## Spec
### MODIFIED
- Requirement: A bounded request clearly selecting one capability may load it directly after applicable project context and ownership are established. Direct capability invocation does not make tracked work untracked.
- Requirement: Core loads for unresolved routing/ownership, actual cross-capability coordination or lifecycle operations. Focus is read when needed to resolve or recover an owner, not as an unconditional step for every explicit capability.
- Requirement: Selected runtime, unknown configuration, missing required Skills, existing Changes and permission boundaries retain their contracts. Explicit capabilities cannot bypass a missing tracking prerequisite.
- Requirement: Review's entry owns common finding, coverage and verdict rules. Code and Document methods retain their distinct evidence requirements without repeating the general report contract.
- Requirement: Ordinary Core retains the selected-CLI and needed-configuration rules; setup/upgrade detail is conditional through the existing setup-repair method rather than repeated in every ordinary entry.

### Acceptance
#### Scenario: Explicit bounded capability
- GIVEN a clear implementation, document or review request with sufficient scope and owner facts
- WHEN the managed Entry selects its method
- THEN it loads the corresponding capability without Core or a redundant Focus lookup, while preserving applicable context, required tracking and relevant contracts.

#### Scenario: Owner resolution and protected work
- GIVEN unclear routing, missing owner facts, tracked recovery, a Group dependency or a lifecycle action
- WHEN the request is routed
- THEN the required Core/Focus/work-model path remains available and no independent review, authorization or prerequisite is skipped.

#### Scenario: Review and setup detail
- GIVEN ordinary Code or Document review, or ordinary Core coordination unrelated to setup
- WHEN its entry and selected method are read
- THEN the common rules have one executable owner, specialized evidence remains local, and setup/upgrade detail is not mandatory input.

#### Scenario: Managed environment preservation
- GIVEN existing user instructions and the selected source or pinned runtime
- WHEN initialization or an authorized update renders the new Entry
- THEN user content and runtime selection remain intact without a new mode, schema or implicit installation.

## Design
- Change the actual managed Entry selection contract, not just its phrasing. Keep existing owner resolution and the distinction between capability invocation and Direct/Change work shape.
- Remove redundant common Review summaries from the same mandatory reading chain; retain Code reachability/failure/test gates and Document reader/task evidence. Use the existing setup-repair reference for branch-only Core detail.
- Reconcile the self-host managed Entry only through the freshly built local CLI after inspecting `update --dry-run`; unrelated cleanup or global effects are outside this boundary.
- Reuse installation/update and package checks for deterministic behavior. Instruction routing and safe restraint receive independent source-level review, not brittle prose-string assertions. Static path/word comparisons are diagnostics, not model performance evidence.
- Current contracts are reconciled in [Workflow](../specs/workflow.md#capability-ownership), [CLI](../specs/cli.md) and [Distribution](../specs/distribution.md#skill-package-boundaries); the managed Entry and authored Skills carry the executable guidance.

## Tasks
- [x] Reconcile the Entry routing contract, renderer and self-host managed block; align Implement's explicit WorkRef selection with conditional Focus loading.
- [x] Remove Review and Core's selected ordinary-path duplication without losing required boundaries.
- [x] Run affected implementation, resource, document and offline task checks.
- [x] Obtain Astra medium independent acceptance of the frozen candidate; the clean review required no corrections.
- [x] Reconcile the final Change and current knowledge for archive.

## Verify
### Required
- [x] Build, lint and repository code tests cover the renderer and existing setup/update preservation behavior.
- [x] Skill package/resource and affected document/link checks cover all changed ordinary and conditional paths.
- [x] Offline native task schema checks validate affected evaluation structure without model or semantic-judge calls.
- [x] A distinct Astra medium worker reviews the complete candidate against the prior source and declared scenarios.

### Candidate evidence
- Verification covers the source delta against `d241c081d65d3e9007f89a8c268f4cd4de674e13`. Fresh `mise exec -- pnpm run build`, `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` passed; the latter rebuilt the source and passed 14 files / 106 tests.
- Managed reconciliation: the freshly built local CLI's `update --dry-run` reported only the AGENTS managed block. `update` refreshed only that block, preserving its source runtime selection and all project-owned content.
- Resource and document checks: `mise exec -- pnpm run skills:package-check` passed all seven packages; `mise exec -- pnpm run skills:security-check` passed 39 files with zero findings. `mise exec -- pnpm run docs:check` passed 9 bilingual pairs / 24 files. A local Markdown link/heading check passed 47 links across 11 affected documents. Author reading-path inspection covered direct/tracked selection, owner/dependency and missing-prerequisite restraint, Review's common and specialized rules, and conditional setup guidance.
- Offline checks: `mise exec -- uv run --project tests/skills python tests/skills/evaluate.py check` passed 47 native task schemas. The local source CLI's `check --json` reported zero errors/warnings and no Focus selection; `git diff --check` passed.
- Independent acceptance: a distinct Astra medium reviewer judged the complete 12-file implementation candidate, including this Change, against the source baseline and declared scenarios. Code and Document judgments were `clean`, with no actionable findings. The review traced the CLI init/update renderer chain and retained routing, ownership, prerequisite, permission, independence and specialized Review gates; it reused applicable implementation evidence and ran a fresh passing `git diff --check`. Final record convergence changes no reviewed product input.
- Limits: acceptance is independent source-level semantic and reading-path judgment, not actual model routing, performance, cost or human acceptance evidence. No paid model evaluation or semantic-judge execution was performed.

## Blockers
None
