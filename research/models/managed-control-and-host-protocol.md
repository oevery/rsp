---
sources:
  - "deepseek-harness@47f943859bef60e4160492346772ded9b24f765a -> research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a-subagent-model.md"
  - "superpowers@b36e0829c6d0140e93cfef2ca599b1b07d4a7797 -> research/upstreams/superpowers/b36e0829c6d0140e93cfef2ca599b1b07d4a7797-subagent-model.md"
  - "openai-agents-python@37a7aa20cee5f16d3720214c39dc66ca9f143e74 -> research/upstreams/openai-agents-python/37a7aa20cee5f16d3720214c39dc66ca9f143e74.md"
  - "langgraph@644815f9e5bc52ad8f7a5227a456227e9c3e639b -> research/upstreams/langgraph/644815f9e5bc52ad8f7a5227a456227e9c3e639b.md"
  - "anthropic-managed-agents@f6656c1256d5a8adfa37db9110046ef20bac644c -> research/upstreams/anthropic-managed-agents/f6656c1256d5a8adfa37db9110046ef20bac644c.md"
  - "temporal-workflow-observability@76c3ae4d236a4d91f3d56d4a97d3eb2b66f77363 -> research/upstreams/temporal-workflow-observability/76c3ae4d236a4d91f3d56d4a97d3eb2b66f77363.md"
status: complete
---

# Cross-source Model: Managed Control and Host Protocol

This model refines the earlier subagent-orchestration synthesis. It is maintainer research, not product truth; current Specs, published Skills, code, and tests remain authoritative.

## Shared Mechanisms

- **Control transfer differs from work delegation.** Core may transfer phase control to Manage or one Discipline. Manage retains the selected goal while a worker receives only one bounded Assignment. OpenAI's handoff/tool distinction clarifies the relationship; DeepSeek and Superpowers reinforce that delegated identity grants no additional authority.
- **Routing and dispatch are orthogonal.** A goal may qualify for Manage because lifecycle, review, recovery, or acceptance coordination exists even when its immediate critical path has no useful worker seam. Worker need is therefore a nested decision, not a second controller route.
- **Reusable context differs from one invocation.** LangGraph's thread/invocation separation and the existing longitudinal-reuse model support a stable `WorkerSession` plus a per-call `WorkerInvocation`. Admission, replay safety, cancellation, settlement, Receipt, and release belong to the invocation.
- **Host facts are projections, not domain state.** Anthropic's client-facing lifecycle and Temporal's event-order evidence show why creation, admission, activity, cancellation acknowledgement, settlement, and release must remain distinct observations. Provider handles and statuses do not become RSP vocabulary or persisted artifacts.
- **Worker claims differ from accepted evidence.** A structured `WorkerReceipt` is attributable and inspectable, but Manager acceptance requires actual paths and diff, fresh verification, authority validity, host observations, and resource release. Runtime settlement closes liveness, not acceptance.
- **Concurrency requires evidenced isolation.** A stateful WorkerSession cannot safely overlap context-mutating invocations merely because a host exposes multiple calls. Parallel execution requires distinct observed execution contexts and non-conflicting resources.

## Disagreements and Resolutions

| Question | Source tension | RSP resolution |
| --- | --- | --- |
| Does managed selection imply delegation? | Some agent workflows are defined by spawning workers; OpenAI separately supports retained-control tool invocation | Manage qualification derives from coordination obligations. `DispatchDisposition` independently records `none`, `preferred`, or `required`. |
| Who owns the active goal after dispatch? | Handoffs transfer active-agent control; subagent systems often retain a supervisor | Core-to-Manage is `ControlTransfer`; Manage-to-worker is bounded delegation. A worker never becomes `NextOwner` of the managed goal. |
| What is the reusable unit? | LangGraph threads retain state; Superpowers prefers fresh workers; DeepSeek preserves Sessions | Reuse only a compatible `WorkerSession`; each admitted call creates a distinct `WorkerInvocation`. Fresh context is required after invalidated identity, authority, strategy, or isolation. |
| When is work complete? | Hosted runtimes expose idle/outcome states; workflow systems expose handler completion | Settlement is host liveness. Acceptance is Manager-owned and requires a valid Receipt plus inspected evidence. Release is a later resource boundary. |
| What proves dispatch behavior? | Agent receipts can self-report routing; event systems supply observer history | Keep semantic self-report under `agent_reported`; derive lifecycle measurements from host events when exposed, otherwise record null and omissions. |
| Should runtime history aid recovery? | LangGraph and Temporal persist replayable execution history | No. RSP recovers from repository-owned artifacts and fresh host observations; runtime history remains transient. |

## RSP Gaps Addressed

1. Manage selection previously coupled too strongly to a mandatory implementation-worker dispatch, forcing synthetic delegation for coupled critical-path work.
2. `WorkerSession` carried both reusable context identity and one-call lifecycle semantics.
3. Worker completion, Receipt validity, accepted evidence, and host release were not named as separate boundaries.
4. Managed-controller evaluation projected an agent-authored dispatch count as though it were an observed measurement.
5. Host lifecycle detail lacked one thin, conditional adapter boundary and risked leaking provider-specific vocabulary into portable Skills.

## Rejected Ideas

- A cross-product state machine combining Core route, Manage mode, dispatch need, worker lifecycle, acceptance, and closeout.
- Durable WorkerSession, WorkerInvocation, event, queue, mailbox, checkpoint, replay, or Receipt registries under `.rsp/`.
- Provider-specific handles, statuses, model tiers, polling delays, sandboxes, or cleanup APIs as canonical RSP concepts.
- Mandatory delegation for every managed run, controller self-certification for required independent work, or parallel calls through one unproven stateful context.
- Treating structured output, provenance, runtime settlement, idle, outcome grades, token savings, or latency as acceptance evidence.

## Candidate Recommendations

- **MCH1 — Separate control transfer from delegation (`model-only`).** Core selects and transfers phase control; Manage retains goal ownership while workers execute bounded Assignments.
- **MCH2 — Add transient `DispatchDisposition` (`independent-reimplementation`).** Derive `none | preferred | required` after Manage selection. `none` permits bounded local Discipline execution; `required` fails closed when the obligation cannot be satisfied.
- **MCH3 — Split `WorkerSession` and `WorkerInvocation` (`independent-reimplementation`).** Keep context continuity on the Session and admission-through-release facts on one Invocation; prohibit overlapping stateful mutation without proved isolation.
- **MCH4 — Separate `WorkerReceipt` from `AcceptedLaneEvidence` (`independent-reimplementation`).** Receipt syntax and attribution are necessary but insufficient; Manager inspection creates accepted evidence.
- **MCH5 — Add a thin host observation port (`model-only`).** Project lifecycle facts conditionally and transiently without importing a hosted runtime model.
- **MCH6 — Make lifecycle metrics observer-authored (`independent-reimplementation`).** Host events may prove counts and order; agent semantic reports remain labeled claims; unavailable observations remain null.
- **MCH7 — Preserve repository-native recovery (`reject`).** Do not add durable runtime history or replay state.
