---
capability: rsp-implement
candidate_version: "2026.07.20.18"
candidate_tree_hash: sha256:d7a0dc5316daf66a8ecac0963c1e287b716f9c7c8399f9af4c92d7f1609b04a2
evaluation_candidate_hash: sha256:7fe59afcbf6aee36c72004e46dab4917ba2a33f2a54f47d6c7f7ef101271a473
fixture_hash: sha256:4a9538235ec68a2068ce7752be25d50b1c5bd08309aa565786e427d28b589c34
harness_hash: sha256:9c4394b04aea6731a6dbc6c6b9a11310050551d6a962f4825fa832ceaa696e60
config_fingerprint: sha256:7946992dfd10590182df1b4bac3bcc6df0484fc6537980a0962e87b678bdff76
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-20
status: promoted
promotion: performed
---

# `rsp-implement` v18 promotion evidence

## Decision

Promote exact payload `d7a0dc5316daf66a8ecac0963c1e287b716f9c7c8399f9af4c92d7f1609b04a2`. The research candidate passed the frozen authority, behavior, isolation, safety, and context-cost gates, then moved unchanged to `skills/rsp-implement/`; no research candidate copy remains.

Shared `README.md`, `README.zh-CN.md`, and `.rsp/specs/design.md` integration remains outside this slice.

## Frozen identity and provider isolation

- Evaluation candidate: `7fe59afcbf6aee36c72004e46dab4917ba2a33f2a54f47d6c7f7ef101271a473`
- Candidate tree before and after promotion: `d7a0dc5316daf66a8ecac0963c1e287b716f9c7c8399f9af4c92d7f1609b04a2`
- Fixtures: `4a9538235ec68a2068ce7752be25d50b1c5bd08309aa565786e427d28b589c34`
- Harness: `9c4394b04aea6731a6dbc6c6b9a11310050551d6a962f4825fa832ceaa696e60`
- Sanitized configuration: `7946992dfd10590182df1b4bac3bcc6df0484fc6537980a0962e87b678bdff76`
- Settings: configured `custom` provider, `gpt-5.6-terra`, low effort, workspace-write sandbox, 360000 ms timeout, concurrency 6

Every run used an ephemeral provider-only `HOME`/`CODEX_HOME`; rules, MCP servers, plugins, apps, memory, browser/computer use, multi-agent, workspace dependencies, and other external surfaces were omitted or disabled. Provider secrets and private route values were redacted from evidence. No global configuration was modified, and no official-provider run contributed to promotion.

## Behavior and cost evidence

The full nine-case qualification matrix passed 18/18 runs and all nine candidate contracts. Its receipt hash is `db6068c49a76d73ee7ed2889a4ad661431686894b32b7011e3dd139694fd2651`; single-sample aggregate overhead was `-4.38%`, and the highest case was `37.48%`.

Three fresh complete paired matrices then passed, for 54 runs and 27/27 candidate contracts:

- repetition 1: `dd964036849f58002fd0031976b9155e7169fcb88e8b9a902c88e4c7a372c8e8`
- repetition 2: `9d9fa2b385a85713708542428bcdd350dc7a02e1045280dae991d7982383c9b8`
- repetition 3: `877e6840ced0d259922ec4f6c3a057a3fceb6d61bea6cb9a06ab9cb0e81dff38`

The final calibration record is `.cache/rsp-implement-v18-final-calibration/calibrations/2026-07-20T17-05-33-984Z.json`, receipt hash `45314059edad705698ae4136a4b994531452c469475eb26d7f6482859507bd0a`. Usage was complete, no run timed out, and every matrix retained one candidate, fixture, harness, and configuration identity.

Aggregate median input overhead was `11.20%` against the `30%` maximum. Per-case medians were:

| Case | Median overhead |
| --- | ---: |
| adversarial-shortcut | -19.59% |
| ambiguous-focus | -20.49% |
| clean-bounded | 9.00% |
| dirty-preservation | 11.23% |
| failing-verification | 11.81% |
| overengineering | 36.96% |
| prohibited-delivery | 11.20% |
| review-resolution | 13.97% |
| unavailable-verification | -5.68% |

No case exceeded the `50%` maximum.

## Resolver safety boundary

Candidate v18 replaces stochastic shell discovery with the capability-owned read-only `scripts/resolve-context.mjs` projection. Two focused safety reviews closed all P0/P1 findings before provider evaluation. Deterministic coverage includes:

- no-follow realpath containment, regular-file checks, shallow lowercase-kebab WorkRefs, focus conflicts, `.gitkeep`, Group Brief requirements, and structured nonzero errors;
- bounded traversal, scan, emit, omission, and final serialized-JSON limits, including a 300-entry repository and actual-repository self-smoke;
- explicit finding-mode identity projection, duplicate/multi-token ambiguity stops, non-generic fallback, and non-authoritative definition/reference/test hints;
- nearest owner instructions/context, hidden and sensitive owner-path exclusion, identifier token boundaries, composite secret-key redaction, and lossless status paths;
- read-only Git with optional locks and fsmonitor disabled, `--no-ext-diff`, `--no-textconv`, workspace pathspecs, and nested-parent-repository scope isolation.

The actual repository self-smoke returned `status: ok`, selected one Change, emitted 52,541 bytes under the hard cap, and found zero unredacted secret assignments.

## Static, project, and package evidence

- Offline Agent Skills validation passed for the exact promoted payload.
- Focused implementation contract/behavior gates passed: 2 files and 22 tests.
- Project build, typecheck, and lint passed.
- The full single-worker suite passed: 13 files and 292 tests. The default parallel run had one timing-only 5-second failure in `test/upstreams.test.ts`; that file then passed 15/15 in isolation before the full single-worker pass.
- Full and focused RSP checks passed; `git diff --check` passed.
- `npm pack --dry-run --ignore-scripts` includes `SKILL.md`, `NOTICE.md`, and `scripts/resolve-context.mjs`, while excluding research candidates, tests, and evaluation artifacts.
- An inspected local tarball installed with scripts disabled; the installed `rsp` reported `3.0.0`, and both the Skill and resolver were present.

## Provenance and durable boundary

The promoted payload adopts `rsp-skill-system` S5/S8 and `rsp-implementation-capability` I1-I6. The RSP ownership and resolver logic are independent implementations. The fresh-verification discipline adapts `obra/superpowers` revision `d884ae04edebef577e82ff7c4e143debd0bbec99`; `NOTICE.md` preserves its MIT notice. TDD, diagnosis, report-only review, Git delivery, and publication remain separate optional capabilities or authority boundaries.

The earlier `2026-07-20-blocked/report.md` remains historical diagnostic evidence only. Shared package/user documentation and the durable design Spec are deferred to the minimum-suite integration slice, so this Change is not archive-ready yet.
