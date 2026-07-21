---
candidate: rsp-shape
candidate_version: "2026.07.20.11"
candidate_hash: sha256:70edf945b2b7cb6fb8ee851358024ba33353ad4f716a196b7a2b50ed13e19b4b
fixture_hash: sha256:d4195aa591c5b25e02dcb7fd744d796594dfb3ac2b28c54cdd34f0ad2cf0c47e
harness_hash: sha256:a411c3b0f5101bf1c5c4aceefe9304f946d655151bbc31a2877cc173e1828371
status: promoted
date: 2026-07-20
---

# RSP Shape Candidate Provenance

The candidate independently reimplements the selected RSP shaping contract. Runtime instructions contain no upstream attribution or maintainer-only paths; this record owns provenance and adoption evidence.

| Selection | Recommendation | Source report and exact paths | Adoption |
| --- | --- | --- | --- |
| Skill boundary | `rsp-skill-system` S5 and S8 | `research/models/rsp-skill-system.md`; selected minimum-suite and installed manual-composition decisions | `model-only` |
| Composition contract | `rsp-shaping-capability` S1; C10/C20/C36/C46 | `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md` (`skills/engineering/to-spec/SKILL.md`, `skills/engineering/to-tickets/SKILL.md`); `research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md` (`skills/ce-brainstorm/SKILL.md`, `skills/ce-plan/SKILL.md`, `docs/solutions/skill-design/beta-promotion-orchestration-contract.md`); `research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md` (`skills/brainstorming/SKILL.md`, `skills/writing-plans/SKILL.md`); `research/local-skills/2026-07-19.md` (`skills/engineering-flow/SKILL.md`, `skills/local-issues/SKILL.md`) | `independent-reimplementation` except Compound contract `model-only` |
| Tracer-bullet shallow Groups | `rsp-shaping-capability` S2; C10/C46 | Matt and local reports above; `research/upstreams/spec-kit/57cc518d63d6f10da3dd93df1ebcadda87c59374.md` (`templates/commands/specify.md`, `templates/plan-template.md`, `templates/tasks-template.md`, `docs/reference/agentic-sdd.md`) | `independent-reimplementation`; Spec Kit lens `model-only` |
| Derived dependency navigation | `rsp-shaping-capability` S3 | `research/upstreams/openspec/46a4d782229ebb104268130a16e85cb7662a2281.md` (`schemas/spec-driven/schema.yaml`, `src/core/artifact-graph/types.ts`, `src/core/artifact-graph/state.ts`, `docs/agent-contract.md`) | `model-only` |
| Overall Delivery profile | `rsp-shaping-capability` S4 | Independent RSP design in `research/models/rsp-shaping-capability.md` | `not-applicable` |
| Restraint and promotion fixtures | `rsp-shaping-capability` S5 | Superpowers report above; `research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md` (`skills/ponytail/SKILL.md`, `skills/ponytail-review/SKILL.md`, `benchmarks/agentic/run.py`, `benchmarks/agentic/tasks.py`); `research/upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md` (`skills/karpathy-guidelines/SKILL.md`, `EXAMPLES.md`) | `independent-reimplementation` and `model-only`; no copied runtime prose |

All selected reports record the relevant license and reuse review. The candidate adds no dependency on upstream repositories, proprietary host behavior, or non-MIT payload.

## Current Evaluation Boundary

Candidate `2026.07.20.11` passed static conformance, deterministic fixtures, three fresh complete paired matrices, and context-cost calibration at the hashes above. The exact payload moved unchanged to `skills/rsp-shape/`; the research candidate owner was removed. Promotion evidence is recorded in `research/evaluations/rsp-shape/2026-07-20-v11-promotion/report.md`. Earlier versions and runs with different candidate, fixture, harness, or execution-config identities remain diagnostic only.
