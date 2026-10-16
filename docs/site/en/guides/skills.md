# Skills and managed work

The current source candidate defines seven host-neutral core Skills installed together and loaded on demand. It is not yet a released or behavior-accepted package; the published stable package retains its own inventory. Each Skill has a narrow authority boundary; routine session work does not require inventing a Change.

| Skill | Responsibility |
|---|---|
| `rsp` | Select the current branch; continue ordinary authorized work through checks and necessary writeback, or coordinate only when qualified. |
| `rsp-shape` | Answer a bounded read-only design question or, with planning authority, shape one executable Change or justified shallow Group. |
| `rsp-implement` | Diagnose read-only when requested; implement authorized fixes, use test-first work when warranted, and correct accepted fixed findings with fresh checks. |
| `rsp-doc` | Write repository documents, Skills and release communication for a defined reader and result. |
| `rsp-verify` | Run one bounded read-only verification pass against a selected WorkOwner's declared evidence boundary. |
| `rsp-review` | Review a fixed code, document, or mixed comparison, including release communication, without mutation. |
| `rsp-commit` | Inspect delivery readiness read-only or create one authorized exact-scope local commit. |

Structural discovery is a conditional method of `rsp-review`. It examines an explicit repository/subtree boundary without requiring a diff; ordinary review does not expand into an audit. Findings grant no implementation or design authority.

`rsp-doc` is installed with the complete suite and may be invoked directly. Use artifact lenses for README, CONTEXT, Spec, Change and guides; use the Skill branch for package creation or revision, and release communication for changelogs, release notes, migration or authorized document reconciliation. Review loads release checks only for reviewed release documents. Neither method controls publication or establishes release readiness. Local wording fixes and mechanical status/evidence updates remain direct when they need no whole-record reconciliation. Whole-Change convergence uses the artifact method when Doc is available, even when few lines change; already-converged text needs no rewrite. The maintainer-only `author-rsp-skills` adds local Change, provenance and evaluation requirements.

## Migrating the earlier Skill names

Retired `rsp-structural-audit` and `rsp-codebase-audit` requests now belong to Review. Suite installation protects both old directories before forced removal; preserve needed custom guidance.

For this unreleased source candidate, route `rsp-design` to `rsp-shape`; route `rsp-diagnose`, `rsp-tdd`, and `rsp-resolve-findings` to methods within `rsp-implement`; route `rsp-manage` to conditional coordination within `rsp`. The older `rsp-address-review` alias also resolves to `rsp-implement`. These are responsibility mappings, not permanent compatibility Skills or a request to erase project-owned guidance.

`rsp-release-docs` is removed: writing belongs to Doc and fixed-scope read-only checks to Review. Full-suite installation checks the obsolete installed directory before replacement. Individual named installs are rejected before mutation. Update explicit old-name calls to the appropriate owner. Before an authorized forced migration, confirm that any custom release guidance you need to retain is recoverable.

When the exact candidate CLI becomes available, use that same selected CLI throughout; `@latest` is not a synonym for this unreleased source. With installation authority:

1. Inspect `rsp skills list` and run `rsp skills install --dry-run`. Differing selected trees or recognized obsolete package-owned names stop ordinary dry-run before a full replacement/removal preview.
2. Inspect the named customized trees and use `rsp skills install --dry-run --force` to preview the exact replacement/removal scope. Unknown Skills must remain untouched.
3. After confirming that scope and the recoverability of any custom content you need to retain, run `rsp skills install --force` with the same CLI and inspect the resulting installation state.

A Git commit containing the needed custom content suffices; no additional backup is required. Save uncommitted or untracked content only if you need to retain it. Temporary installation backups support rollback, not permanent retention.

Activation failure triggers rollback of recognized replacements/removals. If rollback is incomplete, the command reports a retained recovery location; inspect actual installed trees and backups before retrying or cleanup. This does not make a silent update safe. `rsp update` is not a Skill refresh. No candidate version, release, external install, or behavior acceptance is claimed here.

Installation, runtime role, and invocation are separate:

| Skills | Distribution | Runtime role | Invocation |
|---|---|---|---|
| `rsp` | default | Core | direct project entry |
| `rsp-shape` | default | Shape | Core-routed or explicit shaping |
| Implementation, verification, and review | default | Discipline | Core-routed specialist or explicit bounded request |
| `rsp-commit` | default | local-delivery Discipline | explicitly authorized exact boundary; closure policy never grants Git authority |
| Conditional coordination in `rsp` | within Core | coordination branch | selected under effective project policy only for an actual obligation |
| `rsp-doc` | default | writing Discipline | repository-document, Skill or release writing |

`default` means included in this source candidate's default suite; it does not mean automatically invoked. A Skill boundary is not a worker boundary. Core's qualified coordination branch can compose bounded worker lanes, but selection alone does not imply delegation. Install/update the seven core Skills together from one package version. Direct invocation does not require executing Core: when tracked work identities are needed, each consumer reads Core references/work-model.md unless already in its context. Independent workers supply their own context. Missing shared resources indicate an incomplete installation; do not invent definitions.

At task transitions, Core selects from the current requested result and authority,
not the last-used Skill or edit size, and loads only the applicable entrypoint
and method not already in context. Shape owns decision clarification and planning
artifacts, not approval of material choices or new public requirements; Doc writes
settled facts and converges final work records.
Changing responsibility grants no new authority and requires no extra worker,
repeated checks or user continuation.

## Compose the suite from evidence

