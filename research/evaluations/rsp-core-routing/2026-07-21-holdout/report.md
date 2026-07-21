---
candidate: rsp
candidate_version: "2026.07.21.1"
candidate_hash: sha256:baa65c43183e8666c613bd6dffed83fe5ae8704a1299ddf8481e0a5ada0969bf
fixture_hash: sha256:08c3f5d9ffeb9f3a93bd9d73d117ea8bd03a3323d7a393cf7dbc22b94b260a41
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-21
status: passed
recommendation: promote
---

# RSP Core Routing Holdout

## Decision

Promote the compact Core routing contract. Six isolated read-only cases returned one evidence-backed next action without hidden stage state, catalog enumeration, recursive Skill invocation, or inferred mutation authority.

## Selected provenance

- `rsp-skill-system` S3: model-only selection of a Core-derived stage and one next action without a router catalog.
- `rsp-skill-system` S8: model-only ordering constraint; refine Core only after Shape and Implement promotion, then defer full cross-Skill composition to the sibling composition Change.
- Capability C01: independent reimplementation of one-action routing and missing-capability fallback; no upstream catalog text was copied.
- Capability C45: model-only evidence for progressive routing from intent and repository maturity, without LifeOS coupling.
- Capability C46: readiness and ambiguity concepts enter only through the already promoted `rsp-shape`; no `.scratch` status, PRD file, or second tracker was imported into Core.

## Final holdout results

| Case | One next action | Optional capability | Result |
| --- | --- | --- | --- |
| no-focus | Focus `ready-work` after mutation authorization | none | pass |
| ambiguous-focus | Ask the owner to select `first` or `second` | none | pass |
| incomplete-shape | Invoke `rsp-shape` with the missing product evidence | `rsp-shape` | pass |
| implementation-ready | Invoke `rsp-implement` for `ready` | `rsp-implement` | pass |
| review-requested | Invoke `rsp-review` for the fixed Document scope | `rsp-review` | pass |
| archive-ready | Archive `complete` after the Core durable decision | none | pass |

The final output hashes, in table order, are `39d6452ae88da0b17a362ab861a5111ce085c12d30d81333d7186a9304d70ccb`, `1747735fbf0d75fa8a3f8d2c81aa981284613280c485977e75f32f5560765e3d`, `21a7fad79858450be7b8313e9c0740adef011b6417f1a6c9524ee47a57c989e3`, `8ae1e303928a1967c0ae79e9d498266d73d1f3a3e6213bc5a4236e08fb11f138`, `1d64bdc3cf7f0f0e32baee7b8708abbb9d8e9093c45ffb0f6ce01ade9e40a0a7`, and `daba6cb6c9b408c58373cdff8eb968a0f6e4a7ef706eb63d13363baebe6928ac`.

## Corrections and controls

- The first no-focus run chose the correct focus operation but also named `rsp-implement`. The contract was tightened test-first: an optional capability is named only when it is the one next action, and availability comes only from the host's loaded skill inventory. The frozen candidate then passed the case with no optional capability.
- A review prompt without an immutable scope correctly stopped for that input. The final review case supplied `.rsp/changes/done.md` as the fixed Document scope and routed only to `rsp-review`.
- Initial pre-archive runs exposed stale fixture protocol metadata. The fixtures were repaired with the current RSP config and fallback before final evaluation; those setup failures are not counted as candidate results.
- Every final run used an isolated Git repository, read-only sandbox, Core plus at most one case-relevant optional capability, the same model/effort/provider, and current deterministic `rsp` status through a local executable shim.

## Evidence boundary

Raw provider logs, generated outputs, fixture repositories, and the executable shim remain ignored under `.cache/core-routing-holdout/`. This is one small forward holdout, not a repeated provider matrix, host matrix, or release cost calibration. Full suite composition remains owned by `minimum-skill-suite/validate-skill-composition`.

## Automated verification

- Agent Skills schema validation passed for `skills/rsp`.
- The focused Core contract and version checks passed; the complete project suite passed with 12 files and 267 tests.
- Build, typecheck, lint, focused RSP check, and `git diff --check` passed.
- `npm pack --dry-run --ignore-scripts` included all four published Skills and excluded research, tests, `.rsp`, and temporary holdout artifacts.
