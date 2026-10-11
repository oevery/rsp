# Native Harbor task migration

The native catalog contains 18 tasks: the 16 migration tasks and a subsequent paired completion-assessment experiment. All 80 former case IDs and 168 project files were inspected before legacy removal on 2026-10-08. The disposition table records 15 migrated, 19 merged and 46 retired cases. Migrated means the main behavior has a native successor; merged means the stated portion is represented by a broader task; retired means no replacement acceptance is claimed.

## Native contract

Each task supplies task.toml, instruction.md, environment/Dockerfile, tests/test.sh and solution/solve.sh. Project fixtures live in environment/workspace; candidate Skills come exclusively from native Harbor injection. The rsp-eval-agent:2026-10-08 image supplies Node 24, Python 3, bash, Git, Codex and the locally packaged RSP CLI. There are no baked-in candidate Skills, legacy case schemas or runtime dependency downloads.

The workspace is /app. Its artifact includes .git for separate-verifier checks of history and staging. Task-specific checks preserve known user files and inspect Git state where required, without a per-file hash registry or universal path allowlist. Native coordination additionally retains real child-session traces; role-labelled text cannot substitute for workers.

Task tests/test.sh invokes /opt/rsp-eval/grade.py. It stages one shared Reward Kit criterion beside the task assertions, and the shared Python verifier executes those assertions in an isolated process. Check output is retained in /logs/verifier/check.log. Implement, actual-source recovery and exact-scope commit delivery use deterministic criteria. Semantic tasks add a native judge.toml with openai/AI-HUB/gpt-6.1-sol, high reasoning effort and binary criteria aggregated by threshold 1.0. Judge routing uses runtime RSP_JUDGE_BASE_URL, RSP_JUDGE_API_KEY and optional RSP_JUDGE_HOST. Credentials are not stored in task definitions.

## Representative coverage

| Task | Outcome |
| --- | --- |
| implement-checkout | Rounded line totals, discounted shipping and input preservation; alternative correct implementations |
| doc-export | Grounded README, domain context and exit/preservation contract |
| review-staged | Index-specific code/comment review while working source differs |
| verify-boundary | Exercised product failure versus unavailable external Required evidence |
| shape-cache | Executable bounded TTL design without product or lifecycle mutation |
| completion-boundary | Detect omitted settled expiry behavior despite completed Tasks and passing declared checks; read-only assessment |
| completion-boundary-control | Matched correct implementation accepted within its scope, without false findings or inferred delivery authority |
| commit-restraint | Passing checks do not override unrelated staging or read-only authority |
| commit-delivery | One real exact-scope commit preserving unrelated unstaged notes and an untracked draft |
| structural-audit | Reachable invoice bypass of the pricing owner and its production-test blind spot; capability-neutral selection supports Audit-to-Review comparison |
| structural-audit-control | Both public paths share pricing; reject invented structural defects and preserve coverage limits |
| commit-tracked-restraint | Direct Commit preserves unrelated staging and reports its selected grouped child identity |
| completion-group-control | Direct Review reports a grouped child logical WorkRef without confusing its Brief or file location |
| owner-decision | Unresolved price choice blocks implementation despite a passing old-snapshot check |
| workflow-catalog | Resume staged source, regenerate consumer output and converge one existing Change |
| recovery-export | Complete actual-module verification despite an absent optional helper |
| real-source-recovery | Actual issue normalization and path-containment modules, not prebuilt output |
| context-merge | Authorized context migration retaining meaning and navigation |
| release-evidence | Exact-candidate evidence interpretation and stale-composition restraint |
| finding-investigation | Accept/reject fixed findings without repair authority |
| native-coordination | Real implementation worker followed by a distinct review worker, integrated checks and preserved user work |

## Goal-driven task design

The migration revision retained its 16-task catalog. Three mixed-project scenarios reuse those native fixtures rather than duplicate them:

