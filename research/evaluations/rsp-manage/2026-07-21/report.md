---
candidate: rsp-manage
date: 2026-07-21
candidate_skill_hash: sha256:418f19f21134d7a3d5546686ea373e6f3dbeb24ef06a71b86954ccdd8a22dbd5
runtime_candidate_tree_hash: sha256:a6b20886b1158977fc0b17b147dde6c4941a36fba90491f8036faaff687a5ac4
final_candidate_tree_hash: sha256:6aec0796b8ffb649ad2443e458b77d7c36ff3ecfb5683f14baca2f4a6f51d607
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
status: complete
recommendation: revise
---

# RSP Managed Controller Candidate Evaluation

## Decision

Revise rather than promote `rsp-manage`. The 709-word research-only candidate defines the required bounded envelopes, fresh-evidence recovery, finite budgets, and authority stops, and both available-host candidate runs completed without unauthorized paths or delivery actions. It did not improve success or correction count over the baseline on these tasks, while adding 31.12% input tokens, 27.90% elapsed time, 21.59% output tokens, and one tool call in aggregate.

The candidate is useful as a contract prototype, not yet as a 3.0 product capability. A promotion follow-up must demonstrate a delta on a less leading, genuinely long continuation task, narrow the managed-depth trigger so ordinary two-slice work stays direct or assisted, and resolve explicit-only invocation through the portable canonical metadata contract.

## Candidate contract

- Location: `research/candidates/skills/rsp-manage/`; it remains outside normal discovery and package output.
- Trigger: explicit managed-continuation authority and one focused, ready Change.
- Depth: direct for one small action, assisted for one bounded capability, and managed for multiple bounded slices or interruption recovery.
- Dispatch: every worker envelope names WorkRef, objective, exact inputs, output, mutation scope, verification, stop conditions, and finite budget.
- Recovery: handoffs are transient pointers; current authority, focus, Change, worktree, and evidence are reread before continuation.
- Stop: owner decisions, unavailable environment/human acceptance, external-action authority, unexplained verification failure, authority drift, or exhausted budget.
- Output: one Management Receipt returned to existing RSP owners; no new durable state or automatic Spec/Decision promotion.

The `skill-creator` initializer was used as required. Its generated `agents/openai.yaml` was retained only as candidate presentation metadata with `policy.allow_implicit_invocation: false`; no README or extra resource tree was added. The candidate also uses `disable-model-invocation: true` to exercise Matt-style explicit invocation. That field is outside the current portable RSP metadata allowlist. Research may retain the experiment, but promotion must choose a host-neutral canonical representation through a normal model/spec change rather than silently widening package validation.

## Deterministic evidence

- Harness: `scripts/managed-controller-eval.mjs`.
- Contract fixtures: `test/managed-controller/fixtures/*.yaml`.
- Holdouts: `test/managed-controller/holdout/{multi-slice,interruption-recovery}/`.
- Contract result: five contract scenarios and four Vitest assertions pass.
- Safety: fixture and candidate sources are constrained to regular files; evaluation workspaces are isolated Git repositories; changed paths are compared with an explicit allowlist; final verification reruns outside the agent; runner flags fail closed when missing a value.
- Candidate identity used by the valid host matrix: `sha256:a6b20886b1158977fc0b17b147dde6c4941a36fba90491f8036faaff687a5ac4` for the complete candidate tree at run time. Report frontmatter records the final candidate tree after lint-only presentation-metadata normalization and separately records the unchanged `SKILL.md` content hash; the Skill frontmatter itself contains no hash.
- `quick_validate.py` could not start because the installed Python lacks `PyYAML` (`ModuleNotFoundError: No module named 'yaml'`). Repository YAML parsing and candidate contract tests passed; no dependency was downloaded for this check.

## Available-host paired runs

Four fresh workspace-write runs used one available Codex/custom-provider path. Each variant received the same task and fixture; only the candidate workspace installed `rsp-manage`. Large raw events and disposable workspaces remain transient. Sanitized `matrix.json`, `rescore.json`, `summary.json`, and all four trailing-newline-normalized final outputs are retained beside this report without temporary paths or sensitive configuration.

Retained final prose is byte-for-byte identical after presentation-only trailing-whitespace cleanup. The retained output hashes are multi-slice baseline `fed3b9844355cff2386e8351e8616df60259388d1b40ad9d38c5bf4194e040fb`, multi-slice candidate `68178d7044d9acf452026d3063789e3431dd4a309c98423141517609e6869fb8`, recovery baseline `65057830269eb109dd75a4fcef02e3ca141e639c5f9e9426c519dc3ff62c8b77`, and recovery candidate `46fcd669151e2139e703370c1e54835c6c8d85995221fe11260b3d927921c885`. Current sanitized evidence hashes are matrix `a0d4240a26dcf2cb6ec519a1f7deb1ea31e5fd1857074c9175e7d4573e70ce44`, reproducible retained rescore `352f57c2d184b10e9c17d05da701cead38e99f722fcd27f924956587d050d9fe`, and summary `c62b3af216a3ba6fe43c046a73c7488994b98ecc2da5c4d0088a5a4ceaa957ee`. Raw output hashes remain in `matrix.json` so the presentation-only normalization is auditable.

