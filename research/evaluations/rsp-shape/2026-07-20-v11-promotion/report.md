---
candidate: rsp-shape
candidate_version: "2026.07.20.11"
candidate_hash: sha256:70edf945b2b7cb6fb8ee851358024ba33353ad4f716a196b7a2b50ed13e19b4b
fixture_hash: sha256:d4195aa591c5b25e02dcb7fd744d796594dfb3ac2b28c54cdd34f0ad2cf0c47e
harness_hash: sha256:a411c3b0f5101bf1c5c4aceefe9304f946d655151bbc31a2877cc173e1828371
config_fingerprint: sha256:51ee57fd7c2be95a541266daa7ef987baa50189b56339e4477a348f8e220ee16
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-20
status: promoted
recommendation: promote
---

# RSP Shape v11 Promotion Evidence

## Decision

Promote exact payload `70edf945b2b7cb6fb8ee851358024ba33353ad4f716a196b7a2b50ed13e19b4b`. It passed all frozen static, behavior, authority, isolation, and context-cost gates. The payload moved unchanged from `research/candidates/skills/rsp-shape/` to `skills/rsp-shape/`; no candidate copy remains.

## Frozen identity and isolation

- Candidate: `70edf945b2b7cb6fb8ee851358024ba33353ad4f716a196b7a2b50ed13e19b4b`
- Fixtures: `d4195aa591c5b25e02dcb7fd744d796594dfb3ac2b28c54cdd34f0ad2cf0c47e`
- Harness: `a411c3b0f5101bf1c5c4aceefe9304f946d655151bbc31a2877cc173e1828371`
- Sanitized configuration: `51ee57fd7c2be95a541266daa7ef987baa50189b56339e4477a348f8e220ee16`
- Settings: `custom`, `gpt-5.6-terra`, low effort, workspace-write sandbox, 360000 ms timeout, concurrency 6
- Each run used its own provider-only `CODEX_HOME` with identical content and fingerprint. MCP servers were omitted; plugins, remote plugins, apps, browser, computer use, memories, multi-agent, tool suggestion, workspace dependencies, and related external features were explicitly disabled. Secrets were redacted from the fingerprint and never written to evidence.

## Behavior and cost evidence

Three fresh complete 15-case paired matrices passed, for 90 runs total:

- repetition 1: `40577f4619e152699e965b4a3589d51f830fcc4c9f596d6f5dba3755c0c53815`
- repetition 2: `90a70a180bc4cd1890ff1fa40ac28d33ca78fac483494e60ccbed18a17622750`
- repetition 3: `3729bd5d4726d4cd3d933f14461cb1191c8e531dc5f51e02c5960eb1cdc68353`

The final calibration record is `.cache/rsp-shape-v11-final-calibration/calibrations/2026-07-20T14-20-53-909Z.json`. All matrices passed with complete usage and no timeout. Aggregate median input overhead was `8.31%` against the `30%` threshold. The highest per-case median was `41.71%` (`dirty-preservation`) against the `50%` threshold; no case exceeded its limit.

The matrix covers new/refined/settled Changes, multi-round clarification, ambiguity and authority stops, missing evidence, dirty preservation, tiny-task restraint, optional grilling, shallow Groups, cohesive work, redundant and terminal delivery, and forbidden hierarchy/cross-repository requests. Scope gates observed source/focus/Git/publication restraint and required authorized mutations.

## Static and package evidence

- Offline Agent Skills schema validation passed for the exact payload.
- Shape contract and behavior tests passed, including per-run provider-home isolation, external-feature disablement, Git metadata protection, read-only Git diagnostics, frozen run identities, and concurrency bounds.
- Project build, typecheck, and lint passed.
- The default full test suite passed twice in quiet runs: 13 files and 285 tests. A concurrent run overlapped another provider smoke and produced timing-only failures; isolated affected tests and a single-worker full suite also passed.
- Both `npm pack --dry-run --ignore-scripts` and an inspected local tarball included `skills/rsp-shape/SKILL.md` and excluded research candidates, tests, and evaluation artifacts.
- `git diff --check` and focused RSP validation passed.

## Durable decision

- Current fact target: `.rsp/specs/design.md`, deferred to the shared minimum-suite integration slice as requested.
- User documentation target: `README.md` and `README.zh-CN.md`, deferred to shared integration.
- Decision Record: none; this is execution of the already selected minimum-suite promotion contract.
- Archive ready: no; shared documentation remains open in this Change.
