---
topic: skill-quality-and-governance
status: complete
implementation_status: partial
decision_status: accepted
reconciled_on: 2026-08-19
sources:
  - "addy-agent-skills@df1edb2e05487d0aa6d93c747141e0aed1187f25 -> research/upstreams/addy-agent-skills/df1edb2e05487d0aa6d93c747141e0aed1187f25.md"
  - "anthropic-skill-creator@f6656c1256d5a8adfa37db9110046ef20bac644c -> research/upstreams/anthropic-skill-creator/f6656c1256d5a8adfa37db9110046ef20bac644c.md"
  - "deepseek-harness@47f943859bef60e4160492346772ded9b24f765a -> research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a.md"
  - "everything-claude-code@c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8 -> research/upstreams/everything-claude-code/c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8.md"
  - "matt-skills@8b78b531ab965735c5dc74f6f7a219e1e37326df -> research/upstreams/matt-skills/8b78b531ab965735c5dc74f6f7a219e1e37326df.md"
  - "skillopt@a17de4ec767eb3171b8ba10111cb74940406d2f1 -> research/upstreams/skillopt/a17de4ec767eb3171b8ba10111cb74940406d2f1.md"
  - "skillspector@5680c2c3008e63c9979bbbe08221ee4c2dcd17ee -> research/upstreams/skillspector/5680c2c3008e63c9979bbbe08221ee4c2dcd17ee.md"
  - "skill-use-bench@b1f74886957e13b8013fa554649b210955b69980 -> research/upstreams/skill-use-bench/b1f74886957e13b8013fa554649b210955b69980.md"
---

# Skill Quality and Governance

## Purpose

This model turns the reviewed sources into a queryable maintainer contract for finding, evaluating, securing, and improving Skills. It is research input for the existing G5 Skill promotion gate, not authorization to change published Skills or add a runtime dependency. The accepted baseline is closed: Q1 through Q4 now have independently owned maintainer infrastructure, while Q5 remains an evidence-triggered research candidate rather than an implementation queue.

## Capability Ledger

| Need | Primary evidence | Minimum result | Default owner |
| --- | --- | --- | --- |
| Discover an existing capability | ECC R1/R2; addy R4 | capability family, exact path, core/library/external classification | cross-source capability coverage |
| Validate structure and packaging | addy M1/M4; anthropic M1 | valid metadata, self-contained resources, standalone-install result | deterministic promotion checks |
| Test triggering and routing | addy R1; anthropic R2; Skill-Use R1/R3 | positive, hard negative, pairwise owner, collision, triggered-only diagnosis | shared Skill evaluation contract |
| Test procedure compliance | addy R2; anthropic R1/R3; Skill-Use R2 | required trajectory events plus artifact/task success | candidate evaluation |
| Test authority boundaries | Skill-Use R1/R2; addy M2 | forbidden actions scored separately under pressure | candidate evaluation |
| Optimize instructions safely | anthropic R2; SkillOpt R1/R2 | candidate-versus-current holdout and no-regression receipt | maintainer candidate workspace |
| Author and evolve RSP Skills | Matt R1; anthropic R1/R2; SkillOpt R1/R2 | bounded contract, progressive resources, semantic concision, attributable candidate | repository maintainer Skill |
| Scan supply-chain risk | SkillSpector R1/R2/R3 | local deterministic findings, suppression provenance, disclosed optional egress | promotion security gate |
| Prove host behavior | DeepSeek R1/R3; Skill-Use M4 | exact host/projection receipt for release candidates | host adapter/release evidence |

## Shared Mechanisms

1. **Description and body are different control surfaces.** Routing defects require description cases; compliance defects require full Skill and trajectory evidence.
2. **Task success is insufficient.** Trigger, required procedure, forbidden behavior, artifact quality, corrections, tool calls, elapsed time, and tokens are separate observations.
3. **Candidates compare against current behavior.** With/without or candidate/current runs plus a small unseen holdout prevent improvements from being inferred from one successful example.
4. **Deterministic checks precede model judging.** Structure, paths, permissions, collisions, static security, and exact prohibitions should not spend model calls when scripts can decide them.
5. **Catalog breadth stays out of runtime context.** Large sources are library inventories; only selected stable RSP Skills and project adapters enter ordinary discovery.
6. **Host evidence is a projection result.** A portable Skill can still fail because a host exposes different metadata, tools, permissions, or progressive disclosure.
7. **Instruction hierarchy should expose the next decision first.** Co-locate rules with the action they constrain, move low-frequency branches behind explicit links, lead with discriminating words, and give completion criteria that can be checked.
8. **Pruning is semantic, not numeric.** Remove no-op prose, repeated subjects, and duplicated explanations only when trigger, inputs, authority, action, output, stop, verification, and conditional-loading behavior remain explicit. Lists, tables, numbering, and closed single-meaning flows may compress context; private notation and shortened public contracts may not.

## Disagreements and Resolutions

