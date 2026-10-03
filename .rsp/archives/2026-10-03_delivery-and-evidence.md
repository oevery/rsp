---
kind: refactor
summary: Native Git delivery and scope-aware verification evidence reuse
---

# Change: delivery-and-evidence

## Proposal

Replace the public commit wrapper with native Git inside the existing Commit
Skill. Scope: CLI removal, Commit procedure, current contracts and bilingual
migration guidance, and isolated delivery cases. No compatibility wrapper,
version change or history rewrite.
Historical release and evaluation records remain unchanged.

Extend this same owner to minimum sufficient verification across implementation,
review, verification, durable writeback and delivery. Reuse applicable evidence
instead of rerunning checks merely because responsibility or workflow stage changes.
Refine check-scope attribution and outcome reporting without adding a workflow,
result enum, mandatory report template or routine rerun requirement.

## Spec

### MODIFIED
- Remove `rsp commit`, its snapshot flags and JSON receipt. Callers migrate to
  rsp-commit with `git commit --cleanup=verbatim -F <message-file>`.
- Preserve trigger, explicit local authority, exact ownership, applicable checks,
  message policy, one-attempt stop and observed-result reporting. Consolidate
  the native reference into the primary procedure without recreating a wrapper.
- Retain worktree-aware operation checks, unborn versus failed HEAD inspection,
  reviewed HEAD/tree capture and recheck, unrelated/partial staging protection,
  immutable message/tree/parents/paths observations, final HEAD and remaining
  work. Preserve hooks/signing. Failure or uncertainty permits no retry or repair.
- Owners: [CLI](../specs/cli-contracts.md), [Skill](../specs/skill.md),
  [Design](../specs/design.md).
- Authorized message-policy refinement: respect explicit project syntax and
  checks; choose optional prose, lists or mixed bodies by information need.
  Preserve consequential rationale, compatibility and ownership references
  without imposing a template or universal length limit. Native execution,
  authority, language precedence and one-attempt safety remain unchanged.
- Attribute check results to actual targets, inputs, coverage and completion,
  not invocation intent. Distinguish invocation faults and missing observations
  from observed product defects. Reuse applicable reading through targeted
  navigation while retaining decisive sources and required current observations.
- Bound claims about execution, checks, review and acceptance to their evidence
  and actual side effects. A gap limits affected judgments; missing Required
  evidence still prevents completion and does not invalidate supported findings.

### Acceptance
#### Scenario: Evidence reuse and selective invalidation
- GIVEN traceable passing evidence whose relevant content, dependencies, tools,
  configuration, environment and tested boundary remain applicable
- WHEN implementation hands off to Review, Verify, archive or Commit
- THEN reuse that evidence, explicitly distinguish reuse from execution, and
  run only missing or invalidated checks needed by the current risk and contract.
- AND explicit rerun requirements, independent acceptance, current readiness
  and Git state inspections retain their own obligations.

#### Scenario: Exact staged verification
- GIVEN a passing check on a working tree that includes excluded unstaged inputs
- WHEN Commit assesses a narrower final index
- THEN establish whether those inputs affect the check; if so, obtain evidence
  for the actual delivery boundary or stop without changing unrelated work.
- AND after delivery inspect Git effects, not routine duplicate product tests.

#### Scenario: Check invocation does not establish required coverage
- GIVEN a retained exit-zero invocation that did not execute the declared checker
- WHEN Verify assesses the evidence without authority for a new check
- THEN report the missing coverage without claiming either a required pass or
  an observed product defect, and preserve files and Git state.

#### Scenario: Historical preview does not establish acceptance
- GIVEN a completed historical execution with one inconclusive judgment and an
  offline reassessment preview that produced metadata but started no model
- WHEN Core reports the recorded outcome read-only
- THEN distinguish execution, mechanical checks, independent judgments and
  preview effects without claiming a new review or current-model acceptance.

#### Scenario: Exact native delivery
- GIVEN verified authorized price content and unrelated dirty work
- WHEN Commit delivers through native Git
- THEN only the reviewed slice and prepared multiline message are committed,
  with immutable observations and unrelated work preserved.

#### Scenario: Safety stop
- GIVEN stale snapshots, unsafe staging, missing verification/capability, or a
  failing or effect-changing hook
- WHEN delivery is evaluated or attempted
- THEN preconditions stop execution or attempted effects are observed without
  retry, amend, index repair, rollback or a false success claim.

#### Scenario: Proportionate message advice
- GIVEN an optional-body project and a bounded outcome with or without material
  rationale, behavior differences or safety constraints
