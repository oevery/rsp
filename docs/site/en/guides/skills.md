# Skills and managed work

The current source candidate defines seven default host-neutral Skills for on-demand loading. It is not yet a released or behavior-accepted package; the published stable package retains its own inventory. Each Skill has a narrow authority boundary; routine session work does not require inventing a Change.

| Skill | Responsibility |
|---|---|
| `rsp` | Select the current branch; continue ordinary authorized work through checks and necessary writeback, or coordinate only when qualified. |
| `rsp-shape` | Answer a bounded read-only design question or, with planning authority, shape one executable Change or justified shallow Group. |
| `rsp-implement` | Diagnose read-only when requested; implement authorized fixes, use test-first work when warranted, and correct accepted fixed findings with fresh checks. |
| `rsp-verify` | Run one bounded read-only verification pass against a selected WorkOwner's declared evidence boundary. |
| `rsp-review` | Review a fixed code, document, or mixed comparison without mutation. |
| `rsp-commit` | Create one authorized exact-scope local commit. |
| `rsp-release-docs` | Draft, audit, finalize, or reconcile an explicit release documentation surface. |

`rsp-structural-audit` is an optional report-only project Skill. It audits one bounded repository or subtree before implementation authority is granted.

## Migrating the earlier Skill names

For this unreleased source candidate, route `rsp-design` to `rsp-shape`; route `rsp-diagnose`, `rsp-tdd`, and `rsp-resolve-findings` to methods within `rsp-implement`; route `rsp-manage` to conditional coordination within `rsp`. The older `rsp-address-review` alias also resolves to `rsp-implement`. These are responsibility mappings, not permanent compatibility Skills or a request to erase project-owned guidance.

When the exact candidate CLI becomes available, use that same selected CLI throughout; `@latest` is not a synonym for this unreleased source. Inspect `rsp skills list` and start with `rsp skills install --dry-run`. If selected trees differ or recognized obsolete package-owned names are present, ordinary dry-run errors instead of showing the full replacement/removal result. Inspect and back up user-customized content first, then run `rsp skills install --dry-run --force` with the same CLI to preview exactly what would be replaced or removed. Only after confirming that scope, run `rsp skills install --force` with that CLI. Unknown Skills must remain untouched. The installer's recognized replacements/removals use rollback on activation failure, but this does not make a silent update safe. Do not use `rsp update` as a Skill refresh. No candidate version, release, external install, or behavior acceptance is claimed here.

Installation, runtime role, and invocation are separate:

| Skills | Distribution | Runtime role | Invocation |
|---|---|---|---|
| `rsp` | default | Core | direct project entry |
| `rsp-shape` | default | Shape | Core-routed or explicit shaping |
| Implementation, verification, review, and Release Docs | default | Discipline | Core-routed specialist or explicit bounded request |
| `rsp-commit` | default | local-delivery Discipline | explicitly authorized exact boundary; eligible coordination closeout only after its gates |
| Conditional coordination in `rsp` | within Core | coordination branch | selected under effective project policy only for an actual obligation |
| `rsp-structural-audit` | optional | Discovery | explicit report-only request |

`default` means included in this source candidate's default suite; it does not mean automatically invoked. A Skill boundary is not a worker boundary. Core's qualified coordination branch can compose bounded worker lanes, but selection alone does not imply delegation. Published Skills remain standalone; missing optional siblings do not remove their bounded safe fallback.

## Compose the suite from evidence

- Shape can answer one bounded design question read-only without inventing a WorkRef or plan; planning updates require separate authority and an existing owner.
- Implement investigates unexplained failures before correction. Diagnosis-only remains read-only without creating an owner. An authorized fix proceeds within the same scope after confirming cause; use pre-mutation RED only when explicitly required or justified by concrete risk.
- Implement disposes each fixed finding as accepted, rejected, or needing clarification. Correct accepted findings within authority, rerun affected checks, and obtain separate read-only Review; Implement cannot self-certify review-clean.
- Verify executes a declared read-only evidence boundary when required; ordinary Implement checks need no Verify handoff. A Change uses its WorkRef and `Verify` boundary; a Group uses a named `Integration:` condition from its Brief. A request-only boundary must be written back before Group closeout. Required independent acceptance needs host-observed distinct workers.
- Review remains fixed-scope and read-only. Release Docs requires an explicit release-documentation request and does not confer publication authority.
- The host, user, and Git own execution-location selection and cross-branch integration. Core's coordination branch operates only in the checkout or environment it actually observes; no canonical Skill selects or lands an execution environment.
- Commit owns one exact local commit in the current checkout and never absorbs cherry-pick, cleanup, or cross-branch integration.
- No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority.

