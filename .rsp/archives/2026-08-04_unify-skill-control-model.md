---
kind: "refactor"
---

# Change: unify-skill-control-model

## Proposal
- Outcome: Unify transient control vocabulary and state transitions across Core, Shape, Disciplines, and Manage without adding persisted workflow state.
- Why:
  - Current behavior distinguishes direct work, specialist routes, owner resolution, execution-frontier discovery, worker receipts, acceptance, and closeout, but the same concepts are expressed through overlapping terms such as `needs-owner`, `owner-decision`, `fog`, `needs-shape`, `out-of-goal`, and generic `stop`.
  - The incomplete vocabulary allowed missing worker execution and verification evidence to be mistaken for accepted completion, which then incorrectly activated otherwise-valid lifecycle and local-commit closeout.
- Scope:
  - Define one canonical transient control model covering route selection, owner resolution, execution-frontier disposition, stop/resume behavior, acceptance, and closeout eligibility.
  - Make Core Direct Execution, specialist Discipline execution, and Managed Execution explicit peer routes.
  - Map Shape questioning, Manage Intake, execution lanes, worker availability, independent verification, durable review, and closeout onto the shared model.
  - Add behavioral contracts for direct execution, owner-question resume, fog-to-Shape return, out-of-goal rerouting, unavailable required workers, and closeout gating.
- Non-goals:
  - Do not add a persisted workflow state machine, controller ledger, ticket map, run registry, or new CLI lifecycle values; Changes remain only `open` or `archived`.
  - Do not flatten lane-specific receipt results into one generic enum, change dispatch/retry execution bounds, introduce token-based control, or alter the `manual | lifecycle | local` closeout tiers.
  - Do not adopt Wayfinder's external tracker or make Grill Me a required public Skill.

## Spec
### ADDED
- Requirement: every control decision has one phase-specific disposition and one resume contract
  - A transient `ControlOutcome` identifies the current phase, its phase-specific disposition, decisive evidence, next owner, required input when any, and the rule for resuming or rederiving.
  - `ControlOutcome` is response-only derived coordination data. It is not persisted in a Change, Group Brief, Spec, Decision Record, archive, registry, or generated projection.
  - Phase-specific values remain distinct rather than becoming one universal status enum.
- Requirement: Core exposes a complete route model
  - `RouteDisposition` is exactly `specialist`, `direct`, `managed`, `shape`, or `stop`.
  - `specialist` returns one explicit Discipline owner. `direct` permits one bounded Core/Implement mutation path with one decisive verification and no worker envelope. `managed` enters Manage Intake. `shape` returns unclear owned work to Shape. `stop` names its `StopDisposition`.
  - Direct work that expands beyond one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle, and no ready successor is rederived rather than remaining direct.
- Requirement: owner and execution uncertainty use separate vocabularies
  - `OwnershipDisposition` is exactly `ready`, `ask-owner`, `return-to-shape`, or `reroute`.
  - Intake maps `ready` to `ready`, `needs-owner` to `ask-owner`, `needs-shape` to `return-to-shape`, and `out-of-goal` to `reroute`; compatibility labels may remain at the public boundary during migration but must declare their canonical disposition.
  - `FrontierDisposition` remains exactly `owner-decision`, `fog`, `evidence-needed`, `executable`, or `out-of-goal`. It applies only after a ready owner is confirmed.
- Requirement: every stop defines the action after stopping
  - `StopDisposition` is exactly `ask-owner`, `return-to-shape`, `reroute`, `retry-with-evidence`, `environment-blocked`, `verification-blocked`, or `capability-unavailable`.
  - `ask-owner` returns one highest-impact owner question and resumes through fresh Intake after an answer. `return-to-shape` may enter ordinary or explicit deep clarification and resumes only after Shape returns a ready owner. `reroute` requires Core to establish a new owner or authority boundary.
  - No stop disposition permits worker dispatch, product mutation, lifecycle closeout, or Git action until its resume contract succeeds.
- Requirement: acceptance and closeout are derived independently from execution
  - `AcceptanceDisposition` is exactly `incomplete`, `evidence-complete`, or `review-clean`.
  - A required worker that was not created, did not return a valid receipt, returned `unavailable` or `boundary-changed`, or could not satisfy required independent verification keeps acceptance `incomplete`.
  - `CloseoutEligibility` is exactly `not-eligible`, `lifecycle-ready`, or `local-commit-ready`. Only `review-clean` acceptance plus fresh owner, authority, diff, and verification evidence can derive a ready value.
  - `manual`, `lifecycle`, and `local` remain authority ceilings. `manual` cannot automate closeout; `lifecycle` can reach only `lifecycle-ready`; `local` can reach `local-commit-ready` for one exact terminal non-small boundary. A nearer denial narrows the result.