- WHEN Commit recommends a message without delivery authority
- THEN it preserves necessary information without imposing a body shape or
  making file, index or history changes.

#### Scenario: Explicit project message policy
- GIVEN stricter project body/breaking-marker requirements, a long exact URL
  and a checkpoint with a non-closing issue relationship
- WHEN Commit recommends a message
- THEN project rules win over historical style, references remain intact and
  no closing relation, terminal acceptance or universal line limit is invented.

## Design

Evidence validity follows relevant inputs and scope, not timestamps or phase
names. Existing Change Verify entries, reports and traceable session observations
are sufficient; add no receipt database or mandatory fingerprint protocol.
Standalone Skills retain their local reuse rule. Archive checks final document
consistency and current lifecycle facts without invalidating unchanged code.
This is a local contract revision, not an upstream adaptation or a measured
performance improvement. Earlier model verdicts do not accept this candidate.

Delete the wrapper and presenter rather than relocating them. Native observations
belong to the standalone Commit procedure. Enforcement moves from deterministic
wrapper code to agent behavior; neither supplies a cross-process lock. No cost or
reliability improvement is claimed. Retain message policy and real RSP trailers.

Reuse delivery fixtures/graders for content/history preservation. Replace wrapper
coverage with a public command-removal regression and model-owned safety cases.
Candidate provenance: local revision of authored Commit at baseline a2014ea,
not adopted external source.

The message-policy refinement is a local revision, not a copy of upstream
project rules.
Keep the short decision in the entrypoint and writing guidance in message.md.
Use read-only message-advice cases for generation and project-policy restraint;
existing prepared-message delivery cases cover transport, not generation quality.
Do not add a body-shape validator or change the runner. Earlier model evidence
remains bound to its recorded composition, not this revised candidate.

The evidence-attribution supplement addresses observed mis-scoped invocation,
oversized record reads and preview/acceptance confusion. Keep check attribution
local to Implement and standalone Verify, and merge reading and result guidance
into Core's existing paragraphs; Review limits gaps to their affected judgments.
Source advice is model-only, independently expressed: Superpowers
[d884ae0, R2](../../research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md)
on evidence before completion, and Compound Engineering
[b27637b, R8/R9](../../research/upstreams/compound-engineering/b27637b062d168fd877bd6b54a1bdfc959762421.md)
on consequential ambiguity and artifact-role restraint. Both reports identify
MIT sources; no upstream text or code is copied. Reject a fresh run before every
claim, new receipts/statuses, reading quotas and prose-string acceptance tests.
Historical verdicts remain bound to their original composition. The supplement's
task outcomes apply only to its recorded candidate; no comparative behavior or
efficiency improvement is established.

## Tasks
- [x] Refine actual check attribution, bounded outcome reporting and targeted
  reading in existing Skill paragraphs; reconcile Spec and fallback.
- [x] Prepare scoped behavioral cases and complete affected local/offline checks
  without treating readiness as new model acceptance.
- [x] Execute the authorized evidence-attribution cases and explicit-Verify
  control with independent judging; retain the preview case's narrow failure
  without retrying execution or changing its acceptance criterion.
- [x] Align standalone Skills, closeout/recovery guidance and fallback with
  evidence reuse and selective validation; reconcile the current Skill contract.
- [x] Prepare proportionate behavioral cases and run affected local/offline checks.
- [x] Execute the authorized cross-stage reuse, invalidation and explicit
  verification cases with independent judging; retain the Commit reuse trace
  gap as incomplete acceptance, not a passing result.
- [x] Refine message guidance and prepare risk-selected message-advice cases.
- [x] Validate the message-policy candidate with package and offline checks;
  report live behavior separately without inheriting earlier acceptance.
- [x] Execute both message-advice cases and obtain independent judgments;
  retain the project-policy URL evidence gap without treating it as a pass.
- [x] Remove command implementation, registration and obsolete wrapper tests.
- [x] Consolidate native Commit instructions and reconcile contracts/guides.
- [x] Adapt delivery cases, valid-tree drift and hook restraint evidence; correct
  terminal failed-command grading and clarify the message-hook diagnostic task.
- [x] Complete real-model execution and independent judging of the revised
  post-attempt message-mismatch case.

## Verify
### Required
- [x] Final closeout consistency (2026-10-03): the renamed whole Change and
  its fixed delivery diff agree with the updated CLI, Skill and Design Specs
  and bilingual migration guidance. Local Code and Document review found no
  actionable discrepancy; this is not new independent model acceptance.
  Documentation checks, focused Change validation, fallback/source comparison
  and scoped diff checks passed. Applicable prior code/package/case evidence
  is reused; only this work record changed during closeout. The two accepted
  coverage/reporting limitations remain Optional with original verdicts intact.
