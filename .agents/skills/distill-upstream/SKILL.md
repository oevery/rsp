---
name: distill-upstream
description: Distill managed Git evidence or targeted web snapshots under research/upstreams, or synthesize completed reports under research/models. Use for conform, model, adapt, or tooling research without changing final product artifacts or advancing managed baselines.
---

# Distill Upstream

Turn pinned upstream evidence into traceable maintainer research. Keep raw source data in cache, semantic research under `research/`, and final RSP changes behind a separate user-selected change.

## Select source evidence

For a registered managed Git source:

1. Run `node scripts/upstreams.mjs status <source>` and inspect `nextAction`. It is a status recommendation, not authorization; `accept` requires a separate user request to advance the reviewed revision. Fix unmatched required paths before research. Use `prepare --initial` only when status reports `prepare-initial`.
2. Read its matching `.cache/upstream-distillation/<source>/<revision>/evidence.json`, `files.txt`, and `diff.patch` when present. Treat revision and evidence hash as immutable provenance.

For an authorized targeted web snapshot, use `research/upstreams/<source>/<date>.md` without registering a managed upstream:

- Record retrieval date, exact URL, content hash and retained source location for each page. Label the identity as a dated snapshot, not a Git revision.
- State missing, partial or inaccessible content and limit conclusions to what was retrieved. Separate source facts from local inference.
- Record license, attribution and reuse boundaries; unknown or incompatible licensing permits model-only recommendations or independent reimplementation, not copied text or code.
- Do not use managed prepare/accept, change the registry or lock, or advance a managed baseline for this snapshot. No new snapshot framework is required.

## Source distillation

1. Load the strategy reference matching the source question:
   - `conform` → [references/conform.md](references/conform.md)
   - `model` → [references/model.md](references/model.md)
   - `adapt` → [references/adapt.md](references/adapt.md)
   - `tooling` → [references/tooling.md](references/tooling.md)
2. Read only the changed or initial-scope files or snapshot content needed to support findings. Cite exact source paths or URLs and retained evidence; distinguish source facts from inference.
3. Complete the managed report's required sections, or cover sources, mechanisms, local gaps, recommendations, rejected transfer and verification limits in a snapshot report. Tie applicable mechanisms to a concrete RSP gap. For `adapt` and `tooling`, record license, reuse mode, attribution, and eligible source material; unknown or incompatible licensing limits the recommendation to model-only or independent reimplementation.
4. Give recommendations stable IDs (`R1`, `R2`, ...) and set `status: complete` only when the required content has evidence-backed conclusions, retrieval gaps are explicit and no TODO/TBD placeholders remain. A missing source essential to a conclusion leaves it unresolved.

Keep recommendations as research options. Do not edit `src/`, `rules/`, published `skills/`, `.rsp/specs/`, or create an RSP Change during distillation. Completion does not authorize managed `accept` or candidate work.

## Cross-source model

Create or update `research/models/<topic>.md` only when the user asks to synthesize two or more completed source reports.

- Cite source-report paths and their Git revisions or dated snapshot identities, not raw cache files.
- Add frontmatter `sources` entries in `<source>@<revision-or-snapshot-id> -> <report-path>` form for traceability. Recheck them against the cited reports when updating a model; managed status checks registered Git reports, not synthesis freshness or unregistered web snapshots.
- Separate shared mechanisms, disagreements, RSP gaps, rejected ideas, and candidate recommendations.
- Keep RSP's current product files as the authority. A model is intermediate research, not a rule or design decision.
- Do not promote a recommendation until the user selects it for a normal RSP change.

## Candidate handoff

Distillation completion does not imply candidate work. Start a candidate only when a normal RSP Change names:

- one observed RSP workflow failure or missing capability;
- the smallest sufficient behavioral contract that closes the demonstrated gap;
- hard authority and mutation boundaries;
- one existing artifact owner that receives the result;
- only the source reports, recommendation IDs, and adoption modes needed for that delta.

Do not require a complete capability catalog, another cross-source model, or acceptance of unrelated revisions. Retain those artifacts only when the user asks for audit coverage or the candidate genuinely depends on multiple conflicting sources.

Select candidate evidence by changed risk and the claim being made:

- Static package checks establish structure; behavioral acceptance needs actual task execution and independent review through the existing shared runner. A single candidate is valid.
- Comparisons, unseen holdouts, repeated matrices, cost calibration and additional-host evidence are optional designs when the question warrants them, not routine or release gates; execution and model cost require authorization.
- For performance claims, measure task success and corrections alongside total input/output tokens, elapsed time and tool calls. Input-token overhead alone is not a quality result.

## Guardrails

- No local RSP problem or gap means no adoption recommendation.
- Extract mechanisms and constraints; do not reproduce an upstream workflow wholesale.
- Prefer one owning RSP target per future recommendation.
- Preserve license and attribution requirements for any future direct adaptation.
- When a recommendation is selected, require the normal RSP change to cite its report path, recommendation ID, and adoption mode (`adapted`, `independent-reimplementation`, or `model-only`). Do not add a promotion command or research lock.
- Stop research-to-candidate translation once the selected capability delta is supported; do not restate the same contract through successive coverage, capability, and system models.
- Never regenerate or overwrite existing research content automatically.
