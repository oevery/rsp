# Skills and managed work

RSP publishes eleven default host-neutral lifecycle Skills for on-demand loading. Each has a narrow authority boundary and returns its result to an existing project or RSP owner.

| Skill | Responsibility |
|---|---|
| `rsp` | Derive the next action; guide setup, durable review, and archive decisions. |
| `rsp-shape` | Shape one executable Change or justified shallow Group. |
| `rsp-design` | Resolve one bounded domain, module/seam, or evidence-seeking design question. |
| `rsp-implement` | Implement one selected ready Change with fresh verification. |
| `rsp-diagnose` | Establish a cause, or return a truthful unresolved diagnosis, before correction. |
| `rsp-tdd` | Drive one justified behavior through RED, GREEN, and safe REFACTOR. |
| `rsp-review` | Review a fixed code, document, or mixed comparison without mutation. |
| `rsp-resolve-findings` | Dispose fixed findings, correct accepted ones, verify, and request re-review. |
| `rsp-commit` | Create one authorized exact-scope local commit. |
| `rsp-release-docs` | Draft, audit, finalize, or reconcile an explicit release documentation surface. |
| `rsp-manage` | Coordinate one eligible long-running, recovery, or multi-slice continuation. |

`rsp-structural-audit` is an optional report-only project Skill. It audits one bounded repository or subtree before implementation authority is granted.

## Compose the suite from evidence

- Shape establishes the executable owner.
- Design answers one material question and returns to that owner.
- Diagnose precedes TDD when a failure is unexplained.
- TDD is selected only when explicitly required or when a concrete changed risk makes pre-mutation RED materially safer.
- Review remains read-only; Resolve Findings owns accepted correction.
- Release Docs requires an explicit confirmed release operation.
- No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority.

## Control outcomes

RSP uses a transient Skill Control Model to explain the current decision without creating a persisted controller state. Core chooses one peer route: a specialist Discipline, bounded direct execution, managed execution, return to Shape, or stop. Direct execution stays limited to one ready owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor; if that boundary expands, Core derives the route again.

Ownership questions, execution uncertainty, and acceptance are separate phases. A stop must say who acts next, what input is required, and whether work resumes through Intake, returns through Shape, reroutes through Core, or waits for fresh evidence, environment, verification, or capability. Missing required worker creation or a missing valid receipt is unavailable evidence, never successful completion. Acceptance remains incomplete until every required result is fresh and valid; lifecycle or local-commit eligibility is derived only after clean durable review.

These outcomes exist only in the current response and host execution context. Changes and Groups remain the durable owners, and their lifecycle remains `open` or `archived`.

## Managed automation

Manage is a controller for eligible long-running, recovery, multi-slice, repeated-convergence, real-host acceptance, or lifecycle delivery work. Direct one-step and small tightly coupled work remains direct.

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` controls selection:

- `explicit`: Manage is selected only when explicitly requested.
- `auto`: after preserving Review, release, isolated Design, and complete small-work exceptions, Core routes every other requested completion or continuation through a no-mutation Manage Intake.

Intake returns exactly one owner result: `ready`, `needs-shape`, `needs-owner`, or `out-of-goal`. It does not focus another owner, dispatch work, or mutate planning or product artifacts. Shape has two distinct return paths: Intake `needs-shape` returns unresolved ownership to Shape, while a qualified managed frontier `fog` returns `StopDisposition: return-to-shape`. In both cases Shape returns a ready owner to Core for fresh route derivation; Manage never resumes directly from Shape. Only a fresh `ready` Intake result can enter managed execution.

During managed execution, newly surfaced uncertainty is classified in fail-closed order as out-of-goal, owner decision, fog, factual evidence needed, or ready to execute. Each transient worker packet fixes the WorkRef, lane objective, current hypothesis and evidence, allowed paths/actions/commands, prohibited actions, comparison baseline, result schema, and stop conditions. Token counts and limits never control dispatch, routing, authority, completion, or acceptance.

Diagnose and private Inspect lanes are read-only; Fix is the sole writer at its mutation boundary. Private Verify is independently executed only when a worker identity distinct from Fix can be established; otherwise Manage reports independence as unavailable and does not claim independent verification. Optional evidence work cannot consume dispatch capacity already required by the current Fix/Verify acceptance path, and a corrective retry starts only when decisive verification remains possible. Lane state, packets, receipts, counts, and chronology remain transient.

`closeout` sets a ceiling after Manage has actually been selected and qualified:

- `manual`: archive and commit remain manual.
- `lifecycle`: durable review may be followed by archive; commit remains separate.
- `local`: permits lifecycle closeout and, at an eligible clean verified non-small terminal boundary, one separately justified local commit.

`activation` never grants planning or product-mutation authority. For a currently selected and qualified Manage run, `closeout` is only the automatic lifecycle/local-Git ceiling described above and nearer restrictions may narrow it. Push, tags, releases, publication, deployment, approval, human acceptance, and other external actions always remain explicit.

Managed interruption and resume do not create persisted controller or paused state. A pause stops active work but preserves the focused WorkRef; resume rereads authority, status, diff, blockers, and verification before requalification.

See [configuration](../reference/configuration.md) for the exact keys and [daily workflow](./daily-workflow.md) for ordinary operation.