### Acceptance
#### Scenario: small owned work executes directly
- GIVEN one ready owner, one local seam, one mutation pass, one decisive check, no managed lifecycle, and no ready successor
- WHEN Core derives the route under automatic Manage activation
- THEN it returns `RouteDisposition: direct`, performs no Manage Intake or WorkerEnvelope, and rederives the route if the boundary expands

#### Scenario: owner questions and fog resume through different owners
- GIVEN Intake finds one material owner choice while a ready owner's execution frontier may instead contain fog
- WHEN the control model stops
- THEN the owner choice returns `OwnershipDisposition: ask-owner` and resumes through Intake, while fog returns `StopDisposition: return-to-shape` and resumes only after Shape confirms a ready owner

#### Scenario: out-of-goal work reroutes instead of asking a product question
- GIVEN ownership, topology, dirty paths, or authority cannot establish the current goal boundary
- WHEN Core or Manage returns out-of-goal
- THEN the canonical disposition is `reroute`, no mutation occurs, and Core must establish a new owner or authority before continuing

#### Scenario: missing required worker evidence cannot reach closeout
- GIVEN Manage requires an implementation or independent verification worker
- WHEN the worker cannot be created or no valid required receipt is accepted
- THEN acceptance remains `incomplete`, closeout is `not-eligible`, and neither archive nor commit runs

#### Scenario: valid closeout layering is preserved
- GIVEN all required receipts, verification, durable review, owner evidence, and exact paths are fresh and accepted
- WHEN closeout is derived
- THEN `manual`, `lifecycle`, and `local` retain their existing ceilings, with lifecycle completed before any separately derived local commit and push still explicit

## Design
- Approach:
  - Define the canonical vocabulary in one stable Skill Control Model Spec, then project only the necessary phase-specific terms into Core, Shape, Manage, fallback rules, and user documentation.
  - Keep current public labels where compatibility matters, but pair them with canonical dispositions and one explicit next owner/resume rule.
  - Treat missing worker creation as capability-unavailable evidence rather than an absent event that the controller may ignore or replace.
- Boundaries:
  - Core owns `RouteDisposition` and rederivation. Shape owns clarification and ready-owner return. Disciplines own their bounded action and result. Manage owns Intake, frontier, worker acceptance, convergence, and closeout derivation after selection.
  - The selected Change or Group remains the only durable work owner. The model adds no runtime object store and no CLI persisted state.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`, `.rsp/specs/skill-system.md`, and `.rsp/specs/design.md`
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, `skills/rsp-shape/**`, `skills/rsp-manage/SKILL.md`, authored fallback rules, and bilingual Skill documentation
  - focused Core, Shape, Manage, worker-failure, resume, and closeout contract/behavior fixtures
- Constraints:
  - Preserve progressive disclosure and do not require every Skill to load a runtime glossary.
  - Preserve exact lane result schemas, execution-count bounds, truthful independent-Verify downgrade, and existing automatic closeout tiers.
  - Keep the model host-neutral: worker identity and creation evidence may be unavailable, but absence can never be interpreted as success.

## Tasks
- [x] Add the canonical Skill Control Model Spec and route/owner/frontier/stop/acceptance/closeout vocabulary.
- [x] Update Core, Shape, Manage, fallback rules, and user documentation to use the canonical dispositions and explicit resume rules without duplicating a runtime glossary.
- [x] Add focused behavioral contracts for direct execution, question/fog/reroute transitions, required-worker unavailability, closeout gating, and preserved closeout tiers.

## Verify
- Automated:
  - [x] Focused Core/Shape/Manage control-model tests and deterministic fixture evaluation — 5 files / 125 tests and 19 / 19 controller fixtures passed, proving canonical vocabulary, route order, resume behavior, worker-failure restraint, and closeout gating.
  - [x] Build, fallback synchronization, docs checks/build, typecheck, lint, aggregate tests, and diff hygiene — full tests passed 55 files / 649 tests; authored and self-hosted fallback rules match.
- Manual or environment:
  - [x] Inspect representative direct, specialist, managed, ask-owner, fog, reroute, unavailable-worker, lifecycle-only, and local-terminal outcomes against the transition model — independent verification and fixed-scope code/document review found no unresolved finding after the bilingual fog-return correction.
- Coverage:
  - Does not add a persistent controller, prove every host's worker identity API, change remote delivery authority, or adopt a cross-session Wayfinder tracker.

## Blockers
- none