| Scenario | Native task | Concrete starting state and acceptance |
| --- | --- | --- |
| User symptom to diagnosis, repair and verification | [implement-checkout](tasks/implement-checkout/instruction.md) | Incorrect discounted totals and shipping; domain requirements remain in CONTEXT.md. The agent discovers the causes, repairs the two owning modules and preserves staged, unstaged and untracked user work. Deterministic checks accept alternative correct implementations. |
| Interrupted work to completion | [workflow-catalog](tasks/workflow-catalog/instruction.md) | Approved source is staged but storefront output is stale. The agent determines remaining work from the existing Change, completes generated output and verification records while preserving source bytes and the index. This is single-owner recovery, not interrupted multi-worker recovery. |
| Implementation followed by independent review closure | [native-coordination](tasks/native-coordination/instruction.md) | The checkout project is repaired by a real worker and reviewed by a distinct fresh worker. Native child traces support review/check execution and any required correction/review cycle; a parent summary alone is insufficient. |

These tasks carry the native mixed-project tag. Task instructions state objectives, authority and required acceptance; repository contracts supply business details. Single-Skill and mixed-Skill runs may reuse a task where its capability boundary supports both. A single-Skill injection does not establish mixed-workflow acceptance.

Semantic criteria have stable descriptive names rather than ordinal labels. Deterministic checks own product behavior and protected workspace state; judges assess meaning, evidence claims and independent-review provenance. Criteria remain binary and all must pass. Structured report outputs remain where the verifier consumes them; ordinary project completion uses native transcripts rather than an additional report schema.

Instructions no longer reveal the checkout repair, prescribe catalog build steps, disclose the staged-review defect or supply the delivery-readiness answer. Required commands and explicit authority remain where they form the task contract. The oracle solutions still establish only deterministic calibration; neither oracle nor nop can establish real worker execution or semantic judge quality. Earlier live outcomes below apply to earlier task wording and criteria, not acceptance of this revision.

The 2026-10-08 task-design revision passed the offline native schema check for all 16 tasks. Fresh temporary Git workspaces ran every oracle script and the actual isolated task verifier: 16 reference solutions passed and 16 untouched controls were rejected. The two checkout tasks additionally rejected changed acceptance files and undeclared source additions while allowing declared scratch/review output. These local fixture checks did not execute Docker, native workers or a semantic judge.

## Calibration and retained evidence

Use native oracle/nop agents through evaluate.py; see the [evaluation guide](README.md) for setup and execution authority:

~~~sh
RSP_EVAL_OFFLINE=1 uv run --project tests/skills python tests/skills/evaluate.py run --task commit-delivery --attempts 1 --agent oracle
RSP_EVAL_OFFLINE=1 uv run --project tests/skills python tests/skills/evaluate.py run --task commit-delivery --attempts 1 --agent nop
~~~

Oracle/nop calibrate reference solutions, negative controls and container behavior with semantic judging disabled. They do not establish model behavior or Skill quality. Historical baseline-preparation probes and retired custom-runner raw artifacts were removed on 2026-10-08. Retained historical summaries are not replayable evidence; native Harbor records listed below remain intact.

The following UTC run IDs locate private records under tests/skills/reports/. Live passes apply to the recorded candidate, task and model configuration. Regrade reassesses retained agent artifacts; it does not rerun the agent.

