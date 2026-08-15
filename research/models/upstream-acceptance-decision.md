---
topic: upstream-acceptance-decision
status: complete
decision_status: accepted
accepted_on: 2026-08-15
sources:
  - "addy-agent-skills@df1edb2e05487d0aa6d93c747141e0aed1187f25 -> research/upstreams/addy-agent-skills/df1edb2e05487d0aa6d93c747141e0aed1187f25.md"
  - "agent-skills-spec@69ef37e9424c0a7ea9dd2293b559e43ec8176379 -> research/upstreams/agent-skills-spec/69ef37e9424c0a7ea9dd2293b559e43ec8176379.md"
  - "anthropic-skill-creator@f6656c1256d5a8adfa37db9110046ef20bac644c -> research/upstreams/anthropic-skill-creator/f6656c1256d5a8adfa37db9110046ef20bac644c.md"
  - "compound-engineering@72bae536f64417335cb24c2ccc9ea0f8eb4ceaa1 -> research/upstreams/compound-engineering/72bae536f64417335cb24c2ccc9ea0f8eb4ceaa1.md"
  - "deepseek-harness@47f943859bef60e4160492346772ded9b24f765a -> research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a.md"
  - "everything-claude-code@c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8 -> research/upstreams/everything-claude-code/c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8.md"
  - "gsd-core@62f44f8d7c3cd9bb169ca75b1bc1da3c8096c29a -> research/upstreams/gsd-core/62f44f8d7c3cd9bb169ca75b1bc1da3c8096c29a.md"
  - "matt-skills@8b78b531ab965735c5dc74f6f7a219e1e37326df -> research/upstreams/matt-skills/8b78b531ab965735c5dc74f6f7a219e1e37326df.md"
  - "openspec@2826b8889e5223a9a8095d4428b60b56597e1020 -> research/upstreams/openspec/2826b8889e5223a9a8095d4428b60b56597e1020.md"
  - "planning-with-files@9b7d0a007946ae7694216642fd5be78c2f13b6db -> research/upstreams/planning-with-files/9b7d0a007946ae7694216642fd5be78c2f13b6db.md"
  - "ponytail@2ed6c52c9d7e5e56942508591085fd45dea277d3 -> research/upstreams/ponytail/2ed6c52c9d7e5e56942508591085fd45dea277d3.md"
  - "skill-use-bench@b1f74886957e13b8013fa554649b210955b69980 -> research/upstreams/skill-use-bench/b1f74886957e13b8013fa554649b210955b69980.md"
  - "skillopt@a17de4ec767eb3171b8ba10111cb74940406d2f1 -> research/upstreams/skillopt/a17de4ec767eb3171b8ba10111cb74940406d2f1.md"
  - "skills-cli@c6f69c631292444cc541ac6d91e2226b0ff247da -> research/upstreams/skills-cli/c6f69c631292444cc541ac6d91e2226b0ff247da.md"
  - "skillspector@5680c2c3008e63c9979bbbe08221ee4c2dcd17ee -> research/upstreams/skillspector/5680c2c3008e63c9979bbbe08221ee4c2dcd17ee.md"
  - "spec-kit@bf88c9f9a82fa370c7a7257aa2b3cf10b457b65c -> research/upstreams/spec-kit/bf88c9f9a82fa370c7a7257aa2b3cf10b457b65c.md"
  - "superpowers@b36e0829c6d0140e93cfef2ca599b1b07d4a7797 -> research/upstreams/superpowers/b36e0829c6d0140e93cfef2ca599b1b07d4a7797.md"
---

# Upstream Acceptance Decision

## Purpose

This report records the accepted 17-revision wave that completed the current 20-source research baseline. It does not select a product recommendation, modify a published Skill, or authorize Git or publication actions.

## Acceptance Semantics

- `accept` records the reviewed revision in `upstreams.lock` so future sync and prepare operations compare against a known research baseline.
- `accept` does not copy upstream content, install a Skill, approve a recommendation, or create an RSP Change.
- Product adoption remains gated by one observed RSP gap, one selected recommendation set, an adoption mode, an owning artifact, and fresh verification.
- A model-only or rejected product mechanism can still have its reviewed revision accepted as research provenance.

## Research-Baseline Decision

All 17 revisions were accepted on August 15, 2026. Together with the three already accepted sources, all 20 registered upstreams now report accepted revisions, complete research, matched path coverage, and no pending action. Acceptance removed stale or null comparison bases without combining or automatically adopting their product recommendations.

