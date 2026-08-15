---
topic: skill-quality-and-governance
status: complete
implementation_status: proposed
decision_status: candidate
sources:
  - "addy-agent-skills@df1edb2e05487d0aa6d93c747141e0aed1187f25 -> research/upstreams/addy-agent-skills/df1edb2e05487d0aa6d93c747141e0aed1187f25.md"
  - "anthropic-skill-creator@f6656c1256d5a8adfa37db9110046ef20bac644c -> research/upstreams/anthropic-skill-creator/f6656c1256d5a8adfa37db9110046ef20bac644c.md"
  - "deepseek-harness@47f943859bef60e4160492346772ded9b24f765a -> research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a.md"
  - "everything-claude-code@c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8 -> research/upstreams/everything-claude-code/c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8.md"
  - "skillopt@a17de4ec767eb3171b8ba10111cb74940406d2f1 -> research/upstreams/skillopt/a17de4ec767eb3171b8ba10111cb74940406d2f1.md"
  - "skillspector@5680c2c3008e63c9979bbbe08221ee4c2dcd17ee -> research/upstreams/skillspector/5680c2c3008e63c9979bbbe08221ee4c2dcd17ee.md"
  - "skill-use-bench@b1f74886957e13b8013fa554649b210955b69980 -> research/upstreams/skill-use-bench/b1f74886957e13b8013fa554649b210955b69980.md"
---

# Skill Quality and Governance

## Purpose

This model turns the reviewed sources into a queryable maintainer contract for finding, evaluating, securing, and improving Skills. It is research input for the existing G5 Skill promotion gate, not authorization to change published Skills or add a runtime dependency.

## Capability Ledger

| Need | Primary evidence | Minimum result | Default owner |
| --- | --- | --- | --- |
| Discover an existing capability | ECC R1/R2; addy R4 | capability family, exact path, core/library/external classification | cross-source capability coverage |
| Validate structure and packaging | addy M1/M4; anthropic M1 | valid metadata, self-contained resources, standalone-install result | deterministic promotion checks |
| Test triggering and routing | addy R1; anthropic R2; Skill-Use R1/R3 | positive, hard negative, pairwise owner, collision, triggered-only diagnosis | shared Skill evaluation contract |
| Test procedure compliance | addy R2; anthropic R1/R3; Skill-Use R2 | required trajectory events plus artifact/task success | candidate evaluation |
| Test authority boundaries | Skill-Use R1/R2; addy M2 | forbidden actions scored separately under pressure | candidate evaluation |
| Optimize instructions safely | anthropic R2; SkillOpt R1/R2 | candidate-versus-current holdout and no-regression receipt | maintainer candidate workspace |
| Scan supply-chain risk | SkillSpector R1/R2/R3 | local deterministic findings, suppression provenance, disclosed optional egress | promotion security gate |
| Prove host behavior | DeepSeek R1/R3; Skill-Use M4 | exact host/projection receipt for release candidates | host adapter/release evidence |

## Shared Mechanisms

1. **Description and body are different control surfaces.** Routing defects require description cases; compliance defects require full Skill and trajectory evidence.
2. **Task success is insufficient.** Trigger, required procedure, forbidden behavior, artifact quality, corrections, tool calls, elapsed time, and tokens are separate observations.
3. **Candidates compare against current behavior.** With/without or candidate/current runs plus a small unseen holdout prevent improvements from being inferred from one successful example.
4. **Deterministic checks precede model judging.** Structure, paths, permissions, collisions, static security, and exact prohibitions should not spend model calls when scripts can decide them.
5. **Catalog breadth stays out of runtime context.** Large sources are library inventories; only selected stable RSP Skills and project adapters enter ordinary discovery.
6. **Host evidence is a projection result.** A portable Skill can still fail because a host exposes different metadata, tools, permissions, or progressive disclosure.

## Disagreements and Resolutions

