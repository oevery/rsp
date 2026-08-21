---
kind: "fix"
---

# Change: prevent-required-worker-simulation

## Proposal
- Outcome: Prevent required worker execution from being simulated by the Manager
- Why:
  - The fresh `managed-coordinated-parallel` provider campaign observed no candidate collaboration dispatches or WorkerReceipts, while the Manager directly changed both worker-owned slices and reported two completed workers.
  - Existing acceptance and evaluator rules detect this after execution but do not make host-confirmed worker admission an explicit pre-mutation gate in the runtime Skill.
- Scope:
  - Make `DispatchDisposition: required` monotonic for the current managed phase.
  - Require host-confirmed WorkerInvocation admission before Assignment-owned mutation or verification commands.
  - Separate derived topology from host-observed lifecycle facts and prohibit Manager-authored worker evidence.
  - Keep published runtime Skills free of evaluator-private terminology and historical anti-persistence enumerations while preserving transient ownership boundaries.
  - Add deterministic contract coverage for the admission gate and evidence provenance.
  - Refresh the current beta product-composition lock and current corpus-count assertions without rewriting retained historical evidence.
- Non-goals:
  - Adding a host-specific worker API, runtime permission sandbox, persistent controller state, or new public control enum.
  - Changing `none | preferred` fallback behavior, worker receipt fields, provider matrix size, or release authority.

## Spec
### MODIFIED
- Requirement: Required worker execution is established by host-observed lifecycle facts before worker-owned work begins.
  - Once derived for the current managed phase, `required` cannot be downgraded for cost, convenience, local mutation capability, or missing worker capability.
  - Before host-confirmed admission, Manager may inspect and compose or deliver Assignments but may not modify Assignment-owned paths or run Assignment-owned verification commands.
  - Manager-side edits, commands, internal parallelism, role labels, and self-authored output establish neither WorkerInvocation nor WorkerReceipt.
  - Manager may validate or reject a worker-authored receipt but may not author, repair, reconstruct, or substitute one.
  - A derived topology remains a plan; completed dispatch, count, settlement, and release claims require host observations.
  - Unavailable required admission stops `capability-unavailable` before worker-owned mutation and leaves acceptance `incomplete`.

### Acceptance
#### Scenario: Required worker admission succeeds
- GIVEN a managed phase whose request or acceptance requires worker identity
- WHEN every required Assignment receives host-confirmed admission and later returns a worker-authored schema-valid receipt
- THEN worker-owned execution may proceed and Manager may validate, integrate, and report only the observed lifecycle facts

#### Scenario: Required worker admission is absent
- GIVEN `DispatchDisposition: required`
- WHEN admission cannot be confirmed or no worker dispatch is attempted
- THEN Manager stops `capability-unavailable` before Assignment-owned mutation, does not synthesize a receipt, and keeps acceptance `incomplete`

#### Scenario: Planned parallel work is not observed
- GIVEN a derived `parallel-wave` topology
- WHEN host events do not observe the required WorkerInvocations
- THEN Manager may report the pending or unavailable plan but must not claim completed dispatches, worker count, receipts, or accepted worker results

## Design
- Approach:
  - Add one compact required-dispatch invariant next to `DispatchDisposition` derivation and one action-time admission gate in `Dispatch owned work`.
  - Keep receipt schema and lifecycle mapping in their existing references; strengthen only provenance language needed by the action gate.
  - Add a Core-owned machine contract kernel for cross-Skill transport integrity while retaining Assignment and WorkerReceipt semantics under `rsp-manage`.
  - Keep the evaluator's machine-consumer descriptor as the single source for prompt shape validation, exact Assignment identity correlation, field types, and canonical value domains.
  - Carry the complete descriptor through the Core handoff and every producer Assignment without summarizing, translation, or synonym substitution.
  - Extend the existing semantic fixture corpus rather than adding another evaluator scoring path.
  - Keep evaluator-specific projection, scoring, and receipt protocols in evaluator code and fixtures rather than published runtime Skills.
- Boundaries:
  - `skills/rsp-manage/SKILL.md` owns dispatch choice, mutation gating, truthful topology reporting, and failure behavior.
  - `managed-exchange.md` owns worker-authored receipt provenance; `host-worker-lifecycle.md` owns observer-authored lifecycle truth.
  - `skills/rsp/references/contract-kernel.md` owns only cross-Skill machine-contract integrity; it does not absorb Manage-specific fields, lifecycle, validation, or acceptance.
  - The managed-controller evaluator remains the machine consumer and post-execution hard gate; its descriptor drives both prompt construction and receipt shape validation.
  - `.rsp/` receives no contract, template, schema, receipt, or validator projection.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, directly linked worker references, and bounded Discipline handoff prose.
  - `evaluation/managed-controller/fixtures/`, the current beta identity lock, and managed-controller contract tests.
