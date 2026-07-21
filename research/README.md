# RSP maintainer research

`research/` contains tracked intermediate knowledge used to improve RSP. It is excluded from the npm package and is never a runtime authority.

- `upstreams/<source>/<revision>.md`: immutable-revision source distillations produced from prepared evidence.
- `models/<topic>.md`: optional cross-source synthesis that cites completed source distillations and records each `<source>@<revision> -> <report-path>` input in frontmatter.

Mechanical diffs, file inventories, and temporary eval work belong under ignored `.cache/upstream-distillation/`. Give recommendations stable IDs such as `R1`. A recommendation reaches final `src/`, `rules/`, `skills/`, docs, or `.rsp/specs/` only through a separately selected normal RSP change whose `Design` cites the report path, recommendation ID, and adoption mode.

Run `node scripts/upstreams.mjs prepare <source>` to scaffold a source report, then load the repo-local `distill-upstream` skill. Do not edit an existing source report through regeneration; each report is owned by its exact candidate revision.

## Candidate handoff

Begin candidate work only for one observed RSP gap. The selected Change records the baseline failure, three to five RSP-specific behaviors, hard authority boundaries, returned owner, and minimal provenance:

```markdown
### Capability delta
- Baseline failure: <observed RSP workflow failure>
- Native behavior: <three to five non-default behaviors>
- Hard boundaries: <authority and mutation limits>
- Returned owner: <existing project or RSP artifact>

### Research provenance
- Source report: research/upstreams/<source>/<revision>.md
- Recommendation: R1
- Adoption: adapted | independent-reimplementation | model-only
```

Complete path inventories and cross-source models are optional audit evidence, not candidate prerequisites. Draft candidates receive schema/package validation, deterministic tests for hard safety boundaries, and a small unseen real-task holdout. Run repeated provider matrices, cost calibration, and broader host checks only after selecting a release candidate.

Evaluate real task success, user correction, total input/output tokens, elapsed time, and tool calls. Do not optimize a candidate against fixed response tokens or treat input-token overhead alone as proof of quality.