| Source | Revision | Research strategy | Baseline decision | Product disposition after accept | Reason |
| --- | --- | --- | --- | --- | --- |
| `agent-skills-spec` | `69ef37e9424c0a7ea9dd2293b559e43ec8176379` | conform | accept | conformance maintenance input | Normative metadata and open resource-envelope clarification should become the current comparison baseline. |
| `addy-agent-skills` | `df1edb2e05487d0aa6d93c747141e0aed1187f25` | adapt | accept | priority evaluation candidate input | Cross-Skill routing, pressure, and standalone-install checks address demonstrated promotion-gate gaps; the lifecycle suite remains rejected. |
| `anthropic-skill-creator` | `f6656c1256d5a8adfa37db9110046ef20bac644c` | adapt | accept | priority evaluation candidate input | Holdout, candidate comparison, and qualitative review are useful; automated publication remains prohibited. |
| `skill-use-bench` | `b1f74886957e13b8013fa554649b210955b69980` | model | accept | priority evaluation candidate input | Trigger, Compliance, and Boundary separation is the strongest reviewed evaluation model; unresolved reuse licensing keeps it model-only. |
| `skillopt` | `a17de4ec767eb3171b8ba10111cb74940406d2f1` | model | accept | priority evaluation candidate input | Candidate-versus-current no-regression is useful; unattended self-modification and publication remain rejected. |
| `skillspector` | `5680c2c3008e63c9979bbbe08221ee4c2dcd17ee` | tooling | accept | priority security candidate input | It establishes a missing supply-chain security model while leaving external scanning and optional egress for later evaluation. |
| `compound-engineering` | `72bae536f64417335cb24c2ccc9ea0f8eb4ceaa1` | adapt | accept | secondary evaluation evidence | Noise-floor and paired trajectory scoring strengthen later evaluation work; broad orchestration remains rejected. |
| `gsd-core` | `62f44f8d7c3cd9bb169ca75b1bc1da3c8096c29a` | model | accept | secondary evaluation evidence | Context budgets and capability provenance inform promotion evidence; its runtime capability ecosystem remains external. |
| `everything-claude-code` | `c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8` | model | accept | capability inventory only | The 284-Skill catalog is useful for lookup and hypothesis generation, not runtime or whole-suite adoption. |
| `deepseek-harness` | `47f943859bef60e4160492346772ded9b24f765a` | model | accept | project-adapter reference only | Repository adapters, executable prose gates, and decision-value retention are useful models; the harness and Agent Note corpus remain external. |
| `openspec` | `2826b8889e5223a9a8095d4428b60b56597e1020` | model | accept | architecture reference only | Source/projection separation remains useful while stores and artifact-graph lifecycle stay rejected. |
| `planning-with-files` | `9b7d0a007946ae7694216642fd5be78c2f13b6db` | model | accept | managed-run reference only | Monotonic regression detection is optional evidence, not authority or a reason to add another progress ledger. |
| `skills-cli` | `c6f69c631292444cc541ac6d91e2226b0ff247da` | tooling | accept | security inventory only | Remote-ingestion safeguards are useful reference material; RSP has no selected installer gap. |
| `spec-kit` | `bf88c9f9a82fa370c7a7257aa2b3cf10b457b65c` | model | accept | ecosystem boundary reference only | Optional projection and download-security lessons are relevant only if a distribution gap is later selected. |
| `matt-skills` | `8b78b531ab965735c5dc74f6f7a219e1e37326df` | adapt | accept | no new product candidate | Existing RSP mappings remain valid; new utility Skills stay external and exact-path coverage is refreshed. |
| `ponytail` | `2ed6c52c9d7e5e56942508591085fd45dea277d3` | adapt | accept | no new product candidate | The revision changes host integration rather than canonical Skill behavior. |
| `superpowers` | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | adapt | accept | no new product candidate | Existing classifications remain valid; projection changes do not justify broader routing or Git authority. |

## Product Candidate Disposition

Acceptance did not automatically create product work. Two maintainer-infrastructure recommendations were subsequently selected and implemented independently:

1. **Q1 evaluation observability — implemented:** independent Trigger, Compliance, Boundary, task-result, and nullable measurement projection is retained by the archived `skill-evaluation-observability` Change.
2. **Q3 holdout and no-regression — implemented:** identity-bound current/candidate comparison is retained by the archived `skill-candidate-no-regression` Change; no concrete Skill candidate has been promoted by that infrastructure.
3. **Q2 deterministic routing — deferred:** resume only from an observed catalog-routing or description-collision failure.
4. **Q4 supply-chain security — deferred:** reconsider as a separate release-candidate security decision.
5. **Q5 capability lookup — deferred:** reconsider only after repeated maintainer lookup friction.

Do not combine all five into one promotion-framework project. Each candidate requires its own observed gap, owner, smallest behavior delta, and acceptance evidence.

## Deferred Product Actions

- Do not import upstream lifecycle suites, hooks, memory, autonomous loops, installers, or provider-specific runners.
- Do not copy Skill-Use-Bench assets while its reviewed reuse license remains unresolved.
- Do not add an RSP remote installer until a concrete distribution need owns the security and maintenance cost.
- Do not modify `openai.yaml` in this acceptance wave.
- Do not create product Changes merely because the research baseline is accepted.

## Closeout State

The acceptance wave is complete: all 20 registered sources report accepted revisions, complete research, and no pending action. Q1 and Q3 provide the selected deterministic maintainer foundation. No further upstream-derived product candidate is implied; the next RSP optimization must begin from a newly observed product or workflow problem, while Q2, Q4, and Q5 retain their explicit resume conditions.
