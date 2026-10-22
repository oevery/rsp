# Workflow

## Purpose

Define Core routing, capability collaboration, task evidence and conditional host
coordination. Core means the `rsp` capability; durable identities and lifecycle
are owned by the [Work model](work-model.md). Workflow is conditional task
selection and completion, not a fixed stage machine.

## Capability ownership

Core owns the shared runtime work-model reference. Direct capabilities read it
when tracked identities are needed and missing from context; no Core preflight is
required. Skills are the only executable workflow. Missing or unusable required
Skills stop dependent work; retired Rules provide no alternative protocol. Use known paths and discover necessary context. Workers
inspect sources themselves. Status and configuration queries resolve needed facts;
required dependency/recovery checks and fresh archive readiness remain binding.

Review's structural method needs an explicit repository
or subtree boundary and observed checkout state, not a diff. Ordinary review does
not widen into a repository audit; structural findings grant no design or repair
authority. Review uses one severity and report contract across its methods.

| Capability | Responsibility |
| --- | --- |
| `rsp` | Goal, owner and authority selection; routing, cross-capability correction/review and overall completion |
| `rsp-shape` | Bounded design advice or authorized planning and clarification |
| `rsp-implement` | Read-only diagnosis, one bounded authorized implementation/correction and ordinary own verification |
| `rsp-doc` | Authorized document/Skill writing and author self-checks |
| `rsp-verify` | One declared read-only evidence boundary |
| `rsp-review` | Fixed-scope read-only judgment or explicitly bounded structural discovery |
| `rsp-commit` | Read-only delivery inspection or separately authorized exact local Git delivery |

These seven form one installable core suite; installation grants no action authority.
Shape clarifies material choices for the authorized DecisionOwner, not approval
or new public requirements. Doc writes settled facts and converges work records;
it is not a second controller. Review never repairs or approves its own target.

Local wording fixes and pure existing Tasks/Verify refreshes need no full writing
method when accepted scope, contract, design and stable knowledge remain accurate
and no lifecycle or terminal delivery is being prepared. Inspect the owner for
contradictions, record actual outcomes and check the edited record against evidence.
Passing checks or recovery alone does not activate durable writeback. Required
checks, Review, independence and incomplete results retain their obligations;
necessary knowledge updates use scoped writing; contradictions return to their owner.
Final-delivery or closure convergence uses Doc's artifact method when available
and may confirm unchanged text. An unavailable Doc retains the same bounded local writing
checks, not permission to install it or replace required Review.

Diagnosis and design advice remain read-only unless the request also authorizes
mutation. Test-first work needs explicit instruction or demonstrated risk, not
merely a fix. Implement disposes fixed findings and corrects accepted findings only
within separate mutation authority; Core owns any correction/re-review loop.
Implement cannot certify itself review-clean. Release writing belongs to Doc and
release-document judgment to Review; verification, Git delivery and publication
remain separate owners.

