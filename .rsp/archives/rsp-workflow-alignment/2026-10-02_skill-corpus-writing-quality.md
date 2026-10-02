---
kind: "refactor"
---

# Change: rsp-workflow-alignment/skill-corpus-writing-quality

## Proposal

- Outcome: Apply the current writing/resource contract to the complete authored Skill corpus, retaining necessary behavior and reducing evidenced repetition or reading friction.
- Scope: Eight current product packages in skills/ and three real maintainer packages in .agents/skills/, including entrypoints, references, metadata and distribution notices; content-based Code/Document review selection, its writing/Skill Specs, fallback, guides and existing task rubrics; this Change and proportionate existing checks.
- Non-goals: New capabilities, changed authority or invocation policy, Manage defaults, new research, runtime helpers, permanent tests, global installation, archive, Git delivery or publication. Model execution and independent acceptance require their own authority.


## Spec

### MODIFIED

- Apply [writing quality](../../specs/writing-quality.md) and [Skill resource design](../../specs/skill.md#instruction-and-resource-design) across each complete selected package. Retain trigger, inputs, authority, action, output, stops, verification and conditional-loading meaning.
- State task-specific outcomes and necessary constraints; fix order only for a real dependency, correctness or safety. Generic teaching and model-compensation prose need a current task reason.
- Keep common safety and actionable minimum context local. Conditional links identify their reading condition and purpose; merging resources preserves standalone closure and incoming callers.
- Retain [agent/tool boundaries](../../specs/design.md#agent-and-tool-boundary), required commands, configuration projection, independent evidence, provenance, license notices and one-attempt delivery safeguards.
- Whole-corpus inspection does not require changing every file. Counts, package validity, self-checks, independent review and actual model outcomes remain distinct; neither shorter text nor a newer model establishes equivalence or improvement.
- Select Code and Document as complementary review perspectives on fixed reviewed content, not mutually exclusive file kinds. Cover behavior and explanation when both apply; preserve authority-only inputs, bounded evidence, independent acceptance and read-only operation.

### Acceptance

- Every current package is inspected with a recorded change or retention reason, including older conditional resources and metadata.
- Ordinary agent-facing writing needs no duplicate Doc reference; applicable artifact and Skill methods remain discoverable.
- Core distinguishes initialization, repair and durable writeback; Shape retains its design evidence and mutation boundaries without an unnecessary fixed itinerary.
- Author selects reading scope by mode. Distill reuses supported retained conclusions without unnecessary recollection, while fresh distillation retains its exact provenance and completion gates.
- Fresh structural and repository results bind to the current candidate. Natural discovery, behavioral equivalence and quality/cost claims remain unverified without matching task evidence.
- Complete Skill instruction reviews cover behavior and expression; bounded wording changes select only affected perspectives. API comments, copyable examples and behavior-affecting annotations receive applicable checks without treating every comment or code fence as a full second review. One underlying inconsistency yields one finding.
- Reuse existing Skill critique, document-example, API-comment and pure-Code/Document restraint cases. Updated rubrics judge scope, meaning and actual responsibility, not read-command fingerprints. Historical results retain their original contract.

## Design

Apply the existing writing/resource contract and the [September 30 supplement](../../../research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md#skill-authoring-supplement--2026-09-30), R8–R10, as model-only evidence. Specs/maintainer documents own selected rules and provenance; shipped Skills gain no research or Spec runtime dependency.

The comparison is the preceding working tree over HEAD 2a9cddc, fingerprint 5e70259542f1c50f374d754f48f61c33780d760085b376dee2015f62498e7d63, not HEAD's older sources. Preserve snapshots and inspect callers before resource removal.

Package dispositions:

- Core: condense repeated writing guidance; distinguish initialization and repair while retaining coordination, configuration, lifecycle and Commit safeguards.
- Doc: merge common agent-facing rules; retain conditional artifact, Skill and release methods and independent-evidence distinctions.
- Shape: use peer design judgments; retain production/edge-case evidence, no-mutation boundaries and planning gates.
- Review and Structural Audit: distinguish fixed review and open-ended discovery; retain read-only pipelines, exclusions and evidence gates.
- Author and Distill: expose mode-specific reading and supported reuse; retain package validation, provenance, licensing and managed-operation requirements.
- Commit, Verify, Implement and Release Acceptance: retain their distinct Git, independent-evidence, diagnosis, testing, finding and candidate-evidence contracts.

Code and Document inspect complementary behavior and explanation within fixed content scope; narrow scope wins. Implementation grounding remains evidence-only, one root inconsistency yields one finding, and pseudocode receives proportionate checks. Preserve historical execution/judge contracts. Git policy and release migration retain their separate child owners; no classifier, new runner, state or worker topology is introduced.

## Tasks

- [x] Inspect all eleven complete current packages, relevant callers and governing Specs; select improvements and adequate retained surfaces.
- [x] Apply selective authored-source changes and preserve unrelated work.
- [x] Validate final package closure, links, security, code/docs checks and existing case readiness.
- [x] Record separate product/internal diagnostics, final candidate identity, evidence limits and durable decisions.
- [x] Align Specs, Review/Doc guidance, fallback and bilingual guides with content-based review selection.
- [x] Update existing semantic cases for Skill instructions, embedded examples and API comments, retaining pure-scope restraint.
- [x] Run fresh local checks and record the new candidate separately from historical acceptance.
- [x] Confirm and correct the final review's three document findings against their existing authority, run affected document checks and complete independent re-review.

## Verify

Historical closeout evidence below applies to the original candidate and reviewed text, not this later editorial repair. Original reports and verdicts remain unchanged.

### Required

- [x] Build, lint, typecheck and 18 code files /115 tests passed. Eleven canonical packages passed metadata/resources; docs checks covered seven bilingual pairs /31 Markdown files and site build passed. CLI-synced fallback matched its authored source.
- [x] All 63 cases passed offline readiness, including five mixed-content/restraint cases; provider calls zero and behavioralAcceptance not-run. No new test file, classifier or runner was added.
- [x] Final eleven-package composition: 8176df524d66c012fd35a8481fd41c76c838259256e2b09ab54f5a3706f898b2, 63 files; security found zero issues. Product composition: 45f0180af2b32ac85d610a64ee1bbbbe2c0709fc6c84e6960ffea824a3c10ea8. Package diagnostics found no unreachable Markdown or exact repeated prose, not semantic acceptance.
- [x] Author checks traced Skills, API comments, copyable commands, pseudocode and pure-scope restraint, retaining authority-only inputs, bounded evidence, deduplication and read-only behavior. Unrelated work and original run/judge hashes were preserved.
- [x] Three final-candidate tasks passed/complete with independent gpt-6.1-sol medium/high judgment: skill-author-critique, doc-review-grounded and review-dirty-workflow. Evidence: tests/skills/reports/rsp-workflow-alignment/content-based-live/a6b5c21e-08ab-496b-92fd-9b377ef9aed2/matrix.json. Task/source workspaces were preserved.
- [x] Final fifteen-path independent re-review covered seven corrected documents, the Brief, five children and two stages: Code/Document clean and all three P2s closed. Original evidence: tests/skills/reports/rsp-workflow-alignment/final-document-rereview.md and final-document-rereview-scope.json.

The host quick validator passed only authored Review and Doc using isolated uv/PyYAML. Global Python, project dependencies and host script were unchanged; no other package host-validation pass follows.

### Independent review and finding dispositions

The 59-path final-content review was Code clean with three Document P2s. All were accepted and corrected without executable behavior changes:

- Incomplete installer rollback: Distribution and bilingual guides now require actual-state and recovery-file inspection before retry or cleanup.
- Continuation identity: maintainer guidance now uses WorkOwner and distinguishes Change WorkRef from Group reference/direct children.
- Runner stops: coverage guidance now distinguishes ordinary case failures from cancellation, budget, authority and frozen-input stops; experiment-specific fail-fast remains local.

The fifteen-path re-review supplies post-fix Document clean, not the earlier report. Reports and scopes: tests/skills/reports/rsp-workflow-alignment/final-content-review.md, final-review-scope.json and final-document-rereview.md.

### Current candidate task evidence

Skill critique checked instructions through both perspectives; document review bounded Code to the command recipe; API review reported the arithmetic/explanation inconsistency once against its final-price contract. These pass the review tasks, not their defective fixtures.

The document response incorrectly said no commands ran although three inspection shell calls ran. The judge recorded the minor reporting issue and passed the substantive task; no export/example command ran. Original reports remain unchanged. Natural discovery, independent newcomer comprehension, equivalence and causal quality/cost gain remain unverified.

### Historical evidence

Historical verdicts retain their original candidates and contracts:

- Conditional-context matrix bc4777e9-1bc7-405d-9930-45060f879fed remains failed: suggestion sequencing and Document loading under Code-only scope. See tests/skills/reports/skill-conditional-context/live-comparison/ and its model-comparison.md.
- Earlier Group matrix 18623243-9bbd-4471-86ef-1e4d9cef18a0 remains recorded passed/complete under tests/skills/reports/rsp-workflow-alignment/live/. Independent source review confirmed original Code-only noncompliance and a judge miss; the new contract neither justifies that run nor repairs its judge.
- Prior source review was Code clean, Document skipped, not task acceptance: tests/skills/reports/rsp-workflow-alignment/source-review.md.
- Earlier corpus candidates and matrix a3daee83-7980-4d4e-bac6-e91f9d1355ec retain their original results under tests/skills/reports/skill-corpus-writing-quality/ and source-review/. Earlier four-package evidence was static/self-check only.

Prior corpus diagnostics, not current model tokens: product characters 155137→152752 and references 34→33; internal characters 35428→35176 with fourteen references retained. Detailed package inventories/counts stay in the retained reports; no behavioral or cost gain follows from these reductions.

### Durable Decisions

- Current facts: Update existing spec or scoped instruction.
- Current-fact target: .rsp/specs/writing-quality.md, .rsp/specs/skill.md and .rsp/specs/distribution.md.
- Facts to write: completed content-based Code/Document applicability, proportional checks for embedded guidance, authority-only scope and text/behavior consistency; clarify the existing incomplete-rollback result. Fallback and guides carry corresponding summaries.
- Decision Record: No Decision Record needed.
- Decision Record target: N/A.
- Rationale to write: none; the reversible review refinement stays in this Design and its current contract, without a second ownership or lifecycle model.
- Archive ready: yes for the declared corpus and content-based review boundary; current-candidate task/judging, independent source review, final Document re-review and required writeback are complete. Historical verdicts, the minor task-reporting error and untested limits remain explicit. The Group owns fresh readiness and authorized lifecycle/local delivery.

## Blockers

- none