- Shape can answer one bounded design question read-only without inventing a WorkRef or plan. Authorized planning may create or refine a Change or justified shallow Group; advice within tracked work retains its existing owner without editing it unless authorized.
- Implement investigates unexplained failures before correction. Diagnosis-only remains read-only without creating an owner. An authorized fix proceeds within the same scope after confirming cause; use pre-mutation RED only when explicitly required or justified by concrete risk.
- Implement disposes each fixed finding as accepted, rejected, or needing clarification, corrects accepted findings within authority and runs affected checks. When review is requested or required, Core coordinates the separate read-only judgment; a repair-only request returns the correction without inventing review or self-certifying review-clean.
- Verify executes a declared read-only evidence boundary when required; ordinary Implement checks need no Verify handoff. A Change uses its WorkRef and `Verify` boundary; a Group uses a named `Integration:` condition from its Brief. A request-only boundary must be written back before Group closeout. Required independent acceptance needs host-observed distinct workers.
- Release writing uses Doc; release-document review uses Review. Both load only their applicable method, preserve evidence and migration boundaries, and confer no publication authority.
- Release checks without a selected WorkOwner stay with Core and the project's declared checks, not an invented Change or ownerless Verify request. Require an exact candidate, any range the checks need, and authority for their actual effects; missing prerequisites stop dependent checks. Preserve required independent acceptance and separate Git/publication authority.
- Doc and Review apply the adopted writing-quality contract: grounded facts, useful structure, concise result steps, stable notation and preserved meaning. Skill tables are sparse fixed mappings; human documents use tables for reader-relevant comparison. Agreed expression rules are reviewable contracts, not personal preference.
- Doc owns writing/self-checks; formal Review stays read-only. Review selects Code for behavior/tool semantics and Document for explanation/usage within fixed content. Complete Skill instructions normally need both; comments and embedded examples receive proportionate applicable checks, not classification by extension. Authority-only reads do not enlarge the target. Review grants no repair authority; originally authorized corrections may continue. Static checks do not prove live behavior or independent acceptance.
- The host, user, and Git own execution-location selection and cross-branch integration. Core's coordination branch operates only in the checkout or environment it actually observes; no canonical Skill selects or lands an execution environment.
- Commit owns one exact local commit in the current checkout and never absorbs cherry-pick, cleanup, or cross-branch integration.
- No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority.

## Control outcomes

Core selects from intent, authority, available ownership, and checkout evidence, then loads only the chosen branch's detailed guidance. Within one authorized request, ordinary single-owner work continues through required and proportionate checks and necessary writeback without another `continue`. It needs no invented Change for a trivial session task and gains no archive or commit authority.

The owning capability chooses permitted methods under the same goal, scope, authority, authoritative baseline and evidence requirements. CLI and scripts provide deterministic diagnostics and observations, not semantic approval. A method change cannot waive a named mandatory command, required independent worker or protected RSP operation. For effect-aware recovery and stops, follow [Verify and review](./daily-workflow.md#verify-and-review). Return to Core for completed responsibility, a changed boundary, required cross-capability independent acceptance, or a real unresolved blocker; that return does not itself require another user turn. No route, controller state, or second ledger is persisted.

Work ownership, decision ownership, transient handoff, execution uncertainty, and acceptance are separate concepts. `WorkOwner` means the selected Change or shallow Group, `DecisionOwner` means the human or authority source required for a material decision, and `NextOwner` means the next control or execution capability. A stop must say who acts next, what input is required, and whether work returns through Shape or Core, or waits for fresh evidence, environment, verification, or capability. Missing required worker creation, a worker-authored result, or required host attribution is unavailable evidence, never successful completion.

Three review-related gates remain distinct:

- Implementation verification establishes applicable evidence for the current outcome. Reuse still-applicable passing results; run only missing, failed or invalidated checks. Explicit reruns and required independent execution remain binding.
- Fixed-scope change review is the report-only Review comparison. It is required when explicitly requested, required by project authority or risk, or needed by selected acceptance; it is not automatically required for every tiny direct action.
- The durable writeback decision is required before archive and independently decides whether stable current facts or lasting rationale must update a Spec, scoped instruction, or Decision Record. It never substitutes for fixed-scope change review.

These outcomes exist only in the current response and host execution context. Changes and Groups remain the durable owners, and their lifecycle remains `open` or `archived`.

## Managed automation

Core selects capabilities directly. Direct is bounded work without durable tracking; Change retains one recoverable acceptance/delivery boundary; Group coordinates independently acceptable children with dependencies or integration. Complexity or worker count alone does not justify Group.

Automatic delegation is off by default. Explicit worker requirements remain binding; when auto is enabled, the user or main agent decides worker count within host resources. Main owns dependency/resource decisions and result acceptance; workers do not recursively delegate by default. Separate Review/Verify is selected for an actual obligation, not for each task or worker.

Ordinary completion and checkpoint commits leave work open. Established final delivery selects ask/auto/manual closure independently of Git authority. Necessary stable knowledge is updated before final Change reconciliation, which may be one operation. Reuse applicable tests and reviews; supplement only missing or invalidated evidence. Independent review does not itself require independently executing every test.

See [workflow configuration and explicit legacy migration](../reference/configuration.md#workflow-policy). No configuration grants commit, push or publication authority. Core prepares the exact boundary; Commit owns authorized staging and one local commit. Archive/commit failure is reported from actual effects, without automatic reopen or history rewrite.
