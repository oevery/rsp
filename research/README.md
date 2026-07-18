# RSP maintainer research

`research/` contains tracked intermediate knowledge used to improve RSP. It is excluded from the npm package and is never a runtime authority.

- `upstreams/<source>/<revision>.md`: immutable-revision source distillations produced from prepared evidence.
- `models/<topic>.md`: optional cross-source synthesis that cites completed source distillations and records each `<source>@<revision> -> <report-path>` input in frontmatter.

Mechanical diffs, file inventories, and temporary eval work belong under ignored `.cache/upstream-distillation/`. Give recommendations stable IDs such as `R1`. A recommendation reaches final `src/`, `rules/`, `skills/`, docs, or `.rsp/specs/` only through a separately selected normal RSP change whose `Design` cites the report path, recommendation ID, and adoption mode.

Run `node scripts/upstreams.mjs prepare <source>` to scaffold a source report, then load the repo-local `distill-upstream` skill. Do not edit an existing source report through regeneration; each report is owned by its exact candidate revision.

Use this minimal promotion provenance in the selected RSP change:

```markdown
### Research provenance
- Source report: research/upstreams/<source>/<revision>.md
- Recommendation: R1
- Adoption: adapted | independent-reimplementation | model-only
```
