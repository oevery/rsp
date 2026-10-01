# RSP maintainer research

`research/` contains readable, tracked knowledge used to improve RSP. It is excluded from the npm package and is never a runtime authority.

- `upstreams/<source>/<revision>.md`: managed Git distillations produced from pinned evidence; `upstreams/<source>/<date>.md` may instead hold a targeted web snapshot report.
- `models/<topic>.md`: optional cross-source synthesis that cites completed source distillations and records each `<source>@<revision-or-snapshot-id> -> <report-path>` input in frontmatter.
- `evaluations/`: unchanged historical reports, necessary run identity/outcome metadata and small reference evidence. Selected private evidence belongs in cold storage; obsolete tracked raw files and execution scripts use fixed-history Git recovery, not duplicate active trees.
- `local-skills/`: readable provenance snapshots, retained as historical research rather than executable packages.

Use [archive recovery](ARCHIVE-RECOVERY.md) when an immutable report refers to retired raw files or old cache paths. Reports keep their original wording and verdicts; the recovery guide, not a rewritten historical report, owns relocation information.

Prepared upstream diffs and inventories remain under ignored `.cache/upstream-distillation/`, backed by the pinned checkouts in `.cache/upstreams/`. Keep `.cache/rsp-package-install/` for offline packed-install checks. Selected model evidence and unique experimental files belong under ignored `tests/skills/reports/legacy/`, with private permissions and verified path mappings. This is not a complete backup of retired dirty workspaces: disposable runtime material is removed, and identical Git content relies on the recorded fixed history. Give recommendations stable IDs such as `R1`. A recommendation reaches final product artifacts only through a separately selected RSP Change whose Design cites its source report, recommendation ID and adoption mode.

For managed Git research, run `node scripts/upstreams.mjs prepare <source>` to scaffold a source report, then load the repo-local `distill-upstream` skill. Do not edit an existing source report through regeneration; each report is owned by its exact candidate revision. Managed `status` exposes `nextAction` as guidance, not authority: `accept` always requires a separate user request.

For targeted web research, record the retrieval date, URLs, content hashes, retained source locations, retrieval gaps, and license, attribution and reuse limits. Distinguish source facts from local inference. Use a dated snapshot identity, not a fabricated Git revision; this path needs no registry change or new framework and never advances a managed baseline. See [the writing-guide snapshot](upstreams/writing-guides/2026-09-30.md) for an existing example.

## Candidate handoff

Begin candidate work only for one observed RSP gap. The selected Change records the baseline failure, the smallest sufficient behavioral contract that closes it, hard authority boundaries, returned owner, and minimal provenance:

```markdown
### Capability delta
- Baseline failure: <observed RSP workflow failure>
- Native behavior: <smallest sufficient contract for the demonstrated gap>
- Hard boundaries: <authority and mutation limits>
- Returned owner: <existing project or RSP artifact>

### Research provenance
- Source report: <managed revision report or dated snapshot report>
- Recommendation: R1
- Adoption: adapted | independent-reimplementation | model-only
```

Complete path inventories and cross-source models are optional audit evidence, not candidate prerequisites. Use code tests for observable program/package contracts and the shared `tests/skills/` project/case runner for separately authorized model-backed task validation. Offline readiness is not model acceptance. Baseline comparisons, unseen holdouts and repeated statistical campaigns are optional research designs, not mandatory daily or release gates; release only aggregates the two verification lanes.

Evaluate real task success, user correction, total input/output tokens, elapsed time, and tool calls. Do not optimize a candidate against fixed response tokens or treat input-token overhead alone as proof of quality.