| Question | Source tension | RSP resolution |
| --- | --- | --- |
| Lexical routing versus model execution | Addy supplies cheap lexical rank/collision checks; Anthropic measures real trigger decisions | Use lexical checks as CI regressions and a small real trigger holdout before promotion |
| Automatic optimization | SkillOpt supports recurring self-evolution; Anthropic supports iterative model-proposed edits | Automation may create research candidates only; a normal RSP Change owns publication |
| Broad benchmark matrices | Skill-Use demonstrates model+harness effects; routine edits cannot afford its full matrix | One deterministic suite plus a small unseen real-task holdout routinely; broader matrices only for release candidates |
| Security semantics | SkillSpector can use optional LLM analysis and live OSV data | Local static mode is the minimum gate; semantic/provider and OSV egress are explicit optional evidence |
| Large capability catalogs | ECC favors broad availability; RSP favors a small stable suite | Keep ECC paths searchable as external/library inventory and promote only demonstrated local gaps |

## Gap and Implementation Status

- **QG1 — Closed by selected routing evidence.** A retained natural-language review request ranked `rsp-resolve-findings` above `rsp-review` under the deterministic catalog scorer until the canonical review description made its no-file-mutation boundary explicit. The resulting suite now covers realistic positives, hard negatives, pairwise ownership, and catalog-wide description collisions; lexical success remains pre-provider evidence only. See [skill-routing-evaluation](../../.rsp/archives/2026-08-19_skill-routing-evaluation.md).
- **QG2 — Closed by Q1 maintainer infrastructure.** Trigger, Compliance, Boundary, and task result now project independently, with explicit nullable measurements and no inferred routing evidence. See [skill-evaluation-observability](../../.rsp/archives/2026-08-15_skill-evaluation-observability.md).
- **QG3 — Closed by Q3 maintainer infrastructure.** Current and candidate observations can now be compared on identity-bound unseen holdouts with a deterministic no-regression receipt. This establishes the gate; it does not prove that any particular Skill candidate is better. See [skill-candidate-no-regression](../../.rsp/archives/2026-08-15_skill-candidate-no-regression.md).
- **QG4 — Closed by the selected release-candidate security decision.** The deterministic offline preflight now scans scripts, permissions, egress, injection, dependencies, secrets, and MCP metadata with content-bound suppression provenance. Passing remains bounded static evidence, not semantic or behavioral safety proof. See [add-skill-security-preflight](../../.rsp/archives/2026-08-15_add-skill-security-preflight.md).
- **QG5 — Deferred pending repeated lookup friction.** The exact-path coverage ledger is complete; a family-level lookup layer is justified only when maintainers repeatedly fail to find an existing capability.
- **QG6 — Closed by local maintainer implementation.** `author-rsp-skills` now owns bounded creation, revision, audit, semantic concision, upstream adaptation, and evaluation composition without entering the published package inventory or receiving promotion authority.

## Rejected Ideas

- Importing whole upstream lifecycle suites, commands, hooks, memory, autonomous loops, or scheduled self-modification.
- Using star count, catalog size, one benchmark score, or one model judge as adoption authority.
- Making lexical routing, static security, or a clean working tree sufficient proof of behavior.
- Persisting another workflow or run-state ledger beside RSP artifacts.
- Sending Skill contents, dependency coordinates, traces, or user history to external providers without explicit scope and authority.

## Recommendation Disposition

| Recommendation | Disposition | Evidence or resume condition |
| --- | --- | --- |
| **Q1 — Extend the promotion eval schema.** | `implemented` | Independently reimplemented by [skill-evaluation-observability](../../.rsp/archives/2026-08-15_skill-evaluation-observability.md); deterministic local evidence covers the shared projection, not provider or candidate quality. |
| **Q2 — Add a deterministic catalog-routing suite.** | `implemented` | Independently reimplemented by [skill-routing-evaluation](../../.rsp/archives/2026-08-19_skill-routing-evaluation.md) after an observed `rsp-review` versus `rsp-resolve-findings` ranking failure; the first corpus covers four overlapping owners and all published descriptions. Evidence: addy R1. |
| **Q3 — Add holdout and no-regression gates for instruction edits.** | `implemented` | RSP-owned model-only contract implemented by [skill-candidate-no-regression](../../.rsp/archives/2026-08-15_skill-candidate-no-regression.md); a future concrete Skill edit still requires fresh current/candidate holdout evidence. |
| **Q4 — Add a deterministic Skill security preflight.** | `implemented` | Independently reimplemented by [add-skill-security-preflight](../../.rsp/archives/2026-08-15_add-skill-security-preflight.md) as a deterministic offline release-candidate gate; provider semantic analysis and live vulnerability lookup remain optional external evidence. Evidence: SkillSpector R1/R2/R3/R4. |
| **Q5 — Add a capability-family lookup layer.** | `defer` | Resume only after repeated maintainer lookup friction demonstrates that exact-path coverage is insufficient. Evidence: ECC R1/R2, DeepSeek R1. |
| **Q6 — Add one repository Skill authoring owner.** | `implemented` | Independently expressed by `.agents/skills/author-rsp-skills` with progressive authoring, concision, and evaluation references plus a deterministic diagnostic scanner. Review, Git, and publication remain separate authorities. |

## Promotion Boundary

No recommendation above changes published RSP behavior by itself. Q1 through Q4 are maintainer infrastructure; Q2 additionally retains the one evidenced `rsp-review` discovery-description correction that made the first routing corpus pass. Any future candidate must still select one observed failure, three to five non-default behaviors, one owner, exact report recommendation IDs, an adoption mode, and fresh evaluation evidence. Q5 remains stopped until its stated resume condition is observed.
