# Workflow

## Purpose

Define Core routing, capability collaboration, task evidence and conditional host
coordination. Core means the `rsp` capability; durable identities and lifecycle
are owned by the [Work model](work-model.md). Workflow is conditional task
selection and completion, not a fixed stage machine.

## Capability ownership

| Capability | Responsibility |
| --- | --- |
| `rsp` | Goal, owner and authority selection; conditional routing and overall completion |
| `rsp-shape` | Bounded design advice or authorized planning and clarification |
| `rsp-implement` | Read-only diagnosis, authorized implementation and ordinary own verification |
| `rsp-doc` | Authorized document/Skill writing and author self-checks |
| `rsp-verify` | One declared read-only evidence boundary |
| `rsp-review` | Fixed-scope read-only semantic judgment |
| `rsp-commit` | Read-only delivery inspection or separately authorized exact local Git delivery |
| `rsp-structural-audit` | Optional report-only structural discovery |

The first seven form the default suite; installation grants no action authority.
Shape clarifies material choices for the authorized DecisionOwner, not approval
or new public requirements. Doc writes settled facts and converges work records;
it is not a second controller. Review never repairs or approves its own target.

Local wording fixes and mechanical status/evidence updates need no full writing
method when they require no whole-record reconciliation. Whole-Change convergence
uses Doc's artifact method when available even when few lines change, and may
confirm unchanged text. An unavailable Doc retains the same bounded local writing
checks, not permission to install it or replace required Review.

Diagnosis and design advice remain read-only unless the request also authorizes
mutation. Test-first work needs explicit instruction or demonstrated risk, not
merely a fix. Accepted fixed findings permit only authorized bounded correction,
affected verification and separate read-only re-review; Implement cannot certify
itself review-clean. Release writing belongs to Doc and release-document judgment
to Review; verification, Git delivery and publication remain separate owners.

