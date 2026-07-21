---
skill: rsp-diagnose
status: passed
date: 2026-07-21
---

# RSP Diagnose Forward Evaluation

## Result

The concise canonical Skill passed its focused contract test and one fresh read-only holdout. The run reproduced the symptom, localized the live cache path, used a discriminating loader-call probe, confirmed the cause over a loader hypothesis, bounded the impact, and returned one correction entrypoint to the selected Change without modifying production or workflow state.

This is one Codex-host result, not repeated-provider, cross-host, flaky, concurrency, or performance evidence.

## Isolation

- Workspace: a fresh Git repository copied from `test/rsp-diagnose/holdout/base/`.
- Installed capability: only `skills/rsp-diagnose/`, copied to the workspace's Skill discovery path.
- Configuration: an ephemeral provider-only `HOME` and `CODEX_HOME`; no user Skills, plugins, MCP servers, memories, or host projections were copied.
- Sandbox: read-only.
- Model: `gpt-5.6-sol`.
- Reasoning effort: `low`.
- Raw events, final output, stderr, metadata, and the transient workspace remain ignored under `.cache/rsp-diagnose-forward/`. The transient provider configuration was deleted after execution.

## Sanitized prompt

> Use the installed `rsp-diagnose` Skill to diagnose the selected Change in this isolated workspace. Reproduce the reported failure and return the diagnosis to that Change. Investigation is read-only: do not modify any file or apply a production correction. Do not stage, commit, push, publish, deploy, approve, review, or archive.

The prompt names neither the expected cause nor the discriminating observation.

## Evidence

- Exit: `0`.
- Duration: `61,409 ms`.
- Usage: `85,765` input tokens (`77,056` cached), `1,213` output tokens, and `151` reasoning-output tokens.
- Final output SHA-256: `0d685c2b3040cf4a9a603628a4b849a267dfc4e735aa728cc9d1c11a33aa4f2b`.
- Worktree before: clean.
- Worktree after: clean.
- The final returned `confirmed`, the selected Change, reproduction evidence, cause and affected owner, decisive evidence, impact boundary, no investigation mutations, and exactly one correction action.

## Static validation

- `python3 .../quick_validate.py skills/rsp-diagnose`: unavailable because the installed Python environment lacks `PyYAML` (`ModuleNotFoundError: No module named 'yaml'`).
- `mise exec -- pnpm exec vitest run test/rsp-diagnose-skill-contract.test.ts`: passed, 3 tests.

The focused contract test independently checks portable identity, concise host-neutral payload, ordered evidence stages, confirmation quality, mutation authority, truthful unresolved output, return ownership, and absence of a host projection.
