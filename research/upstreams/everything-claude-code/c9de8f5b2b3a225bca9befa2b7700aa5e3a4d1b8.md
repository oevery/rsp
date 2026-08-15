---
source: everything-claude-code
revision: c9de8f5b2b3a225bca9befa2b7700aa5e3a4d1b8
base: null
strategy: model
evidence_hash: sha256:2914e55b7d9a15c655974cb76a17209f48b700bd25c2d7462e0fb5f88ec8d48e
status: complete
---

# Upstream Distillation: everything-claude-code

## Source Position

- **Evidence:** ECC presents a multi-host agent engineering distribution with 284 root Skills plus agents, commands, hooks, memory, rules, security scanning, installation tooling, and host projections (`README.md`, `skills/**`).
- **Inference:** Its primary value to RSP is a broad capability search inventory and adversarial comparison set. Its scale, mixed maturity, domain breadth, and host-specific runtime prevent whole-suite adoption.

## Extracted Mechanisms

- **M1 — Daily versus library selection:** `agent-sort` inventories a repository and separates frequently loaded capabilities from on-demand library material, directly addressing catalog context cost (`skills/agent-sort/SKILL.md`).
- **M2 — Skill governance is itself skillized:** scouting, stocktaking, compliance measurement, eval harnesses, rules distillation, context budgets, and security scans are explicit capabilities (`skill-scout`, `skill-stocktake`, `skill-comply`, `eval-harness`, `rules-distill`, `context-budget`, `security-scan`).
- **M3 — Agent failure can be diagnosed as a layered system:** harness construction, architecture audit, introspection debugging, regression testing, benchmarks, and cost tracking separate tool/observation/harness failures from task logic (`agent-harness-construction`, `agent-architecture-audit`, `agent-introspection-debugging`, `ai-regression-testing`, `benchmark-methodology`).
- **M4 — Runtime enforcement is powerful but host-bound:** hooks, autonomous loops, continuous learning, delivery gates, memory, and provider-specific installation own state and side effects outside a portable Skill document (`README.md`, `delivery-gate`, `continuous-agent-loop`, `continuous-learning-v2`, `unified-memory`).

## Capability Inventory

The prepared scope contains every canonical `skills/*/SKILL.md` path at this revision. The table is the durable search index; translations and host projections are intentionally excluded.

| Family | Representative exact paths | Default disposition |
| --- | --- | --- |
| Skill discovery and governance | `skills/agent-sort/SKILL.md`, `skills/skill-scout/SKILL.md`, `skills/skill-stocktake/SKILL.md`, `skills/rules-distill/SKILL.md` | `model-only`; useful for catalog maintenance |
| Evaluation and benchmark | `skills/agent-eval/SKILL.md`, `skills/eval-harness/SKILL.md`, `skills/skill-comply/SKILL.md`, `skills/benchmark-methodology/SKILL.md`, `skills/ai-regression-testing/SKILL.md` | `model-only`; compare with dedicated eval upstreams |
| Agent/harness diagnosis | `skills/agent-harness-construction/SKILL.md`, `skills/agent-architecture-audit/SKILL.md`, `skills/agent-introspection-debugging/SKILL.md`, `skills/context-budget/SKILL.md`, `skills/cost-tracking/SKILL.md` | external or candidate research mechanism |
| Engineering workflow | `skills/contract-first/SKILL.md`, `skills/tdd-workflow/SKILL.md`, `skills/verification-loop/SKILL.md`, `skills/delivery-gate/SKILL.md`, `skills/git-workflow/SKILL.md` | overlaps RSP; no wholesale adoption |
| Orchestration and memory | `skills/autonomous-agent-harness/SKILL.md`, `skills/autonomous-loops/SKILL.md`, `skills/continuous-agent-loop/SKILL.md`, `skills/team-agent-orchestration/SKILL.md`, `skills/unified-memory/SKILL.md` | `defer` or `reject` where authority/state conflicts |
| Security | `skills/security-review/SKILL.md`, `skills/security-scan/SKILL.md`, `skills/safety-guard/SKILL.md`, `skills/gateguard/SKILL.md` | external security capabilities; compare with SkillSpector |
| Language/framework/domain | all remaining canonical `skills/*/SKILL.md` paths | `external` library inventory unless a concrete RSP-owned gap appears |

## Applicable to RSP

- Use ECC as a queryable source catalog: gap -> capability family -> exact Skill path -> focused follow-up.
- Maintain daily/core versus library/external classification so catalog breadth does not become always-loaded context.
- Compare governance Skills against dedicated sources before adopting; ECC is a discovery source, not sufficient proof by itself.
- Keep host installation, hooks, memory, and external services outside portable RSP core behavior.

## Rejected

- Installing or importing the complete suite, command aliases, hooks, rules, memory, or continuous-learning runtime.
- Treating 284 paths as 284 RSP gaps or reading every domain Skill at deep evidence level.
- Persisting a second workflow ledger, autonomous loop, or hidden memory beside `.rsp/`.
- Inferring commit, push, deployment, credentials, scheduled execution, or external-service authority.

## Recommendations

- **R1 — Retain ECC as a capability-search upstream (`model-only`).** Refresh the canonical Skill inventory by revision and deepen only selected paths when a real gap appears.
- **R2 — Add core-versus-library classification to the cross-source ledger (`independent-reimplementation`).** Keep routine RSP Skills small while preserving discoverable external candidates.
- **R3 — Use governance Skills as hypothesis generators (`model-only`).** Validate compliance, evaluation, context, and security ideas against dedicated evidence sources.
- **R4 — Reject runtime overlay adoption (`reject`).** Hooks, memory, autonomous loops, and delivery automation remain host/project concerns.
