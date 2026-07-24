---
title: Archive Index
summary: Completed RSP changes.
kind: generated-index
index_type: archives
source_dir: .rsp/archives
entry_count: 72
---

# Archive Index

| Date | Change | Kind | Summary |
|------|--------|------|---------|
| 2026-05-27 | fix-npx-package-bin | fix | Ensure `bin/rsp.mjs` is shipped with executable permissions. |
| 2026-05-27 | metadata-generated-indexes | feature | Use lightweight frontmatter metadata for generated INDEX.md files |
| 2026-05-27 | rsp-roadmap-agent-readiness | feature | Improve RSP agent readiness and archive guidance |
| 2026-07-18 | fallback-protocol-path | refactor | Introduce the target fallback protocol path and project-instruction ownership |
| 2026-07-18 | peripheral-domain-architecture | docs | Define peripheral domain contexts, capability boundaries, and repository directory ownership |
| 2026-07-18 | rsp-workspace-core-model | docs | Define the RSP Workspace core model and one-level Change Groups |
| 2026-07-18 | skill-metadata-conformance | fix | Make the published RSP skill conform to Agent Skills metadata and version independently |
| 2026-07-18 | upstream-distillation-hardening | fix | Close integrity and usability gaps in the upstream distillation workflow |
| 2026-07-18 | upstream-source-registry | feature | Add reproducible upstream source caching and review workflow |
| 2026-07-19 | change-groups | feature | Add shallow Change Groups as the only composite work shape |
| 2026-07-19 | decision-record-ownership | feature | Add one authoritative Decision Record path and separate lasting rationale from durable current facts |
| 2026-07-19 | external-coordination-boundary | docs | Keep external coordination outside the RSP product |
| 2026-07-19 | typed-work-ref | refactor | Introduce a typed WorkRef before Change Groups |
| 2026-07-20 | derive-change-dependency-plan | feature | Derive a deterministic dependency plan from explicit Change blockers |
| 2026-07-20 | group-navigation-ux | feature | Make Group Briefs sort first and derive the next executable slice from Brief order |
| 2026-07-20 | promote-rsp-review-skill | feature | Promote the qualified `rsp-review` candidate into the published, host-neutral Skill surface. |
| 2026-07-20 | review-eval-user-provider-default | fix | Use the user's configured model provider by default in rsp-review evaluation |
| 2026-07-20 | rsp-review-candidate-revision | research | Revise the research-only rsp-review candidate for restraint, document completeness, and lower context cost |
| 2026-07-20 | rsp-review-cost-gate-calibration | research | Calibrate rsp-review context-cost gates with three fresh repeated paired matrices |
| 2026-07-20 | rsp-review-evaluation-hardening | research | Make rsp-review evaluation reproducible and decide whether the candidate can be promoted |
| 2026-07-20 | rsp-review-scope-state-revision | research | Correct rsp-review pipeline scope states and mixed-change coverage without regressing restraint or cost |
| 2026-07-20 | skill-system-foundation | feature | Establish the host-neutral Skill contract and evaluate the first rsp-review candidate |
| 2026-07-21 | fix-review-output-and-eval-runner | fix | Remove an unsafe one-off diagnosis runner and make review-facing Skill output follow the user's language without destabilizing protocol tokens. |
| 2026-07-21 | fix-rsp-review-production-chain | fix | Require `rsp-review` to verify that a changed production consumer actually reaches a defective or recommended seam. |
| 2026-07-21 | matt-first-daily-capability-audit | research | Audit the complete stable Matt engineering suite against RSP's seven-Skill assisted suite and real daily project journeys before 3.0 release preparation. |
| 2026-07-22 | dogfood-project-rsp-skills | ops | Dogfood every published RSP Skill through repository-local discovery and route overlapping engineering work away from global Matt Skills inside this repository. |
| 2026-07-22 | fix-clean-install-npm10-json | fix | Make the clean-install release gate tolerate npm 10 pack lifecycle output on supported Node 18 and 20 runtimes |
| 2026-07-22 | fix-native-composition-retained-gate | fix | Bind retained native composition evidence to current product artifacts and auditable durable output |
| 2026-07-22 | fix-native-durable-semantic-oracle | fix | Reject contradictory ownership in retained durable composition evidence |
| 2026-07-22 | prepare-release-notes-skill | feature | Add a host-neutral RSP Skill that prepares and audits evidence-based changelogs, release notes, and migration notes while adapting to user and repository conventions. |
| 2026-07-22 | rsp-release-docs-routing | fix | Rename the release-documentation Skill to `rsp-release-docs` and route eligible release Changes to it from Core. |
| 2026-07-23 | align-config-and-templates-with-3-0 | fix | Project configuration fails closed through one validation contract, and newly generated RSP artifacts express the final 3.0 capability and artifact-ownership boundaries without adding lifecycle or Skill state. |
| 2026-07-23 | extract-project-status-boundary | refactor | Extract the current project-status collection, derivation, v3 JSON adaptation, and plain-text presentation into explicit one-way modules that preserve every existing `rsp status` behavior and provide the stable internal snapshot required by the later Ink dashboard. |
| 2026-07-23 | guide-archive-before-final-commit | feature | Guide explicit archive before the final Git commit |
| 2026-07-23 | layer-archive-closeout | fix | Layer advisory archive guidance and managed closeout execution |
| 2026-07-23 | release-3-0-0 | ops | Deliver RSP 3.0.0 as a deterministic protocol plus the complete promoted Skill Suite, then perform the authorized external release. |
| 2026-07-23 | reposition-rsp-product | docs | Reposition RSP as Reliable Software Practice and make the English and Chinese product documentation lead with the complete repository-native engineering workflow rather than only its file protocol. |
| 2026-07-24 | add-ink-tui-dashboard | feature | Ship a lazy-loaded, read-only Ink dashboard as the default human-facing `rsp` experience on an interactive terminal for RSP 3.1.0, while retaining deterministic plain-text and JSON command output. |
| 2026-07-21 | 3-0-skill-readiness/brief | group | — |
| 2026-07-21 | 3-0-skill-readiness/close-review-resolution-handoff | feature | Add a host-neutral review-resolution capability that disposes fixed findings, corrects accepted findings under explicit authority, requires verification and re-review, and returns a recoverable handoff when interrupted. |
| 2026-07-21 | 3-0-skill-readiness/integrate-diagnosis-tdd-routing | feature | Add deterministic, host-neutral routing from implementation evidence to diagnosis, TDD, or ordinary implementation. |
| 2026-07-21 | 3-0-skill-readiness/validate-assisted-engineering-loop | research | Validate the tightened RSP 3.0 assisted engineering loop with eight repeatable, host-neutral scenarios after the routing and review-resolution slices land. |
| 2026-07-23 | cli-machine-output/add-compact-json-output | feature | Add an opt-in compact serialization mode for RSP's machine-readable JSON commands. |
| 2026-07-23 | cli-machine-output/clarify-dependency-plan-output | fix | Make dependency-plan JSON and filtered status projections explicitly communicate prerequisite direction and required node context. |
| 2026-07-21 | daily-workflow-depth/brief | group | — |
| 2026-07-21 | daily-workflow-depth/deepen-rsp-shape | feature | Deepen explicit shaping without taxing ordinary runs |
| 2026-07-21 | daily-workflow-depth/prototype-managed-controller | research | Prototype an optional bounded managed controller |
| 2026-07-21 | daily-workflow-depth/validate-daily-workflow-depth | research | Validate five daily journeys and freeze the 3.0 boundary |
| 2026-07-21 | engineering-disciplines/add-rsp-diagnose | feature | Publish a concise host-neutral `rsp-diagnose` Skill that establishes a confirmed cause before production correction. |
| 2026-07-21 | engineering-disciplines/add-rsp-tdd | feature | Publish a concise host-neutral `rsp-tdd` Skill that produces observed red-green-refactor evidence for one selected Change. |
| 2026-07-21 | engineering-disciplines/brief | group | — |
| 2026-07-21 | engineering-disciplines/validate-discipline-composition | research | Validate concise `rsp-tdd` and `rsp-diagnose` behavior, Core routing, context cost, and conflict restraint in an installed RSP suite. |
| 2026-07-22 | lightweight-rsp-manage/brief | group | — |
| 2026-07-22 | lightweight-rsp-manage/refine-explicit-controller | research | Revise `rsp-manage` into an explicit-only lightweight controller for genuine long continuation, independent bounded delegation, and interruption recovery. |
| 2026-07-22 | lightweight-rsp-manage/validate-managed-orchestration | research | Decide whether the revised lightweight `rsp-manage` demonstrates enough autonomous continuation and task-orchestration value to justify optional product promotion. |
| 2026-07-20 | minimum-skill-suite/build-rsp-implement | feature | Build and promote a bounded RSP implementation Discipline Skill. |
| 2026-07-20 | minimum-skill-suite/build-rsp-shape | feature | Build and promote the host-neutral RSP shaping/slicing Discipline Skill. |
| 2026-07-21 | minimum-skill-suite/brief | group | — |
| 2026-07-21 | minimum-skill-suite/refine-rsp-core-routing | feature | Make the Core Skill derive one stage and next action without becoming a router catalog. |
| 2026-07-21 | minimum-skill-suite/simplify-native-skills | refactor | Restore a gap-driven path from upstream distillation to concise RSP-native Skills. |
| 2026-07-21 | minimum-skill-suite/validate-native-skill-depth | refactor | Preserve valuable complex shaping branches without bloating runtime context, and validate both concise native Skills on real mutation work. |
| 2026-07-21 | minimum-skill-suite/validate-skill-composition | feature | Prove the minimum Skill Suite composes through existing RSP artifacts before 3.0 release. |
| 2026-07-22 | rsp-native-design-and-artifacts/brief | group | — |
| 2026-07-22 | rsp-native-design-and-artifacts/promote-rsp-design | feature | Promote a concise `rsp-design` discipline for resolving tracked domain, module, and evidence-seeking design questions. |
| 2026-07-22 | rsp-native-design-and-artifacts/strengthen-artifact-continuation | feature | Make durable artifact writing, bounded continuation, and safe Git-conflict fallback explicit RSP-native behavior. |
| 2026-07-22 | rsp-native-design-and-artifacts/validate-native-design-composition | ops | Qualify the eight-Skill assisted suite and gate RSP 3.0 on native design and durable artifact ownership. |
| 2026-07-20 | skill-capability-research/accept-research-baselines | research | Close the reviewed upstream baseline used by the Skill System research. |
| 2026-07-20 | skill-capability-research/brief | group | — |
| 2026-07-20 | skill-capability-research/map-capability-coverage | research | Account for upstream and local Skills by capability instead of only by source repository. |
| 2026-07-20 | skill-capability-research/reconcile-skill-system | research | Reconcile the frozen Skill System model with completed capability-level research. |
| 2026-07-20 | skill-capability-research/synthesize-implementation-capability | research | Define a standalone RSP implementation capability with fresh verification evidence. |
| 2026-07-20 | skill-capability-research/synthesize-shaping-capability | research | Define the smallest RSP-native shaping and slicing capability from selected cross-source evidence. |