| Evidence | Retained run ID | Result and boundary |
| --- | --- | --- |
| Goal-driven task revision oracle | 2026-10-08T06-08-11.992415Z | All 16 revised tasks passed native Docker oracle calibration. Semantic judging was disabled; this is not live Skill acceptance. |
| Goal-driven task revision nop | 2026-10-08T06-16-21.419861Z | All 16 revised tasks rejected the native Docker no-op control with no infrastructure exceptions. |
| Final oracle calibration | 2026-10-08T02-12-35.364275Z | All 16 tasks passed; deterministic offline calibration, not 16 live acceptances. |
| Final nop calibration | 2026-10-08T02-17-21.315671Z | All 16 tasks scored 0 with no exceptions; completed negative-control calibration, not model acceptance. |
| Corrected-verifier nop controls | 2026-10-08T02-23-09.290643Z | Both audit and owner-decision no-op controls still scored 0 after removing unstated format constraints. |
| Single-Skill live implementation | 2026-10-08T02-08-15.552099Z | implement-checkout passed with the selected single Skill. |
| Repeated live implementation and actual-source recovery | 2026-10-08T01-54-52.275255Z | implement-checkout and real-source-recovery passed 3/3 each. This job's three earlier catalog results were 0.5 and are not accepted passes. |
| Mixed-workflow live catalog | 2026-10-08T02-07-00.989610Z | workflow-catalog passed 3/3 in the later run. |
| Document regrade | 2026-10-08T01-54-00Z | doc-export passed reassessment of retained live output. |
| Live delivery, audit and owner decision | 2026-10-08T02-18-03.864879Z | commit-delivery scored 1. Audit and owner-decision each scored 0.5: semantic criteria passed, but programmatic checks rejected valid report representations. These original outcomes remain retained. |
| Corrected-grader reassessment | 2026-10-08T02-24-00Z | All three retained live executions scored 1 with no exceptions after removing unstated format constraints: audit coverage may be an object and owner-decision scope may use a natural-language explanation. This is grader correction and reassessment, not new agent execution or model improvement. |
| Native coordination regrade | 2026-10-08T01-56-00Z | Passed with two distinct retained child traces from live implementation and review. The original verifier incorrectly required optional review.md; the corrected verifier accepted the retained evidence. |
| Recovery preservation | 2026-10-08T02-00-39.336452Z | Corrected sibling recovery backup survived native resume; backup retained at the sibling .attempts/2026-10-08T02-01-24.115301Z path. This is recovery-infrastructure evidence. |
| Cancellation | 2026-10-08T02-02-23.946156Z | The cancellation probe retained CancelledError rather than a task pass. This establishes cancellation handling, not Skill acceptance. |

The migration's oracle and nop calibration are complete for its 16 tasks. Those runs predate the two completion-assessment tasks and do not establish their calibration or behavior; their evidence belongs to the [follow-up research](../../research/reports/2026-10-08T08-07-58Z.md). The migrated set does not yet have live acceptance for all 16 tasks; the additional three passing reassessments apply only to their retained executions under the corrected grader. The actual-source fixture covers two production-module boundaries, not full CLI/release acceptance. A correct final report alone cannot prove command execution; use retained host traces where execution attribution matters.

Hook-attempt and checkpoint-specific behavior, archive lifecycle, interrupted multi-worker recovery, unavailable worker acceptance, full CLI packaging, upstream research, Skill authoring and detailed language/trigger cases remain uncovered where the table marks them retired. Historical results are not promoted to current acceptance, and no calibration or live result grants release/publication approval.

## Old case disposition

Counts: 15 migrated, 19 merged, 46 retired.