Commit is a required delivery capability: if unavailable, Core does not stage or
substitute manual Git. An available Commit reviews exact ownership, applicable
checks and message policy, preserves hooks/signing, and stops on unsafe Git state,
content drift or missing decisive evidence. It binds one native Git attempt to the
reviewed delivery boundary and verifies the resulting message, content, ancestry
and remaining work. Failure or uncertainty grants no retry, amend, reset or repair.
The self-contained [Commit procedure](../../skills/rsp-commit/SKILL.md) owns the
specific checks and execution steps. These agent-enforced guards are not a
cross-process lock or proof of wrapper-equivalent reliability. The CLI's
[Git boundary](cli.md#git-execution-boundary) defines its separate surface.

## Composition

- One capability owns one bounded responsibility. The
  [Distribution package contract](distribution.md#skill-package-boundaries) owns
  standalone closure; [Writing quality](writing-quality.md#instruction-and-resource-design)
  owns instruction/resource design.
- Handoffs carry only the needed goal, owner, exact scope, authority, results and
  evidence. Capability selection is not worker delegation.
- Context migration is a conditional Core method for detected legacy context or
  an explicit request. Discovery alone grants no edits; Doc supplies authorized
  writing and unrelated work need not wait.
- A delivery kind and checkpoint/terminal purpose are independent. A checkpoint
  claims only its verified slice. Tracked terminal delivery requires complete
  selected acceptance; included WorkRefs do not create a Group or merge owners.
  Final reviewed Git content owns the message and snapshot, not copied handoff prose.

## Core flow

Core retains the authorized objective. Ordinary work selects the next responsibility
from the current requested result and authority, not the previous capability or
edit size. Bounded direct work needs no invented Change; tracked work retains its
selected owner. Load only the selected entrypoint and active method not already
applicable in context:

1. Resolve the goal, direct task or WorkOwner, scope, authority and decisive
   evidence. Unsettled intent, acceptance or material owner decisions select Shape;
   an unexplained execution symptom selects Implement's diagnosis. A settled task
   needs no planning phase.
2. Select the capability needed now. Implement includes ordinary own checks;
   Doc supports authorized writing. Verify is for a declared read-only or independent
   evidence obligation, and Review for requested or required semantic judgment.
   Required independence must come from real Host observations, not a role change.
3. Inspect the returned artifacts, actual effects, evidence applicability and
   unresolved limits. Continue a bounded correction or permitted method switch
   with the same owner when scope and authority hold. Return to Core for changed
   goal/owner/scope/authority, a cross-capability acceptance obligation or a blocker
   requiring another owner; stop for an unresolved material decision.
4. Claim only the completed boundary. A direct task uses its own acceptance;
   tracked terminal work proceeds to the completion/closeout contract below.
   Ordinary work gains no archive or Git authority from being complete.

These are routing dependencies, not mandatory separate calls, workers or phases.
A responsibility transition alone requires no repeated reading, test execution or
user continuation request. Recovery, coordination and lifecycle procedures load
only for their actual obligations under the contracts below; ordinary continuation
does not activate them.

For declared removal/rename, Review and Verify distinguish expected absence from
still-reachable removed behavior and genuinely missing requirements, including
retained migration/compatibility obligations within the selected evidence boundary.

## Completion and delivery

Core applies the [Work model's closeout contract](work-model.md#evidence-and-closeout):
verified facts, necessary knowledge writeback, final whole-Change convergence,
consistency checks and any required Review. Doc owns authorized writing; Review
supplies the separately required judgment. Neither CLI success nor a completion
assertion replaces these obligations.

Before terminal Change archive, require current `rsp ready <work-ref> --json` evidence
with `completionGate: pass` and `archiveReady: yes`. With archive authority, use
`rsp archive <work-ref>` and inspect the resulting archive/Focus transition.
For a Group, independently eligible children archive before the Group's declared
completion and integration conditions permit closeout. Without lifecycle authority,
report completed work as unarchived rather than gaining permission from readiness.

Git authority is separate: route an authorized exact boundary to Commit only after
any required lifecycle action. Direct delivery and checkpoints do not require an
invented archive; checkpoints do not claim terminal acceptance. Archive followed
by failed delivery remains archived but undelivered, without automatic reopen,
retry or history repair. Push, publication and human acceptance stay outside local
completion and delivery authority.

## Writing quality

[Writing quality](writing-quality.md) owns expression, language, artifact-role
and content-review requirements. Doc and Review carry standalone projections
of that contract. Product Skills do not depend on the source Spec at runtime.

## Methods and evidence

The [Architecture boundary](design.md#agent-and-tool-boundary) owns permitted method
changes and effect-aware recovery. Named checks and protected artifact operations
keep their method; missing evidence or required independence cannot be replaced
by an easier result.

Use the selected CLI's successful `rsp config --json` summary for decisions needing
effective RSP settings, optionally `--compact`. The CLI owns validation, defaults
and language inheritance; raw YAML and status are not substitutes. Reuse the
summary while applicable, refreshing on configuration drift, recovery or dependent
closeout. Failed projection leaves dependent choices unresolved, not independently
authorized work that needs no unknown setting.

Reuse traceable passing verification while tested scope and relevant content,
dependencies, configuration, tools, inputs and environment apply. Assess actual
targets, coverage and completion, not invocation intent or exit zero alone.
Invocation faults or missing observations do not prove a product defect. Run only
missing, failed or invalidated coverage and risk-justified additions; explicit
execution, current-environment observations and required independent execution
remain binding. Report reused and newly executed evidence distinctly in existing
evidence owners; add no registry or fingerprint protocol.

Review supplies a fresh semantic judgment of its fixed target, not routine repeated
tests. Writeback/archive checks final document consistency and current readiness
without invalidating unchanged code evidence. Commit establishes evidence for the
actual final index, including excluded worktree inputs; post-commit inspection
checks Git and hook effects instead of routinely repeating product tests.

Verify reports only its declared boundary. Exercised failed checks, unavailable
checks and supported passes remain distinct; none proves overall completion or
independence by itself. Execution, checks, review and acceptance claims remain
bounded by observed effects. Gaps limit affected claims without erasing supported
findings; missing Required evidence still prevents completion.

## Control boundaries

Core selects coordination for real coupled slices, recovery, independent acceptance,
resource conflicts or lifecycle/delivery obligations. File count and ordinary
single-owner continuity do not qualify. Effective `manage.activation` selects the
branch; `manage.closeout` limits qualified automatic closeout. The CLI owns their
[values and defaults](cli.md#inspection-and-configuration). Neither
configuration nor branch selection grants planning, product mutation or external
authority; nearer denial and fresh lifecycle/Git gates still apply. Ordinary flow
gains no automatic archive or commit permission.

Coordination retains the goal and acceptance, passing bounded work to capabilities
and validating scope, diff, evidence, limits and actual authority. Host-observed
worker identity, liveness, isolation and resource compatibility determine dispatch
and safe concurrency. Independent Group children or tasks may run concurrently;
shared writers or resources stay sequential unless the Host proves safe isolation.
A Skill handoff or worker self-report proves no independent execution.

## Boundaries

- WorkOwner and Group integration boundaries come from the Work model. A request-only
  integration boundary must be written back before closeout.
- Hosts own workers, execution environments, continuation, cancellation, concurrency
  and resource lifecycle. Evaluators/adapters own machine schemas and scoring.
- Stops name the missing input, evidence, authority or owner decision and the safe
  resume condition. Completion, transport validity or lack of an error is not acceptance.
- Local capability availability grants no remote delivery, deployment, publication,
  approval, human acceptance or cross-branch integration authority.

## Response presentation

User, host and project instructions set communication style. Capabilities require
result information, not fixed headings or a universal delivery template. Answer
the current request with the outcome, necessary evidence and material limits;
include a next action only when work or a user decision remains.

Compact presentation preserves failure, authority, required fields and unverified
scope. Keep complete evidence with its existing owner rather than repeating it
in the response. Review retains scope, comparison, separate Code/Document results,
actionable findings and coverage; Verify retains canonical outcomes and required
result information; Commit retains exact delivery observations and the complete
message as evidence. Durable writeback decisions and archive gates remain required
without a routine no-op field list. Explicitly required formats and machine
schemas remain exact.
Standalone Skills keep this boundary without depending on personal configuration.

## Constraints

Keep route, strategy, dispatch, acceptance and closeout derived and phase-local.
Response summaries are optional presentations, not a universal inter-Skill protocol.
Persist no controller, worker registry, receipt, lease, event ledger, schedule or
runtime transport. Internal evaluation formats never become product dependencies.