| Question | Source tension | RSP resolution |
| --- | --- | --- |
| Lexical routing versus model execution | Addy supplies cheap lexical rank/collision checks; Anthropic measures real trigger decisions | Use lexical checks as CI regressions and a small real trigger holdout before promotion |
| Automatic optimization | SkillOpt supports recurring self-evolution; Anthropic supports iterative model-proposed edits | Automation may create research candidates only; a normal RSP Change owns publication |
| Broad benchmark matrices | Skill-Use demonstrates model+harness effects; routine edits cannot afford its full matrix | One deterministic suite plus a small unseen real-task holdout routinely; broader matrices only for release candidates |
| Security semantics | SkillSpector can use optional LLM analysis and live OSV data | Local static mode is the minimum gate; semantic/provider and OSV egress are explicit optional evidence |
| Large capability catalogs | ECC favors broad availability; RSP favors a small stable suite | Keep ECC paths searchable as external/library inventory and promote only demonstrated local gaps |

## Demonstrated RSP Gaps

- **QG1 — Catalog routing is not yet a deterministic gate.** Current behavior fixtures do not prove cross-Skill positive rank, hard-negative restraint, pairwise owner precedence, or description collision control.
- **QG2 — Evaluation dimensions are aggregated.** Current reports can show task outcome and restraint, but Trigger, Compliance, and Boundary are not consistently scored as independent dimensions with triggered-only diagnosis.
- **QG3 — Description optimization lacks a standard holdout/no-regression receipt.** A wording edit can improve known prompts while degrading unseen routing.
- **QG4 — Skill supply-chain security is not a named promotion dimension.** Structure and packaging checks do not substitute for script, permission, egress, injection, dependency, or MCP analysis.
- **QG5 — Capability search is source-centric.** The existing coverage ledger classifies exact adapt paths, but large library sources need family-level lookup without entering the minimum suite.

## Rejected Ideas

- Importing whole upstream lifecycle suites, commands, hooks, memory, autonomous loops, or scheduled self-modification.
- Using star count, catalog size, one benchmark score, or one model judge as adoption authority.
- Making lexical routing, static security, or a clean working tree sufficient proof of behavior.
- Persisting another workflow or run-state ledger beside RSP artifacts.
- Sending Skill contents, dependency coordinates, traces, or user history to external providers without explicit scope and authority.

## Candidate Recommendations

- **Q1 — Extend the promotion eval schema.** Add independent Trigger, Compliance, Boundary, task success, corrections, tool calls, elapsed time, and token fields. Evidence: addy R1/R2, anthropic R1, Skill-Use R1/R2/R3. Adoption: independent reimplementation.
- **Q2 — Add a deterministic catalog-routing suite.** Require realistic positives, hard near-miss negatives, pairwise owner precedence, and description-collision reporting. Evidence: addy R1. Adoption: independent reimplementation.
- **Q3 — Add holdout and no-regression gates for instruction edits.** Preserve the current candidate when unseen routing or required behavior regresses. Evidence: anthropic R2, SkillOpt R1/R2. Adoption: model-only contract with RSP-owned implementation.
- **Q4 — Add a deterministic Skill security preflight.** Check executable payloads, permissions, secrets, egress, prompt injection, dependencies, and MCP metadata; keep semantic scanning optional. Evidence: SkillSpector R1/R2/R3/R4. Adoption: evaluate external tooling, then independent implementation if needed.
- **Q5 — Add a capability-family lookup layer to the coverage ledger.** Index large catalogs as core/library/external and link exact source paths without treating them as product gaps. Evidence: ECC R1/R2, DeepSeek R1. Adoption: model-only.

## Promotion Boundary

No recommendation above changes RSP behavior by itself. A future Change must select one observed failure, three to five non-default behaviors, one owner, exact report recommendation IDs, an adoption mode, and fresh evaluation evidence. Q1/Q2/Q3/Q4 should not be bundled automatically: each can prove a separate local gap and carry different implementation and host costs.