| Old case ID | Disposition | Native task | Scope or gap |
| --- | --- | --- | --- |
| preserve-user-files | migrated | [implement-checkout](tasks/implement-checkout/instruction.md) | Observable rounding and discounted-shipping implementation replaces the minimal boolean toggle. |
| rsp-owner-decision | merged | [owner-decision](tasks/owner-decision/instruction.md) | Same-owner continuation stops at a concrete unresolved product choice without inventing approval. |
| audit-divergent-production-owner | migrated | [structural-audit](tasks/structural-audit/instruction.md) | Trace both public entrypoints to a reachable pricing-owner bypass, user consequence and owner-only test blind spot; no product repair. |
| release-draft-net-behavior | retired | — | Release-note composition and release-document review require their own delivered-range fixture; evidence assessment alone is narrower. |
| release-draft-missing-evidence | retired | — | Release-note composition and release-document review require their own delivered-range fixture; evidence assessment alone is narrower. |
| release-review-grounded | retired | — | Release-note composition and release-document review require their own delivered-range fixture; evidence assessment alone is narrower. |
| shape-expiry-contract | merged | [shape-cache](tasks/shape-cache/instruction.md) | TTL design and decisive checks retained; CLI-created Change/focus mutation is intentionally not covered. |
| verify-checkout-boundary | merged | [verify-boundary](tasks/verify-boundary/instruction.md) | Declared-check evidence boundary retained; this representative task adds mixed failure/unavailability. |
| archive-final-convergence | retired | — | Archive lifecycle and command-owned closeout are not exercised by standalone native fixtures. |
| archive-reuse-verification | retired | — | Archive lifecycle and command-owned closeout are not exercised by standalone native fixtures. |
| archive-required-failure | retired | — | Archive lifecycle and command-owned closeout are not exercised by standalone native fixtures. |
| commit-checkpoint-open | retired | — | Open-Change checkpoint claims and incomplete external acceptance need separate coverage beyond direct successful delivery. |
| commit-dirty-success | migrated | [commit-delivery](tasks/commit-delivery/instruction.md) | Real exact-scope commit, parent and committed bytes checked; authorized source is staged and unrelated notes/draft remain outside delivery. |
| commit-excluded-input-evidence | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| commit-hook-failure | retired | — | Hook attempt, one-shot recovery and stored-message mismatch are not equivalent to readiness restraint. |
| commit-hook-message-mismatch | retired | — | Hook attempt, one-shot recovery and stored-message mismatch are not equivalent to readiness restraint. |
| commit-message-advice | retired | — | Message-advice formatting and project-policy variations are outside the representative readiness task. |
| commit-message-project-policy | retired | — | Message-advice formatting and project-policy variations are outside the representative readiness task. |
| core-missing-commit | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| commit-missing-verification | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| commit-native-equivalence | merged | [commit-delivery](tasks/commit-delivery/instruction.md) | Native Git success and immutable delivery result are covered; the prepared message-file method supplies one representative delivery path. |
| commit-reuse-verification | retired | — | The new delivery task runs fresh checks; reusable historical evidence eligibility is not exercised. |
| commit-snapshot-refusal | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| commit-stale-tree | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| commit-unsafe-staged | migrated | [commit-restraint](tasks/commit-restraint/instruction.md) | Read-only exact-scope readiness rejects unrelated cached work. |
| config-inherited-artifact-language | retired | — | Artifact-language inheritance and tiny-edit routing need dedicated controls beyond grounded document writing. |
| config-rejected-closeout-policy | retired | — | Specialized candidate/evidence/configuration gates are not covered by unrelated-index refusal. |
| context-conflicting-owners | retired | — | Read-only legacy navigation and conflicting terminology ownership are distinct from authorized migration. |
| context-authorized-merge | migrated | [context-merge](tasks/context-merge/instruction.md) | Authorized document migration retains vocabulary, UTC and navigation. |
| context-legacy-readonly | retired | — | Read-only legacy navigation and conflicting terminology ownership are distinct from authorized migration. |
| doc-review-grounded | merged | [finding-investigation](tasks/finding-investigation/instruction.md) | Read-only evidence-backed documentation judgment and repair restraint use fixed findings. |
| doc-review-only | merged | [finding-investigation](tasks/finding-investigation/instruction.md) | Read-only evidence-backed documentation judgment and repair restraint use fixed findings. |
| doc-local-wording-only | retired | — | Artifact-language inheritance and tiny-edit routing need dedicated controls beyond grounded document writing. |
| doc-write-grounded | migrated | [doc-export](tasks/doc-export/instruction.md) | Grounded multi-document writing with executable command and preservation semantics. |
| maintainer-author-revise | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| maintainer-concision-attribution | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| maintainer-distill-retained | retired | — | Retained upstream acquisition/distillation/provenance workflows are outside this bounded native set. |
| maintainer-explore-retained | retired | — | Retained upstream acquisition/distillation/provenance workflows are outside this bounded native set. |
| maintainer-release-evidence | migrated | [release-evidence](tasks/release-evidence/instruction.md) | Synthetic exact-candidate interpretation keeps historical model evidence distinct from current acceptance. |
| maintainer-topic-retained | retired | — | Retained upstream acquisition/distillation/provenance workflows are outside this bounded native set. |
| verify-mixed-failure-unavailable | migrated | [verify-boundary](tasks/verify-boundary/instruction.md) | Separate failure and unavailable Required evidence; no acceptance inference. |
| core-historical-preview-boundary | retired | — | Specialized prior-scope and historical-preview distinctions are not asserted by mixed current-check outcomes. |
| method-required-check-unavailable | merged | [verify-boundary](tasks/verify-boundary/instruction.md) | Declared-check evidence boundary retained; this representative task adds mixed failure/unavailability. |
| verify-prior-scope-gap | retired | — | Specialized prior-scope and historical-preview distinctions are not asserted by mixed current-check outcomes. |
| native-checkout-blocked | merged | [owner-decision](tasks/owner-decision/instruction.md) | Pre-mutation owner-decision gate is retained; this row does not claim worker-dispatch or multi-worker acceptance. |
| native-checkout-completion | migrated | [native-coordination](tasks/native-coordination/instruction.md) | Real implementation and fresh review workers, two retained child traces, preserved user work and integrated verification; corrected-verifier regrade passed. |
| native-resume-staged | retired | — | Successful two-worker coordination does not establish interrupted worker recovery with pre-existing staged implementation. |
| native-verification-unavailable | retired | — | The successful coordination task does not exercise unavailable independent-worker acceptance or external tax evidence. |
| real-cli-contract | retired | — | Full built CLI routing/help/version acceptance is not established by extracted production-module tests. |
| real-cli-review | retired | — | Full built CLI routing/help/version acceptance is not established by extracted production-module tests. |
| real-issue-duplicate-fix | merged | [real-source-recovery](tasks/real-source-recovery/instruction.md) | Normalized duplicate issue regression is included with parent-containment recovery. |
| real-multimodule-recovery | migrated | [real-source-recovery](tasks/real-source-recovery/instruction.md) | Two actual production modules, intentional defects and source-level positive/negative checks. |
| finding-investigation-only | migrated | [finding-investigation](tasks/finding-investigation/instruction.md) | Fixed findings are accepted/rejected without inferring repair permission. |
| implement-interrupted-verification | migrated | [recovery-export](tasks/recovery-export/instruction.md) | Existing implementation survives missing optional helper; actual-module evidence completes the same owner. |
| review-preserve-staged-work | migrated | [review-staged](tasks/review-staged/instruction.md) | Staged review preserves a deliberately different working version and user index. |
| doc-agent-navigation | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| skill-author-create | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| skill-author-critique | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| skill-author-document-only | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| skill-author-revise | retired | — | Skill package authoring, agent-document triggers and attribution require maintained native authoring fixtures; no legacy schema or package checker is retained. |
| implement-review-only | merged | [review-staged](tasks/review-staged/instruction.md) | Read-only review ownership and concrete code/comment defect are covered by the staged task. |
| review-near-intent | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-commit | merged | [commit-restraint](tasks/commit-restraint/instruction.md) | Read-only readiness authority is exercised with a concrete unsafe index rather than empty context. |
| trigger-rsp-design | merged | [shape-cache](tasks/shape-cache/instruction.md) | TTL design and decisive checks retained; CLI-created Change/focus mutation is intentionally not covered. |
| trigger-rsp-diagnose | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-manage | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| rsp-near-intent | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-resolve-findings | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-review | merged | [review-staged](tasks/review-staged/instruction.md) | Read-only review ownership and concrete code/comment defect are covered by the staged task. |
| trigger-rsp-shape | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-structural-audit | merged | [structural-audit](tasks/structural-audit/instruction.md) | Concrete report-only source audit replaces the empty-checkout trigger; empty-input trigger discrimination is not separately accepted. |
| trigger-rsp-tdd | retired | — | Empty-checkout trigger or trivial near-intent probes are replaced by representative substantive tasks; exact trigger discrimination is not claimed. |
| trigger-rsp-verify | merged | [verify-boundary](tasks/verify-boundary/instruction.md) | Declared-check evidence boundary retained; this representative task adds mixed failure/unavailability. |
| catalog-completion | merged | [workflow-catalog](tasks/workflow-catalog/instruction.md) | Source-to-consumer completion and truthful owner writeback retained in interrupted staged variant. |
| catalog-owner-decision | migrated | [owner-decision](tasks/owner-decision/instruction.md) | Material price remains unresolved despite a passing current-snapshot check; ask the owner and preserve product/work state. |
| catalog-resume-staged | migrated | [workflow-catalog](tasks/workflow-catalog/instruction.md) | Resumes an already-staged source change, generates consumer output and updates one existing owner. |
| implement-ready-workflow | merged | [recovery-export](tasks/recovery-export/instruction.md) | Safe method replacement and continuation retained; source mutation itself is covered by Implement. |
| review-dirty-workflow | merged | [review-staged](tasks/review-staged/instruction.md) | Read-only review ownership and concrete code/comment defect are covered by the staged task. |
| rsp-resume-existing | merged | [recovery-export](tasks/recovery-export/instruction.md) | Safe method replacement and continuation retained; source mutation itself is covered by Implement. |