Commit is a required delivery capability: if unavailable, Core does not stage or
substitute manual Git. An available Commit reviews exact ownership, applicable
checks and message policy, preserves hooks/signing, and stops on unsafe Git state,
content drift or missing decisive evidence. It binds one native Git attempt to the
reviewed delivery boundary and verifies the resulting message, content, ancestry
and remaining work. Failure or uncertainty grants no retry, amend, reset or repair.
The [Commit procedure](../../skills/rsp-commit/SKILL.md) owns the
specific checks and execution steps. These agent-enforced guards are not a
cross-process lock or proof of wrapper-equivalent reliability. The CLI's
[Git boundary](cli.md#git-execution-boundary) defines its separate surface.

## Composition

- One capability owns one bounded responsibility. The
  [Distribution package contract](distribution.md#skill-package-boundaries) owns
  suite resource closure; [Writing quality](writing-quality.md#instruction-and-resource-design)
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

Core retains the authorized objective and selects the next responsibility from
the current requested result, missing material decisions, risk and authority.
Previous capabilities, file count and edit size do not set workflow depth. Bounded
direct work needs no invented Change; tracked work retains its selected owner.
Classify direct versus tracked work from the request, nearest instructions,
existing owner evidence and checkout before querying tracking state. A direct
task without a selected or required WorkOwner needs no tracking status/readiness
or initialization. Missing or broken required tracking remains a gap; it cannot
be bypassed by calling the work direct. Required configuration is obtained
independently of status success, including for direct tasks.

Load only the selected entrypoint and active method not already applicable in context:

1. Resolve the goal, direct task or WorkOwner, scope, authority and decisive
   evidence. Unsettled intent, acceptance or material owner decisions select Shape;
   an unexplained execution symptom selects Implement's diagnosis. A settled task
   needs no planning phase.
2. Select the capability needed now. Implement includes ordinary own checks;
   Doc supports authorized writing. Verify collects and reports a selected owner's
   declared evidence when that is the requested result or a separate verification
   obligation. Review supplies fixed-scope semantic judgment, including whether
   implementation supports a completion claim, and runs authorized supporting
   checks without a forced Verify handoff. Read-only status or named checks alone
   do not select both. Explicit combined requests retain both responsibilities;
   overall completion and lifecycle decisions remain Core's responsibility.
   Required independence must come from real Host observations, not a role change.
3. Inspect returned artifacts, actual effects, evidence applicability and unresolved
   limits. A capability may finish its bounded correction and checks or switch
   permitted methods within unchanged scope and authority. Core selects any next
   correction or Review; changed goal/owner/scope/authority or a blocker requiring
   another owner returns to Core. Stop for an unresolved material decision.
4. Claim only the completed boundary. A direct task uses its own acceptance;
   tracked terminal work proceeds to the completion/closeout contract below.
   Ordinary work gains no archive or Git authority from being complete.

These are routing dependencies, not mandatory separate calls, workers or phases.
Batch independent read-only observations of the same result boundary and reuse them
across read-only review when relevant inputs remain unchanged and no concurrent or
uncertain effects require refresh. Preserve independent source inspection and judgment,
refresh affected observations after changes, expose individual check failures, and
retain dependent mutation order and fresh lifecycle/Git gates.
A responsibility transition alone requires no repeated reading, test execution or
user continuation request. Reuse applicable entrypoint and method text available
in context; obtain missing or changed instructions before relying on them. New
task observations alone do not invalidate instructions. Recovery, coordination
and lifecycle procedures load
only for their actual obligations under the contracts below; ordinary continuation
does not activate them.

Core alone owns the cross-Implement/Review loop: validate the fixed report and
authority, obtain one bounded Implement correction with affected checks, then
fresh fixed-scope read-only Review. Continue accepted in-scope findings automatically
while authority and decisive evidence hold. A direct caller combining correction
and review uses the same [Core loop method](../../skills/rsp/references/coordination-review.md)
without a full Core preflight or a second loop; a single capability remains directly
callable. Loading this method grants no managed dispatch or closeout authority.

Core alone tracks the separate transient budgets: at most three worker-correction
passes by default and three finding-resolution passes per Change or bounded direct
request. Stop if the same finding remains after two completed corrections, or earlier
for repeated evidence, non-convergence, changed scope or authority, unsafe replay,
unavailable required capability, unverifiable correction or failed/unavailable decisive
verification. A material decision or `needs-clarification` returns to its owner.
Required independent acceptance remains separate; neither Implement nor Review
starts another loop or resets its counters.

For declared removal/rename, Review and Verify distinguish expected absence from
still-reachable removed behavior and genuinely missing requirements, including
retained migration/compatibility obligations within the selected evidence boundary.

## Completion and delivery

Routine stable-knowledge writeback establishes relevant facts, updates their owners
and reconciles affected records without final whole-Change convergence or readiness.
At established final delivery or preparation/audit of closure, apply the
[Work model's closeout contract](work-model.md#evidence-and-closeout): verified facts,
necessary knowledge writeback, whole-Change convergence, consistency and required
Review. Doc owns writing; Review supplies separately required judgment. CLI success
alone establishes neither. Already-accurate records need no cosmetic rewrite.
Unavailable migration evidence blocks only dependent judgments and operations;
archive still requires current readiness. Commit independently assesses an authorized
checkpoint against its exact boundary and required evidence; an upgrade notice alone
is not a blanket Git prohibition.

Before terminal Change archive, require current `rsp ready <work-ref> --json` evidence
with `completionGate: pass` and `archiveReady: yes`. With archive authority, use
`rsp archive <work-ref>` and inspect the resulting archive/Focus transition.
Use the archive command's returned filename and the selected owner's archive
directory to inspect the actual artifact, full lifecycle diff and Focus outcome.
Guessing dates or names is unnecessary; incomplete output permits read-only
discovery, not mutation replay.
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
missing, failed or invalidated coverage and risk-justified additions. Changes to
the tested boundary or relevant inputs invalidate the affected evidence; explicit
execution, current-environment observations and required independent execution
remain binding. Report reused and newly executed evidence distinctly in existing
evidence owners; add no registry or fingerprint protocol.

Review independently judges its actual target and risks, reusing applicable test
evidence. Dispatch distinguishes that target from supporting references; inspecting
references does not expand the review. Mixed targets retain applicable Code and
Document judgments. Reports cover actual judgments and material limits; explicit
consumer formats retain canonical statuses, including skipped where required.
Findings establish defects or explicit requirement violations; insufficient evidence
limits coverage and blocks affected required judgments without erasing supported
findings. Declared drafts and narrower review scope do not require every unresolved
choice to be settled; ambiguity is actionable when it impairs the reviewed task or
safe use. Required verification and independent review are never waived.
Writeback/archive checks
final document consistency and current readiness
without invalidating unchanged code evidence. Commit establishes evidence for the
actual final index, including excluded worktree inputs; post-commit inspection
checks Git and hook effects instead of routinely repeating product tests.

Verify reports only its declared boundary. Exercised failed checks, unavailable
checks and supported passes remain distinct; none proves overall completion or
independence by itself. Execution, checks, review and acceptance claims remain
bounded by observed effects. Gaps limit affected claims without erasing supported
findings; missing Required evidence still prevents completion.

## Control boundaries

Core routes Direct work without durable preflight, Change work with one recoverable
acceptance/delivery boundary, and Group work for independently acceptable children
with dependencies or integration. Complexity, file count and worker count do not
select Group. Work shape is separate from agent topology.

Automatic delegation defaults off. Explicit worker requests and binding independent
worker obligations remain valid. With workflow.delegation: auto, the user or main
agent chooses zero, one or multiple workers; RSP defines no count tiers or maximum.
Hosts enforce resources; Core enforces ownership, dependencies and evidence.
Workers do not recursively delegate by default.

Ordinary completion and checkpoint commits keep Change open. A generic commit
request is a checkpoint unless final delivery is already established. Final delivery
or an explicit close request selects workflow.closeout: ask (default), auto or
manual. Ask prepares the concrete boundary before requesting closure; prior explicit
authority is reused. Auto closes only eligible final delivery; manual requires an
explicit close request. Refusal or manual policy can leave an authorized commit's
Change open. Neither setting grants Git or external authority.

Before closure establish facts and applicable evidence, write necessary knowledge,
then reconcile the Change. These dependencies may be one operation with no edits
when records are already accurate. Fill only missing or invalidated checks and
separately required review; semantic review need not repeat implementer tests.
Current readiness and exact lifecycle/Git observations remain fresh. Archive precedes
an authorized terminal commit when closure was selected. If commit fails after
archive, preserve and report the uncommitted lifecycle diff without automatic reopen.
Reopen remains explicit exceptional recovery.

Core selects capabilities from their contracts; executors load methods and inspect
sources. Core consults details for its own work or a concrete coordination question,
and validates actual results and required independence. Reuse observations while
inputs remain applicable. Dependent writes require successful prerequisites, with
individual required results observed. Inspect uncertain effects before safe replay;
named checks and protected delivery gates remain binding. Command batching and
script representation are execution choices, not additional workflow stages.

Coordination retains the goal and acceptance, passing bounded work to capabilities
and validating scope, diff, evidence, limits and actual authority. Core decides
whether to delegate and which dependency-ready work may run safely in parallel;
the Host supplies actual workers, isolated resources, waiting and cancellation.
Use host-observed attribution, liveness, writer boundaries and resource compatibility
as evidence, not a Skill handoff or worker self-report. Required delegation needs
an attributable worker-authored result; required independent acceptance additionally
needs a distinct worker from the accepted implementer.

For grouped or dependent work, dispatch only ready children in the first non-empty
`plan.waves` wave from current `rsp status --json`; never dispatch a child whose
prerequisite remains in `plan.blocked`. Recheck dependencies before another wave.
Independent ready tasks may run concurrently only with observed safe writer and
resource isolation. Shared files, generated artifacts, test runners, browsers,
providers or hardware remain sequential unless host and checkout evidence establish
safe isolation. Missing required attribution or independence leaves acceptance
incomplete; local fallback is allowed only when delegation is optional and
independence is not required.

## Boundaries

- WorkOwner and Group integration boundaries come from the Work model. A request-only
  integration boundary must be written back before closeout.
- Hosts own worker execution, environments, isolation, waiting, continuation,
  cancellation and resource lifecycle; RSP owns delegation and safe-concurrency
  eligibility. Evaluators/adapters own machine schemas and scoring.
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