- Constraints:
  - Preserve host neutrality and existing public enums and durable artifact ownership.
  - Do not require simultaneous worker liveness or encode host-specific spawn/wait tool names.

## Tasks
- [x] Add required-dispatch monotonicity, admission-before-mutation, and truthful topology rules to authored `rsp-manage`.
- [x] Strengthen worker receipt and lifecycle provenance without duplicating their existing contracts.
- [x] Add focused deterministic fixture and contract assertions.
- [x] Refresh current evaluation identities and corpus counts while preserving retained reports.
- [x] Build the CLI and sync the self-hosted projections.
- [x] Run focused and repository-required verification.
- [x] Propagate an evaluation-required Assignment identity and canonical WorkerReceipt enum values exactly to each worker without Manager repair or reconstruction.
- [x] Remove evaluator-private and conversation-derived residue from published Skills, centralize transient ownership semantics, and update semantic fixtures without weakening runtime boundaries.
- [x] Resolve review findings by validating assignment-specific canonical result values and using provider identities distinct from policy ids.
- [x] Write stable machine-contract transport and required-admission facts to the existing Skill Control Model and Skill System Specs; no Decision Record is needed.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/skill-runtime-context-contract.test.ts` — passed: 2 files, 93 tests; proves required-dispatch and provenance contracts remain reachable and enforced
  - [x] `mise exec -- pnpm run build` — passed; proves authored package and declarations compile
  - [x] `node dist/cli.mjs update` — passed: already up to date; proves self-hosted projections match authored sources
  - [x] `mise exec -- pnpm run lint` — passed with no warnings; proves repository static policy
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/architecture/documentation-contract.test.ts test/release/clean-install-check.test.ts` — passed: 5 files, 113 tests; proves the Core contract kernel is reachable, the machine descriptor is complete, runtime identity maps explicitly, synonym drift fails closed, and packaged references remain complete
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --root . --json` — passed; `skills/rsp/references/contract-kernel.md` is reachable and no published Skill Markdown is unreachable
  - [x] `mise exec -- pnpm run test` — passed: 87 files, 913 tests; proves full deterministic regression coverage
  - [x] `mise exec -- pnpm exec vitest run test/skills/skill-runtime-context-contract.test.ts test/evaluation/managed-controller-contract.test.ts test/skills/rsp-resolve-findings-contract.test.ts` — passed: 3 files, 99 tests; proves evaluator-private terminology is absent and replacement ownership semantics remain enforced
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/architecture/documentation-contract.test.ts test/release/clean-install-check.test.ts test/skills/rsp-resolve-findings-contract.test.ts` — passed: 6 files, 118 tests; proves Skill versions, package reachability, machine contracts, and bounded handoff behavior remain aligned
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-beta-contract.test.ts` — passed: 1 file, 20 tests after refreshing only the current product-composition lock
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts` — passed: 1 file, 89 tests; proves non-canonical worker results fail and the atomic descriptor carries distinct exact identities plus assignment-specific allowed result domains
  - [x] `mise exec -- pnpm exec vitest run test/skills/skill-runtime-context-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/architecture/documentation-contract.test.ts test/release/clean-install-check.test.ts test/skills/rsp-resolve-findings-contract.test.ts` — passed: 5 files, 29 tests; proves adjacent Skill, package, and resolution contracts remain aligned
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/architecture/documentation-contract.test.ts` — passed: 4 files, 110 tests after durable Spec writeback
### Optional
- Manual or environment:
  - [ ] Fresh post-correction `managed-coordinated-parallel` provider comparison; the 2026-08-21 pre-correction run performed two host-observed dispatches and stopped truthfully because the split contract allowed non-canonical Assignment identities and enum values
- Coverage:
  - Required dispatch cannot be simulated by Manager mutation or narration; ordinary `none | preferred` behavior and post-execution evaluation remain unchanged.
  - The current beta product composition is refreshed to `87a2a161e92a025a8e34142c14a2a9a4c1506d1a5f72ceb568e348babcc69f95`; retained historical reports and hashes remain unchanged.

## Blockers
- none
