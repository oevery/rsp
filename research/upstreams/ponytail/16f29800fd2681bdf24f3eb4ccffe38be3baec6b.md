---
source: ponytail
revision: 16f29800fd2681bdf24f3eb4ccffe38be3baec6b
base: null
strategy: adapt
evidence_hash: sha256:a7cc74ee6de8dc20ddf44b63bd2542ed88cd5f284e73f70898bb8f4ae7730f5d
status: complete
---

# Upstream Distillation: ponytail

## Source Position

- **Evidence:** Ponytail is an anti-overengineering guideline distributed through skills, always-on rules, host hooks, and modes (`README.md`, `skills/**`, `hooks/**`).
- **Evidence:** It includes a benchmark harness comparing baseline and intervention arms with deterministic safety/correctness gates, LLM judges, token/cost/duration measurements, isolated workspaces, and documented limitations (`benchmarks/**`).
- **Inference:** Its strongest contribution to RSP is evaluation design and restraint criteria. Its always-on injection machinery conflicts with RSP's preference for a small deterministic core.

## Extracted Mechanisms

### M1 — Simplicity is a bounded ladder, not blind deletion

- **Evidence:** The main skill prefers existing code, standard library, platform primitives, installed dependencies, and smaller expressions before new abstraction, while explicitly protecting validation, security, accessibility, and data safety (`README.md`, `skills/ponytail/SKILL.md`).
- **Inference:** Minimality should be judged after correctness and safety gates, never as a substitute for them.

### M2 — Overengineering is an independent review axis

- **Evidence:** Review/audit skills classify avoidable complexity separately and use categories such as delete, standard library, native primitive, YAGNI, and shrink; one-shot review does not silently fix code (`skills/ponytail-review/SKILL.md`, `skills/ponytail-audit/SKILL.md`).
- **Inference:** RSP review can preserve standards, spec fidelity, and simplicity as separate axes so a low-LOC result cannot hide incorrect behavior.

### M3 — Evaluation needs isolation and restraint negatives

- **Evidence:** Benchmarks run agents on fresh repository copies, hold judging parameters stable, collect cost/context metrics, and keep deterministic gates ahead of subjective scoring (`benchmarks/**`).
- **Evidence:** A contaminated baseline was detected and corrected by isolating per-arm plugin/settings state (`benchmarks/**`).
- **Inference:** Skill evaluations must prove both intended action and correct non-action while preventing host configuration leakage between variants.

## Applicable to RSP

- Add a simplicity axis after safety, correctness, standards, and spec gates.
- Evaluate candidates in isolated workspaces with pinned prompts, revisions, host configuration, and judge settings.
- Record token/context cost and tool/latency overhead alongside behavioral outcomes.
- Require explicit review output; do not let a review skill mutate by default.

## Rejected

- Always-on rules, persistent modes, session hooks, and subagent injection; they create hidden state and repeat project policy.
- Using LOC or token reduction as the primary objective.
- Shipping separate help/gain/debt mode skills before a concrete RSP user journey needs them.
- Copying host adapter machinery or persistent `.ponytail-*` state into RSP.

## License and Reuse

- MIT at the reviewed revision (`LICENSE`).
- Direct adaptation, if later selected, should be limited to exact skill or benchmark files named by a normal RSP change and preserve notice/attribution. Prefer independently implementing the evaluation harness and restraint rubric.

## Recommendations

- **R1 — Build a multi-axis skill evaluation harness (`independent-reimplementation`).** Gate safety/correctness first, then score spec fidelity, standards, simplicity, restraint, and context cost.
- **R2 — Add isolated clean/defect/ambiguity fixtures (`independent-reimplementation`).** Include host-state contamination checks.
- **R3 — Add simplicity as a third review axis (`adapt`).** Keep it advisory and separate from standards and spec findings.
- **R4 — Reject always-on injection and modes (`reject`).** Selection should come from explicit task intent or the RSP stage, not persistent hidden state.