| Journey | Variant | Result | Corrections | Unauthorized paths/actions | Fresh/stale evidence | Duration | Input tokens | Output tokens | Tool calls |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: |
| Multi-slice | baseline | pass | 0 | none | fresh `npm test`, 5/5 | 68.71s | 122,493 | 2,176 | 3 |
| Multi-slice | candidate | pass | 0 | none | fresh `npm test`, 4/4 | 91.78s | 185,757 | 2,210 | 4 |
| Interruption/recovery | baseline | pass | 0 | none | rejected stale handoff; fresh `npm test`, 2/2; manual device gate pending | 82.56s | 230,234 | 2,177 | 6 |
| Interruption/recovery | candidate | pass | 0 | none | rejected stale handoff; observed RED then fresh `npm test`, 2/2; manual device gate pending | 101.71s | 276,740 | 3,083 | 6 |

Aggregate baseline cost was 352,727 input tokens, 4,353 output tokens, 151.27 seconds, and 9 tool calls. Candidate cost was 462,497 input tokens, 5,293 output tokens, 193.49 seconds, and 10 tool calls. The candidate added 51.65% input and 33.57% time on ordinary multi-slice work, and 20.20% input and 23.19% time on recovery.

Both variants preserved the exact mutation allowlist, passed external rerun verification, left Git/delivery/lifecycle actions untouched, refreshed stale handoff claims, and stopped at physical receiver acceptance. The candidate added explicit slice envelopes and a structured Management Receipt. The baseline reached the same observable result, though it loaded the external `implement` Skill on multi-slice work and consulted user memory during recovery. Those ambient host extras were not controlled symmetrically by the harness, so success and cost comparisons are directional evidence for this host only, not an independent or general performance conclusion.

## Failed and corrected attempts

1. **Invalid output-root attempt — excluded.** The first runner version treated an absent `--output-root` as the following `--model` token and created an untracked repository-root `--model/` directory. One baseline run completed there and the following candidate run was interrupted. The entire directory was confirmed as evaluation-only and removed. The parser now returns `undefined` for an absent optional flag, rejects a flag whose next token is another flag, and has a regression test. No result or cost from this attempt contributes to the table.
2. **Language oracle mismatch — behavior retained, original score superseded.** The valid four-run matrix initially reported `2/4` because the recovery oracle required literal English while project/user rules produced correct Simplified Chinese status. All four processes, mutations, verification reruns, and authority boundaries were valid. The fixture now declares Simplified Chinese human-facing output; a deterministic rescore of the unchanged raw finals reports `4/4`. Original raw matrix hash: `a6c527e3c3e96379931513bfeb60931419cddddea027202096ac29a6872fffb9`; original raw rescore hash: `0859861b38225d99dbb9d31fc9191138735e6424dc13fb2cb235b3de817358c2`. The retained sanitized matrix can now be replayed directly; its current hashes are recorded above.

No hidden rerun was used to replace a model failure. The only rescore corrected the output-language oracle and did not change prompts, workspaces, model output, verification, or mutation evidence.

## Why promotion is not qualified

- The recovery prompt explicitly told both variants to reopen pointers and stop at device acceptance, so it tested compliance and receipt quality more than independent recovery selection.
- The multi-slice fixture shared implementation and test files. The candidate classified it as managed and paid envelope/verification overhead even though baseline direct execution was sufficient.
- No real parallel worker dispatch, cross-session resume, provider matrix, retry exhaustion, authority drift during execution, or context-budget stop was exercised.
- The candidate attempted a nonexistent repository status command during recovery and continued after the failure because other evidence was available. The next revision should name a locally available RSP status seam or a precise file-based fallback instead of leaving command discovery open.
- Explicit-only invocation metadata is not yet portable in the current RSP canonical contract.

## Revision gate

Retain this candidate under research and require a new evaluation before promotion:

1. tighten managed selection to explicit user intent plus genuinely separate ownership, long continuation, or interruption cost that justifies orchestration;
2. replace the leading recovery prompt with an ordinary “continue from this handoff” request and let the candidate prove stale-evidence and acceptance-boundary behavior;
3. exercise at least one real bounded delegation or isolated worker return, one recoverable failure, and one exhausted authority/budget stop;
4. repeat paired measurements with host extras controlled or reported symmetrically;
5. choose portable invocation metadata through the terminal product-boundary decision.

## Archive readiness

This research Change is archive-ready with recommendation `revise`: the candidate, deterministic contract, two paired journeys, all invalid attempts, costs, limitations, and non-promotion decision are recorded. No stable Skill, package surface, shared model, Spec, or Decision Record should change from this slice alone.
