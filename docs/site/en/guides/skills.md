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

## Managed automation

Manage is a controller for eligible long-running, recovery, multi-slice, repeated-convergence, real-host acceptance, or lifecycle delivery work. Direct one-step and small tightly coupled work remains direct.

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` controls selection:

- `explicit`: Manage is selected only when explicitly requested.
- `auto`: Core may select Manage for a qualified requested completion or continuation.

`closeout` sets a ceiling after Manage has actually been selected and qualified:

- `manual`: archive and commit remain manual.
- `lifecycle`: durable review may be followed by archive; commit remains separate.
- `local`: permits lifecycle closeout and, at an eligible clean verified non-small terminal boundary, one separately justified local commit.

Configuration never grants planning, product mutation, lifecycle, Git, publication, approval, or human-acceptance authority. Push, tags, releases, deployment, and external actions always remain explicit.

Managed interruption and resume do not create persisted controller or paused state. A pause stops active work but preserves the focused WorkRef; resume rereads authority, status, diff, blockers, and verification before requalification.

See [configuration](../reference/configuration.md) for the exact keys and [daily workflow](./daily-workflow.md) for ordinary operation.