## Control outcomes

Core selects from intent, authority, available ownership, and checkout evidence, then loads only the chosen branch's detailed guidance. Within one authorized request, ordinary single-owner work continues through proportionate checks and necessary writeback without another `continue`. It needs no invented Change for a trivial session task and gains no archive or commit authority. Repairable failures and method changes in the same scope/authority remain with the responsible capability; return to Core for completed responsibility, changed goal/owner/scope/authority, required cross-capability independent acceptance, or a real unresolved blocker. Returning to Core does not itself require another user turn. No route, controller state, or second ledger is persisted.

Work ownership, decision ownership, transient handoff, execution uncertainty, and acceptance are separate concepts. `WorkOwner` means the selected Change or shallow Group, `DecisionOwner` means the human or authority source required for a material decision, and `NextOwner` means the next control or execution capability. A stop must say who acts next, what input is required, and whether work returns through Shape or Core, or waits for fresh evidence, environment, verification, or capability. Missing required worker creation, a worker-authored result, or required host attribution is unavailable evidence, never successful completion.

Three review-related gates remain distinct:

- Implementation verification supplies fresh evidence after every mutation.
- Fixed-scope change review is the report-only Review comparison. It is required when explicitly requested, required by project authority or risk, or needed for managed `review-clean`; it is not automatically required for every tiny direct action.
- The durable writeback decision is required before archive and independently decides whether stable current facts or lasting rationale must update a Spec, scoped instruction, or Decision Record. It never substitutes for fixed-scope change review.

These outcomes exist only in the current response and host execution context. Changes and Groups remain the durable owners, and their lifecycle remains `open` or `archived`.

## Managed automation

Core's conditional coordination branch handles actual coupled slices, recovery, distinct execution and acceptance owners, shared verification resources, bounded review convergence, managed lifecycle or delivery coordination. File count, public documentation, and ordinary sequential method changes do not qualify by themselves. This branch is not a second controller or automatically a worker boundary.

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` controls selection:

- `explicit`: conditional coordination requires an explicit request.
- `auto`: Core selects coordination only when current evidence shows a qualifying obligation; otherwise ordinary work continues in the same request.

Core first resolves the selected Change or shallow Group when coordination requires durable ownership, checks effective activation and authority, and selects or declines the branch. Missing ownership cannot be invented from read-only design or diagnosis; planning requires independent authority. Within the selected branch Core checks owner/diff drift and keeps same-scope methods and recoverable failures local. Changed goal, owner, scope, authority, independent acceptance, or unresolved blockers cause rederivation; a phase boundary alone does not ask the user to continue.

During coordination, Core chooses a transient sequential or parallel strategy from dependencies, mutation boundaries, verification resources, and host capability. Worker participation is observed at the host boundary, not inferred from Skill routing. Shared resources stay sequential unless the host proves safe isolation; independent Verify needs distinct-worker evidence.

Diagnosis-only and inspection remain read-only; authorized correction owns its mutation boundary. Missing required host attribution or accepted evidence is a stop, not simulated independence.

`closeout` retains its existing compatibility values and sets a ceiling only after coordination has actually been qualified and selected. Ordinary work gains no archive or commit from this setting:

- `manual`: archive and commit remain manual.
- `lifecycle`: after required fixed-scope change review is clean and the durable writeback decision is complete, archive may follow; commit remains separate.
- `local`: automatically archives an eligible, verified, non-small terminal managed boundary with a clean exact owned boundary and routes its exact paths once to local Commit without another user request.

The qualified coordination branch derives any eligible delivery request; rsp-commit exclusively owns owner revalidation, exact staging, message construction, one local commit, and post-commit observation.

`activation` never grants planning or product-mutation authority. For a currently selected and qualified coordination branch, `closeout` remains only the existing limited lifecycle/local-Git ceiling after fresh gates; nearer denials prevail. Push, tags, releases, publication, deployment, approval, human acceptance, and other external actions always remain explicit.

Managed interruption and resume reread accepted state, authority, diff, and evidence. Host owns cancellation, heartbeat, replay safety, and resource release; RSP does not persist controller or paused state.

The selected coordination branch may keep a sparse accepted-state Focus Capsule for recovery. It is a bounded pointer, not authority, and excludes worker or runtime data. Cross-device use requires separately authorized Git transfer and fresh rederivation; unfocus or archive removes it.

See [configuration](../reference/configuration.md) for the exact keys and [daily workflow](./daily-workflow.md) for ordinary operation.