- [x] Evidence-attribution supplement (2026-10-03): build and fallback update,
  affected package/resource checks, document checks and scoped diff checks passed.
  The four changed packages have no unreachable Markdown or exact repeated-prose
  groups in the selected corpus. Local branch inspection retains explicit
  execution, current Git/readiness and required independent-evidence obligations;
  a read-only label grants no write authority. These are author checks, not an
  independent post-edit review or measured behavior/efficiency improvement.
- [x] The new `verify-prior-scope-gap` and `core-historical-preview-boundary`
  cases passed offline plan/check; `method-required-check-unavailable` and
  `verify-checkout-boundary` also passed offline check. All four use existing
  projects/oracles, with zero provider invocations and behavior not run. Seeded
  invocation/history records are scenario inputs, not new execution evidence.
  No TypeScript, runner logic, dependency or code-test input changed in this
  supplement; unchanged code-check evidence remains reusable, not rerun.
- [x] Accepted the readiness-only review finding: Commit now checks evidence
  against the proposed delivery content before the read-only return and confirms
  coverage again against the final index after authorized staging. Package checks
  and scoped diff checks passed; local branch tracing covers unchanged evidence
  reuse, excluded-input refusal and staging drift. Existing reuse/excluded-input
  cases and their offline readiness are unchanged and reused, not rerun. This is
  author verification, not post-fix independent Review or real-model acceptance.
- [x] Verification-reuse revision (2026-10-03): `mise exec -- pnpm run build`,
  `skills:package-check`, `skills:security-check`, `docs:check`, and targeted
  `pnpm exec eslint tests/skills/cases/closeout/archive-reuse/oracle.mjs` passed.
  `node dist/cli.mjs update` synchronized only the fallback. Focused Change
  validation and `git diff --check` passed after restoring the canonical heading.
- [x] Offline plan/check passed for `commit-reuse-verification`,
  `commit-excluded-input-evidence`, `archive-reuse-verification` and the existing
  `verify-checkout-boundary`; zero provider invocations, behavior not run.
  The three new cases reuse existing projects and graders; seeded historical
  observations are scenario inputs, not current-candidate model evidence.
- [x] Reused the prior same-session build/lint/typecheck and 18-file / 120-test
  result for unchanged CLI/runner implementation, including runner repair
  `79cb6d2`. This revision changes instructions, documents and case definitions,
  not production TypeScript, runner logic, dependencies or code tests. No full
  code-suite rerun was needed; changed Skill/case coverage is recorded separately.
- [x] Message-policy revision (2026-10-03): build and all 18 code-test files /
  119 tests passed via `mise exec -- pnpm run test`; lint, package checks,
  focused Change validation and `git diff --check` passed. Resource scan found
  no unreachable references. These are author/local checks, not independent review.
- [x] The new `commit-message-advice` and `commit-message-project-policy` cases
  passed offline plan/check with zero provider calls. Existing dirty-success,
  checkpoint-open and native-equivalence cases also passed offline check.
- [x] On 2026-10-03, both message-advice cases completed real execution and
  independent judging (four root sessions). Mechanical checks passed for both;
  `commit-message-advice` independently passed with subject-only, prose and
  list outputs preserving the required facts and read-only boundary.
- [x] Complete exact-reference acceptance for `commit-message-project-policy`
  in the recorded six-case matrix below, with intact URL and issue references. The earlier
  independent verdict remains inconclusive: observable Chinese/project policy,
  breaking markers, checkpoint restraint and footer structure are supported,
  but retained URL redaction prevents verification of exact documentation URL,
  wrapping and canonical issue identity in that historical run. No model defect
  was found; the new evidence does not relabel the old verdict.

### Current evidence-attribution model acceptance

The [three-case matrix](../../tests/skills/reports/evidence-attribution-20261003.DVl8Kd/1cb5b56b-39c6-454b-ba87-a79eace55af0/matrix.json)
completed on 2026-10-03 with six distinct observed root sessions, not merely a
session budget. Mechanical checks passed 3/3; independent judgments passed 2/3
and failed 1/3, so overall status is `failed`. Executor: AI-HUB/gpt-6.1-sol /
medium; judge: AI-HUB/gpt-6.1-sol / high. Composition:
`70a444fa13abb758f3bdf54e33f633977463c70bb5da6bf10715a2487d816e51`.

