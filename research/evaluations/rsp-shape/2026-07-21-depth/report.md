---
candidate: rsp-shape
candidate_version: "2026.07.21.2"
baseline_hash: sha256:6c10ee20302dadfb017e2bcda9abc98700f8697b4e81bdbd2ece32ba28e42589
evaluated_candidate_skill_hash: sha256:07fda44f157ada863dc306a6246beb4208a4b38a6ac029de06aa1f6132dadfd4
final_candidate_skill_hash: sha256:e92158292d4dc8f3dc6556b34832bba457e7e9b7a73749567bb7d6860eafcb50
deep_reference_hash: sha256:ac3367ef3832c83b96ce86aa2c59a038e4451adb0ae80d93754f79a2b3e8618f
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-21
status: qualified-for-terminal-composition
recommendation: retain
---

# RSP Shape Deep Clarification Evidence

## Decision

Retain the progressive deep-clarification and project-design return branch for terminal composition. The candidate adds observable behavior on explicit challenge and project-owned design routing while preserving settled ordinary routing.

## Deterministic contract

Six sanitized fixtures cover explicit challenge, high-risk dependent decisions, domain language, module seams, premature-action restraint, and a settled ordinary request. The focused harness requires branch-only cases to load `deep-clarification.md`, requires the ordinary case to use only `SKILL.md`, rejects path escapes and symlink inputs, and checks the selected contract fragments.

The evaluated default `SKILL.md` grew from 530 to 585 whitespace-delimited words, a 10.38% increase and below the existing 30% aggregate Shape overhead threshold. Terminal review then collapsed two overlapping context pointers into one equivalent OR trigger; the final payload is 572 words, a 7.92% increase, with its separate hash recorded above. The 276-word deep reference is disclosed only for explicit challenge, unresolved high-risk decisions, or a project-selected design return. This is static instruction cost, not provider token billing.

The model-invoked description now names `rigorously challenge`, so an explicit request can discover Shape without relying on a hidden host route. Ordinary unclear work remains covered by the existing `Shape unclear non-trivial work` trigger and Core's incomplete-work route.

## Fresh paired behavior

Five baseline/candidate pairs ran as independent ephemeral, read-only Codex sessions against isolated temporary copies. User and project rules were disabled, plugin discovery was disabled, and each prompt instructed the agent to use only the supplied Shape payload. Host MCP startup still emitted intermittent warnings but supplied no scenario evidence. Raw final outputs are preserved under `outputs/`.

| Case | Baseline | Candidate | Result |
| --- | --- | --- | --- |
| Explicit rigorous challenge | Asked one material either/or question and stopped | Asked one decision, supplied a fact-grounded recommendation, and requested confirmation | Candidate demonstrates the intended recommendation and confirmation delta |
| Implicit high-risk dependency | Named the encryption/deletion blocker | Asked one ownership question, recommended immutable internal identity, and deferred its dependent decision | Candidate reaches depth without requiring the word `challenge` |
| Project-owned domain design | Named the capability, owner, and blocker | Returned the unresolved question, authoritative inputs, expected artifact, mutation boundary, and same WorkRef | Candidate demonstrates the complete bounded return contract |
| Project-owned module seam | Returned a useful design task but omitted the explicit returning WorkRef field | Returned question, input paths, artifact, mutation boundary, and `Change device-events` | Candidate normalizes the same return contract across design disciplines |
| Settled ordinary Change | Returned directly to implementation | Returned directly to implementation without loading or imitating the deep branch | No ordinary-path regression observed |

One additional candidate-only holdout ran with `workspace-write` against a clean temporary Git repository. The prompt authorized later Change refinement but withheld all owner answers and shared-understanding confirmation. The candidate asked one recommended owner question; `git status --short` was empty and `git diff --exit-code` returned `0`, proving zero artifact mutations under actual write capability. The frozen prompt and oracle are under `test/rsp-shape-depth/holdout/`.

## Run telemetry

The original three pairs were run before uniform JSON telemetry was enabled. Where the CLI printed a total token count it is retained; missing fields are explicitly unavailable. Later runs recorded wall-clock time from the command runner, but intermittent custom-provider MCP warnings suppressed `turn.completed` usage on four of five runs. Tool-call counts were not preserved as durable events, so all are unavailable rather than reconstructed from truncated console output.

| Run | Elapsed | Tool calls | Token telemetry |
| --- | ---: | ---: | --- |
| explicit baseline | unavailable | unavailable | 27,399 total |
| explicit candidate | unavailable | unavailable | unavailable |
| domain-design baseline | unavailable | unavailable | 24,587 total |
| domain-design candidate | unavailable | unavailable | unavailable |
| ordinary baseline | unavailable | unavailable | 1,614 total |
| ordinary candidate | unavailable | unavailable | 24,191 total |
| high-risk baseline | 22.3 s | unavailable | unavailable |
| high-risk candidate | 18.5 s | unavailable | 92,027 input; 89,600 cached input; 674 output; 284 reasoning output |
| module-seam baseline | 25.1 s | unavailable | unavailable |
| module-seam candidate | 22.1 s | unavailable | unavailable |
| writable-restraint candidate | 24.1 s | unavailable | unavailable |

These host-level token totals are dominated by shared Codex context and vary by cache state; they do not isolate Skill cost and are not used as a promotion threshold. The frozen payload word delta is the comparable ordinary-path cost measure for this slice.

Output hashes:

- explicit baseline `69e58031c4f4d362473c26ac61698d7b90461ea365c4bb6572373935079a5b47`; candidate `1fb93ae11d585e1bda4d8736fff26067d169ef3bf23fe306438cd082e1fce552`
- high-risk baseline `d4ee9f096decc09e8d4894efbfa833e3e19f069e3c79eb2fd4c730da490ed201`; candidate `9cd90591803dbebbd88c89e91302783d99ce8e88cb33d6d3635f29042814bc0d`
- design baseline `f5a84712406cd9c5a6d346da55e6c1c7283e212e65e89842055eca7205f95745`; candidate `f3bab03e81bca084306e3a28452eba1040d1cfba60d6a3866a524430c7780b2f`
- module baseline `58652c494d9ea5e384e6939cb2e394f60da639b8c7281fbe1285fb674f7842e9`; candidate `e6085b0ab2412f4ccf883aae6404ed3aac465c62650a884917a7229ea33e8439`
- ordinary baseline `c1d82aeeda3c9cd8a816de193c8f94725264be44a6c35b4db2f0804343d781f3`; candidate `830cbd7eaa10da1d235a9beb37fcf5cdbaa0d8db6a1c8f7f7aed4ee50e7e362f`
- writable-restraint candidate `6581d4f1a1edf70d2d26cb80f2a0505d358dc6c9b60d57192a6b448e1808771e`; source Change `e50d9f1ac56e04f2ac6bcde396c854b51d003620a1090a2559da4d875fd83a24`

## Limits

The behavioral pairs used fresh sessions but shared the host provider configuration rather than independent `CODEX_HOME` copies, so they qualify this slice for terminal composition rather than a new general provider/cost claim. The synthetic design scenario supplied logical input names instead of real project paths; production runs must name the actual authoritative paths they inspect. The terminal five-journey gate remains responsible for installed-package composition and final 3.0 product-boundary decisions.
