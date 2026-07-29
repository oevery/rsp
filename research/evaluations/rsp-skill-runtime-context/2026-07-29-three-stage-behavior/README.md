---
evaluation: rsp-skill-runtime-context-three-stage-behavior
date: 2026-07-29
model: gpt-5.6-terra
effort: low
codex_cli: 0.144.6
status: blocked-provider-unavailable
recommendation: do-not-claim-behavior-equivalence
---

# RSP Skill runtime-context three-stage evaluation

## Result

The immutable identity contains exact `current`, `structural`, and `combined` inputs for the same eight routing cases. The three isolated provider attempts did not produce a final response or token usage. Each exited with code `1` without timing out. A separate minimal read-only diagnostic using the same model, effort, ignored user config/rules, and ephemeral execution reported that the Codex usage limit had been reached.

This evidence therefore does **not** establish behavior equivalence. The fixed deterministic contract suite remains useful local evidence, but it cannot replace the requested provider-level evaluation. The Change must retain a blocker until a fresh immutable identity can execute the same cases through an available pinned provider.

## Frozen variants

| Variant | Primary composition | Bundle SHA-256 | Provider result |
| --- | --- | --- | --- |
| `current` | HEAD Core + HEAD Implement | `d2518a9c2b3073cd17e5fbf065aa58359fbb1a0b4b7f640c308de91b15f4b1ea` | exit 1; no final/usage |
| `structural` | candidate Core + HEAD Implement | `0bc02239d35791777305e9f2f83c7559e438d9f349d5eecee3a401d9c7afb10e` | exit 1; no final/usage |
| `combined` | candidate Core + candidate Implement | `45ada17abfb244f94495a4c271f07d228f519c9ed1d72aae2c47c4ec3ffbcdf2` | exit 1; no final/usage |

Every per-file hash, prompt hash, schema hash, case hash, oracle hash, duration, exit status, final hash, usage observation, and limitation is retained in `runs/<variant>/metadata.json`. `score.json` truthfully records a parse failure because no final response existed. No output is synthesized.

## Fixed cases

The same `cases.json`, `oracle.json`, and output `schema.json` cover:

1. ordinary Implement;
2. unexplained Diagnose;
3. concrete-risk-qualified TDD;
4. missing mutation authority;
5. unavailable release fallback with unconfirmed identity and an unclean candidate;
6. ambiguous archived selection without lifecycle authority;
7. selected Manage status inquiry; and
8. selected Manage explicit pause.

## Cost observation

`token-counts.json` uses `tiktoken` `o200k_base` against the frozen sources. The representative Core plus Implement composition changes `3848 → 3386 → 3371` tokens (`current → structural → combined`). Structural ownership and conditional loading account for 462 tokens; the notation-only Implement rewrite accounts for another 15. The combined path is 477 tokens (12.40%) below current.

These are static input counts, not provider usage. The failed provider attempts exposed no usage telemetry.

## Reproduction and limitations

`run.mjs` is the one-off retained runner. It invokes three serial, read-only, ephemeral `codex exec` calls with `--ignore-user-config`, `--ignore-rules`, `--model gpt-5.6-terra`, and `model_reasoning_effort="low"`. It embeds exact Skill texts and forbids tools or external context.

- One attempted run per variant is retained; there is no repeated stochastic calibration.
- The prompt-level matrix does not exercise repository discovery or tool use.
- The provider boundary failed before a model final response, so no behavior or provider-token conclusion is available.
- A future retry must use a new identity; do not overwrite this directory or weaken its oracle.