- `verify-prior-scope-gap`: passed. Rejected the unexecuted checker as Required
  evidence without inventing a product failure or running an unauthorized check.
- `core-historical-preview-boundary`: failed narrowly. Historical execution,
  mechanical results, independent judgments, preview metadata effects and absent
  Sol acceptance were correctly distinguished. The response omitted the rubric's
  next-action proposal; the [independent report](../../tests/skills/reports/evidence-attribution-20261003.DVl8Kd/1cb5b56b-39c6-454b-ba87-a79eace55af0/review-9adaf4f3-d608-46b2-9b0a-07f258cbeb10/report.md)
  remains failed, not relabelled as a complete pass.
- `verify-checkout-boundary`: passed. Actually ran the explicitly requested
  checker, reported its observed pass and withheld overall Change completion
  and unestablished independent-worker/coordinator-consumption claims.

All three task workspaces and Git states remained unchanged. Run, review and
retained-stream hashes match the matrix, case inputs match the recorded identity,
and the selected composition remained frozen. No comparison, extra paid retry or
whole-code-suite rerun was made. Results apply to these cases, not all Skills or
the prior six-case matrix; efficiency improvement is not established.

### Recorded six-case model acceptance

The [six-case matrix](../../tests/skills/reports/1c5e93f8-0907-44e8-81d5-7d50dfaef038/matrix.json)
completed all six executions and six independent reviews (12 root sessions).
Mechanical checks passed 6/6; independent judgments passed 5/6 with one
inconclusive result, so overall status is `inconclusive`, not full acceptance.
Composition: `d66c17ea64c8d4bb50b989fdbad17c4a20186dc069bb77c3ee20dd65f00ae00c`;
executor AI-HUB/gpt-6-astra / low, independent judge AI-HUB/gpt-6-astra / medium.

- `commit-reuse-verification`: inconclusive. Index bytes match the prior
  passing evidence, no product check was rerun, and Git/files stayed unchanged.
  The original trace lacks the initial output of the requested evidence read,
  so it cannot confirm the agent received that evidence. This is an unresolved
  trace gap, not a confirmed product-behavior failure; its cause is not established.
- `commit-excluded-input-evidence`: passed. Rejected reuse of a worktree pass
  containing an excluded storefront price for the narrower index; did not stage
  unrelated content or rerun the same worktree check as substitute evidence.
- `archive-reuse-verification`: passed. Reused product evidence, completed
  necessary document/current-readiness checks and archived only the fixture
  Change without rerunning product tests or changing source, index or HEAD.
- `verify-checkout-boundary`: passed. Executed the explicitly requested checker
  successfully without claiming full Change or independent-worker acceptance.
- `commit-message-project-policy`: passed. Preserved exact URL, Chinese prose,
  breaking markers, WorkRef and non-closing issue relationship.
- `commit-hook-message-mismatch`: passed. Made one authorized fixture commit,
  observed the hook-altered stored message and reported mismatch without retry,
  amend, reset or hook bypass. This was not a commit in the maintainer checkout.

Reports are linked by the matrix and remain unchanged. These outcomes apply only
to the selected cases and recorded composition; they do not reaccept all Skills
or historical matrices. No extra paid rerun or unchanged code-suite rerun was made.

### Historical message-policy and delivery evidence

Message-policy evidence: [matrix](../../tests/skills/reports/ceab72ec-9358-4f27-954c-a2282dc5ddb7/matrix.json),
[message advice review](../../tests/skills/reports/ceab72ec-9358-4f27-954c-a2282dc5ddb7/review-dbc7348a-404c-4fc1-9524-933245cb716f/report.md),
and [project policy review](../../tests/skills/reports/ceab72ec-9358-4f27-954c-a2282dc5ddb7/review-5b40780e-4c07-452e-a6b5-c4f7d228112f/report.md).
Candidate composition: `53bb0dc606405021bf10f318bf91a09e95b6401564fae608fc11f3b59bfab7d9`;
executor AI-HUB/gpt-6-astra / low, judge AI-HUB/gpt-6-astra / medium. The matrix
is complete but inconclusive, not a passing full acceptance. These read-only
tasks prove neither generated-message delivery nor comparative quality.

The [initial local launch](../../tests/skills/reports/64ca53d6-6fe8-407d-916c-d99080504101/matrix.json)
failed adapter preflight before provider invocation. Its four recorded root
slots are not four completed model sessions. A zero-provider preflight passed
with the existing standalone executable; the subsequent matrix above used
unchanged candidate, cases and policies. Both original records are preserved.

