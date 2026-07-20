---
source: superpowers
revision: d884ae04edebef577e82ff7c4e143debd0bbec99
base: null
strategy: adapt
evidence_hash: sha256:c0655d54c445936545b957d15696f91f3d5a8feda4a242af76ac1e1c536c9c8c
status: complete
---

# Upstream Distillation: superpowers

## Source Position

- **Evidence:** Superpowers is a tightly coupled development-method plugin whose bootstrap requires skill discovery before action and whose suite covers brainstorming, plans, TDD, debugging, worktrees, subagent execution, review, and completion verification (`README.md`, `skills/using-superpowers/SKILL.md`, `skills/**`).
- **Evidence:** It tests explicit-skill requests, host packaging, hooks, worktree policy, and subagent-driven development through executable harnesses (`tests/**`).
- **Inference:** The reusable value is disciplined verification and skill behavior testing; the mandatory full-method routing is too prescriptive for RSP's progressive levels.

## Extracted Mechanisms

### M1 — Process claims are operationally testable

- **Evidence:** Explicit-request fixtures probe whether agents honor named skills even when prompts suggest shortcuts, and integration tests execute real skill flows (`tests/explicit-skill-requests/**`, `tests/claude-code/**`).
- **Inference:** RSP skill evaluation should test trigger obedience, shortcut resistance, and multi-turn persistence, not just validate Markdown metadata.

### M2 — Verification evidence precedes completion language

- **Evidence:** The completion skill requires running the relevant verification command and reading current output before claiming success (`skills/verification-before-completion/SKILL.md`).
- **Inference:** “Verified” should be a fresh evidence state with command, scope, result, and known omissions, never an inference from implementation.

### M3 — TDD and diagnosis are independent disciplines

- **Evidence:** Dedicated skills define test-first behavior and systematic debugging rather than embedding both into every orchestration prompt (`skills/test-driven-development/SKILL.md`, `skills/systematic-debugging/SKILL.md`).
- **Inference:** RSP should compose focused discipline skills based on task type instead of growing one monolithic core skill.

### M4 — Subagent execution needs review and handoff boundaries

- **Evidence:** Subagent-driven development supplies bounded task context, requests review, verifies fixes, and limits expensive redispatch patterns (`skills/subagent-driven-development/SKILL.md`).
- **Inference:** A future managed mode needs explicit artifact handoffs, isolation, verification receipts, and stop conditions.

### M5 — Requesting review fixes scope and intent

- **Evidence:** `requesting-code-review` passes the implementation summary, requirements or plan, and explicit base/head revisions to a reviewer, and places review both after bounded tasks and before integration (`skills/requesting-code-review/SKILL.md`, `skills/requesting-code-review/code-reviewer.md`).
- **Inference:** RSP review should resolve one fixed comparison target and the relevant Change/Spec authority before inspecting findings; “review the current work” cannot silently drift as files change.

### M6 — Receiving feedback is a separate verification discipline

- **Evidence:** `receiving-code-review` requires technical verification before implementation, clarification of ambiguous feedback, severity-ordered handling, and resistance to performative agreement or blind application (`skills/receiving-code-review/SKILL.md`).
- **Evidence:** Separate spec/plan reviewer prompts create review loops around planning artifacts before implementation (`skills/brainstorming/spec-document-reviewer-prompt.md`, `skills/writing-plans/plan-document-reviewer-prompt.md`).
- **Inference:** Producing findings and resolving findings are different capabilities. The first RSP reviewer should remain report-only; a later resolver or implementation loop may verify and apply selected findings.

## Applicable to RSP

- Test explicit invocation, negative shortcuts, fresh verification evidence, and cross-host packaging.
- Keep TDD, diagnosis, implementation, and review as separable capabilities selected by task and RSP stage.
- Define verified state from observed current commands and preserve unverified gaps.
- For managed mode, bound subagent inputs/outputs and require review after implementation.
- Bind every review to explicit intent and a stable comparison point, and keep review production separate from feedback resolution.

## Rejected

- The universal rule that any possibly relevant skill must be invoked before every response/action; this overrules local judgment and increases context.
- Mandatory brainstorming/planning/worktree/TDD for tiny or already-specified tasks.
- Skill-defined Git mutations as implied authority.
- Installing bootstrap hooks or the entire suite as an RSP dependency.
- Unbounded approve/fix review loops and automatic acceptance of reviewer feedback without independent verification.

## License and Reuse

- MIT at the reviewed revision (`LICENSE`).
- Exact skill/test adaptation may be permitted with notice, but RSP should independently implement its trigger and evaluation fixtures and only adapt narrowly selected discipline behavior after comparison.

## Recommendations

- **R1 — Add executable trigger and shortcut-resistance tests (`independent-reimplementation`).** Include explicit skill naming, mid-conversation selection, and requests to skip gates.
- **R2 — Define a fresh-verification receipt (`adapt`).** Record command, scope, timestamp/session freshness, result, and omitted coverage without granting commit authority.
- **R3 — Keep discipline skills independent (`model-only`).** TDD, diagnosis, review, and implementation should compose through RSP artifacts, not invoke one another recursively.
- **R4 — Reserve subagent-managed delivery for a later optional controller (`model-only`).** It must consume stable capabilities rather than define them.
- **R5 — Require a fixed review request contract (`independent-reimplementation`).** Pass the selected Change/Spec authority, implementation summary when available, explicit file/diff scope, and immutable comparison point.
- **R6 — Keep findings production separate from findings resolution (`model-only`).** The first reviewer is read-only; a later resolver verifies ambiguous or disputed feedback before any edit and re-runs targeted validation after accepted fixes.
