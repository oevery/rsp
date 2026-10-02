---
name: distill-upstream
description: Distill managed Git evidence or targeted web snapshots under research/upstreams, or synthesize completed reports under research/models. Use for conform, model, adapt, or tooling research without changing final product artifacts or advancing managed baselines.
---

# Distill Upstream

Turn pinned upstream evidence into traceable maintainer research. Keep raw source data in cache, semantic research under `research/`, and final RSP changes behind a separate user-selected change.

Choose the source question and authorized report target before collecting evidence. Research owns source interpretation and recommendations, not product decisions or managed baseline advancement. Use permitted reading or retrieval methods that preserve scope and source identity; never execute cached repositories or source examples.

## Select source evidence

Inspect completed reports for the question, recommendation IDs, source identity, reuse limits and gaps. Reuse sufficient evidence under its original identity without recollection, regeneration or another synthesis. New authorized collection needs a missing claim or freshness question; reuse proves neither latest-source coverage nor current-model performance.

For a registered managed Git source needing preparation or fresh distillation:

1. Run `node scripts/upstreams.mjs status <source>` and inspect `nextAction`. It is a status recommendation, not authorization; `accept` requires a separate user request to advance the reviewed revision. Fix unmatched required paths before research. Use `prepare --initial` only when status reports `prepare-initial`.
2. When managed preparation is authorized and needed, run `node scripts/upstreams.mjs prepare <source>` with the indicated initial mode. This exact operation generates provenance and creates a draft without overwriting an existing report; manual research cannot replace it. Read its matching `.cache/upstream-distillation/<source>/<revision>/evidence.json`, `files.txt`, and `diff.patch` when present. Treat revision and evidence hash as immutable provenance.

If a managed tool fails, inspect candidate refs, evidence files and the report before recovery. Diagnose a tool-only obstacle without changing the source, baseline or required provenance; continue only safe read-only or proven repeat-safe work within authority. Unknown mutation, unsafe one-shot replay or unavailable required evidence stops the affected operation. Do not regenerate or overwrite existing research automatically, manually advance the lock or bypass managed `accept` validation.

For an authorized targeted web snapshot, use `research/upstreams/<source>/<date>.md` without registering a managed upstream:

- Record retrieval date, exact URL, content hash and retained source location for each page. Label the identity as a dated snapshot, not a Git revision.
- State missing, partial or inaccessible content and limit conclusions to what was retrieved. Separate source facts from local inference.
- Record license, attribution and reuse boundaries; unknown or incompatible licensing permits model-only recommendations or independent reimplementation, not copied text or code.
- Do not use managed prepare/accept, change the registry or lock, or advance a managed baseline for this snapshot. No new snapshot framework is required.

## Source distillation

When existing evidence answers the request, return its supported conclusions and limits without reopening collection. For new or unfinished distillation, load only the matching strategy:

- `conform`: [standards compatibility](references/conform.md).
- `model`: [peer domain models and ownership](references/model.md).
- `adapt`: [small reusable assets and adoption limits](references/adapt.md).
- `tooling`: [deterministic mechanisms and trust boundaries](references/tooling.md).

Read only evidence needed for findings; cite exact source paths/URLs and retained identity, separating facts from inference. Complete managed report sections or snapshot sources, mechanisms, local gaps, recommendations, rejected transfer and verification limits. Extract mechanisms rather than whole workflows; propose adoption only for a concrete RSP gap.

For `adapt` and `tooling`, record license, reuse mode, attribution and eligible material; unknown/incompatible licensing permits only model-only or independent reimplementation. Give recommendations stable IDs (`R1`, `R2`, ...). Set `status: complete` only with supported conclusions, explicit retrieval gaps and no TODO/TBD placeholders; an essential missing source leaves its conclusion unresolved.

Keep recommendations as research options. Do not edit `src/`, `rules/`, published `skills/`, `.rsp/specs/`, or create an RSP Change during distillation. Completion does not authorize managed `accept` or candidate work.

## Cross-source model

Only when the user asks to synthesize two or more completed source reports, read [cross-source synthesis](references/cross-source-model.md) before creating or updating `research/models/<topic>.md`. A model is research, not product authority or adoption.

## Candidate handoff

When returning a concrete RSP candidate option or preparing its research handoff, read [candidate handoff](references/candidate-handoff.md) for the smallest contract, source/reuse identity and proportionate evidence. Distillation completion grants no candidate mutation or evaluation authority; adoption needs a separately selected normal RSP Change.

Return report paths, pinned identities, recommendation IDs, source gaps and unresolved conclusions, then the smallest useful next decision. Report completion establishes traceable research, not adoption, measured improvement, managed acceptance or permission to execute candidate evaluation.