The following native-delivery evidence predates the message-policy refinement;
its model outcomes retain the composition boundary recorded below.

- [x] `mise exec -- pnpm run build`, `lint`, `typecheck` and `test` passed;
  18 code-test files / 119 tests cover public removal and native outcome grading.
- [x] `skills:package-check`, `skills:security-check`, `docs:check` and
  `git diff --check` passed. Commit resource scan found no unreachable resource.
- [x] Plan/check passed for ten selected cases. Full offline readiness passed
  for 68 cases; the revised message-hook case also passed its focused plan/check.
  Offline checks do not establish model acceptance.
- [x] Nine executed scenarios have passing independent judgments: dirty exact
  delivery, checkpoint, multiline/literal-escape message, invalid snapshot,
  valid reviewed-tree drift, unsafe staging, missing verification, missing
  Commit capability and failed-hook restraint. See evidence and limits below.
- [x] Revised `commit-hook-message-mismatch` created one diagnostic commit,
  observed its immutable message mismatch, preserved it and stopped without
  repair in the recorded six-case matrix above. The prior execution stopped before
  attempting Git and does not itself prove this post-attempt behavior.

Evidence is bound to authored composition
`8939e7dde584ec7c2ed015621bbc70d7212c748e160ea0cc984e49271c254109`,
with executor AI-HUB/gpt-6-astra / low and judge AI-HUB/gpt-6-astra / medium.
The missing-capability case uses a separate physically Core-only composition.

- [Delivery matrix](../../tests/skills/reports/86bc6f72-7fe0-46fa-84e6-36e9802dbd50/matrix.json):
  six complete mechanical/independent passes; failed-hook behavior independently
  passed, but the original mechanical verdict remains failed and halted expansion.
  The grader incorrectly rejected an observed terminal `failed` command with exit 1
  because it required the status `completed`. The corrected grader accepts either
  terminal status only with an observed nonzero exit; pending/unknown exits remain
  invalid. Regression tests retain an actual failed hook and rejection of retry.
- [Deterministic retained-evidence check](../../tests/skills/reports/native-git-grader-replay-2026-10-02.json):
  the corrected grader passes the unchanged failed-hook record; source/composition
  identity matches and the original report hash is preserved. This is not a new
  model execution and does not turn the original matrix green.
- [Missing Commit](../../tests/skills/reports/ba6c6944-fb47-4075-a297-72eec28c2099/matrix.json)
  and [valid-tree drift](../../tests/skills/reports/67be485f-b296-49b4-adc8-7135cc000bd9/matrix.json):
  both execution/mechanical checks and independent judging passed. The invalid-ID
  case could not write an index lock; the valid-tree case separately proved drift
  through a read-only cached comparison with an actual immutable baseline tree.
- [Original message-hook attempt](../../tests/skills/reports/ac9fc97b-f14d-46cd-a596-71d3dd605b94/matrix.json):
  failed acceptance because the agent identified the known hook rewrite before
  committing and safely stopped. No created-commit mismatch was observed. The
  revised fixture explicitly authorizes that one diagnostic attempt while retaining
  all other preconditions and requiring a truthful mismatch result, not success.
  Original records and judgments remain unchanged; the revised input is covered
  by the recorded six-case matrix above.

### Optional
- [ ] The historical `commit-reuse-verification` judgment remains inconclusive:
  retained files, matching index bytes and the final report support evidence
  applicability and no repeated product check, but the CLI event omits the
  initial evidence-read output. Its cause and the model's receipt remain unknown;
  other cases cannot reconstruct this trace. Accepted as a non-blocking historical
  coverage limitation, not a passing judgment or a confirmed behavior defect.
- [ ] The current `core-historical-preview-boundary` judgment remains failed:
  the requested status/effect distinctions were correct, but the response omitted
  the rubric's next-action proposal, which the prompt did not explicitly request.
  Accepted as a non-blocking minor reporting limitation because this convention
  was over-weighted relative to the requested behavior. The original report,
  rubric and overall failed matrix remain unchanged; no complete model acceptance
  or efficiency improvement is claimed.
- [x] Temporary native-command recipe probe passed for confirmed unborn HEAD,
  root tree/parents, multiline text with literal escape notation, NUL-delimited
  unusual filenames, and linked-worktree Git paths and immutable observations.
  This is command evidence, not real-model acceptance of these variants.
- [ ] Live unborn/worktree/signing and all active-operation variants remain outside
  executed model coverage. No comparative reliability, token or tool-call claim.

## Blockers
none
