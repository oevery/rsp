---
name: distill-upstream
description: Complete prepared RSP upstream research under research/upstreams and synthesize research/models without changing final product artifacts. Use when reviewing evidence created by scripts/upstreams.mjs prepare for conform, model, adapt, or tooling sources, or when combining completed source reports into a cross-source model.
---

# Distill Upstream

Turn pinned upstream evidence into traceable maintainer research. Keep raw source data in cache, semantic research under `research/`, and final RSP changes behind a separate user-selected change.

## Source distillation

1. Run `node scripts/upstreams.mjs status <source>` and follow its `next` action. Fix unmatched required paths before research. Use `prepare --initial` only when status reports `prepare-initial`.
2. Read its matching `.cache/upstream-distillation/<source>/<revision>/evidence.json`, `files.txt`, and `diff.patch` when present. Treat revision and evidence hash as immutable provenance.
3. Load exactly one strategy reference:
   - `conform` → [references/conform.md](references/conform.md)
   - `model` → [references/model.md](references/model.md)
   - `adapt` → [references/adapt.md](references/adapt.md)
   - `tooling` → [references/tooling.md](references/tooling.md)
4. Read only the changed or initial-scope upstream files needed to support findings. Cite repository-relative paths and distinguish evidence from inference.
5. Complete every report section. Tie applicable mechanisms to a concrete RSP gap; record attractive but unsuitable ideas under `Rejected`. For `adapt` and `tooling`, record license, reuse mode, attribution, and eligible paths; unknown or incompatible licensing limits the recommendation to model-only or independent reimplementation.
6. Keep recommendations as research options. Do not edit `src/`, `rules/`, published `skills/`, `.rsp/specs/`, or create an RSP change during distillation.
7. Give recommendations stable IDs (`R1`, `R2`, ...) and set `status: complete` only when all required sections contain evidence-backed conclusions and no TODO/TBD placeholders remain.
8. Do not run `accept` unless the user separately asks to advance the reviewed revision.

## Cross-source model

Create or update `research/models/<topic>.md` only when the user asks to synthesize two or more completed source reports.

- Cite source-report paths and revisions, not raw cache files.
- Add frontmatter `sources` entries in `<source>@<revision> -> <report-path>` form so later status checks can identify stale inputs without another lock file.
- Separate shared mechanisms, disagreements, RSP gaps, rejected ideas, and candidate recommendations.
- Keep RSP's current product files as the authority. A model is intermediate research, not a rule or design decision.
- Do not promote a recommendation until the user selects it for a normal RSP change.

## Guardrails

- No local RSP problem or gap means no adoption recommendation.
- Extract mechanisms and constraints; do not reproduce an upstream workflow wholesale.
- Prefer one owning RSP target per future recommendation.
- Preserve license and attribution requirements for any future direct adaptation.
- When a recommendation is selected, require the normal RSP change to cite its report path, recommendation ID, and adoption mode (`adapted`, `independent-reimplementation`, or `model-only`). Do not add a promotion command or research lock.
- Never regenerate or overwrite existing research content automatically.
