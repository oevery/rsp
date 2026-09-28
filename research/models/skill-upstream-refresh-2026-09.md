---
topic: skill-upstream-refresh-2026-09
status: complete
research_date: 2026-09-28
sources:
  - "addy-agent-skills@2686b620fc1fed2e8f60c704839c766b8594c6b6 -> research/upstreams/addy-agent-skills/2686b620fc1fed2e8f60c704839c766b8594c6b6.md"
  - "agent-skills-spec@69ef37e9424c0a7ea9dd2293b559e43ec8176379 -> research/upstreams/agent-skills-spec/69ef37e9424c0a7ea9dd2293b559e43ec8176379.md"
  - "andrej-karpathy-skills@2c606141936f1eeef17fa3043a72095b4765b9c2 -> research/upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md"
  - "antfu-skills@d02c48452d782231e4c32d7069cde731a4c7db42 -> research/upstreams/antfu-skills/d02c48452d782231e4c32d7069cde731a4c7db42.md"
  - "anthropic-managed-agents@33375500bcea98d610eb30ce10ac4e59b89c390d -> research/upstreams/anthropic-managed-agents/33375500bcea98d610eb30ce10ac4e59b89c390d.md"
  - "anthropic-skill-creator@33375500bcea98d610eb30ce10ac4e59b89c390d -> research/upstreams/anthropic-skill-creator/33375500bcea98d610eb30ce10ac4e59b89c390d.md"
  - "compound-engineering@8a6e0a2ff0e0d4c71cdb0b5cc4eefb847d6c646c -> research/upstreams/compound-engineering/8a6e0a2ff0e0d4c71cdb0b5cc4eefb847d6c646c.md"
  - "deepseek-harness@21638c56315ae6a2b552d6091945d3144c9af32e -> research/upstreams/deepseek-harness/21638c56315ae6a2b552d6091945d3144c9af32e.md"
  - "everything-claude-code@d3b8a3e908904e242ed2dbe66af62cca71131419 -> research/upstreams/everything-claude-code/d3b8a3e908904e242ed2dbe66af62cca71131419.md"
  - "gsd-core@b5dc98a4c748746e915612dc37e76255d74e464f -> research/upstreams/gsd-core/b5dc98a4c748746e915612dc37e76255d74e464f.md"
  - "langgraph@07b33185eab893be2ed031eedae52f09314bf77c -> research/upstreams/langgraph/07b33185eab893be2ed031eedae52f09314bf77c.md"
  - "matt-skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 -> research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md"
  - "no-negative-echo@eba9f1d2b4c19e699786a49427189988ad6d8d65 -> research/upstreams/no-negative-echo/eba9f1d2b4c19e699786a49427189988ad6d8d65.md"
  - "openai-agents-python@08e5c431eb85d243b62d904f21bc57b6db1682a1 -> research/upstreams/openai-agents-python/08e5c431eb85d243b62d904f21bc57b6db1682a1.md"
  - "openai-plugins@1dc195897af4161d039b80d8471ec0a10c9bbc89 -> research/upstreams/openai-plugins/1dc195897af4161d039b80d8471ec0a10c9bbc89.md"
  - "openspec@79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777 -> research/upstreams/openspec/79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777.md"
  - "planning-with-files@51c1caa27f9fefe259e45a7cc92fa79ee8787cd7 -> research/upstreams/planning-with-files/51c1caa27f9fefe259e45a7cc92fa79ee8787cd7.md"
  - "ponytail@e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156 -> research/upstreams/ponytail/e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156.md"
  - "skill-use-bench@b1f74886957e13b8013fa554649b210955b69980 -> research/upstreams/skill-use-bench/b1f74886957e13b8013fa554649b210955b69980.md"
  - "skillopt@79124b37e9a6371e13b753f8bcd7adb1e493ade1 -> research/upstreams/skillopt/79124b37e9a6371e13b753f8bcd7adb1e493ade1.md"
  - "skills-cli@7407f3893ad4dceab546ac002c3ef806e4000c73 -> research/upstreams/skills-cli/7407f3893ad4dceab546ac002c3ef806e4000c73.md"
  - "skillspector@89e90872e2ec813bcb137bf6b3145c92e55811ae -> research/upstreams/skillspector/89e90872e2ec813bcb137bf6b3145c92e55811ae.md"
  - "spec-kit@c00dc0551583428a10a94443c58c6a41e5e0138c -> research/upstreams/spec-kit/c00dc0551583428a10a94443c58c6a41e5e0138c.md"
  - "superpowers@8ca22dba9a94f28898bbce59f2537ff4d87c747d -> research/upstreams/superpowers/8ca22dba9a94f28898bbce59f2537ff4d87c747d.md"
  - "temporal-workflow-observability@7ae5c7fb6728fe93696e1fc2f0da97018f6f20cc -> research/upstreams/temporal-workflow-observability/7ae5c7fb6728fe93696e1fc2f0da97018f6f20cc.md"
---

# September upstream disposition and model-adaptation evidence

## Decision scope

All 25 registered sources are accounted for: 22 new pinned reports are complete and three unchanged sources retain their existing reports. Completion means bounded semantic distillation and comparison with current RSP, not a line-by-line audit of unrelated upstream features, runtime validation, accepted research baselines or product promotion. This synthesis uses completed reports only.

The user authorized research completion and a disposition matrix. Product Skills, src, rules, Specs and upstreams.lock remain unchanged. No live provider, holdout, installer, upstream executable, commit, push or publication was run. Model efficacy and cost gains remain unmeasured.

## Corrections to the preliminary survey

- OpenSpec coverage now includes docs-lab/**/*.md. Some pages are skeletons, not shipped behavior. The source template supplies the concrete removal/rename verification mechanism.
- No Negative Echo has a real conditional-loading change, not merely installation documentation. Current RSP already implements conditional references and final-state readback.
- Matt Skills does not merit a rewrite merely because many files changed; inspected semantic mechanisms largely remain.
- SkillOpt strict metric validation belongs to slow_update.py, while another gate still offers a leading-word-density bonus. Do not generalize the fix or copy the objective.
- Historical WorkerSession/WorkerInvocation/WorkerReceipt proposals must be reconciled with current host observations and Discipline-owned results; old research nouns do not override current Skills.
- DeepSeek Harness and ECC had later, complete but unaccepted reports. Their test-value/boundary recommendations are already implemented, not new candidate work.

## Source disposition matrix

Include means consideration/evidence planning, not implementation approval. R identifiers are scoped to the linked exact report, not a global namespace.

| Source | Disposition | IDs | Local basis | Action / reopen condition |
| --- | --- | --- | --- | --- |
| [addy-agent-skills](../upstreams/addy-agent-skills/2686b620fc1fed2e8f60c704839c766b8594c6b6.md) | Include evidence | R5 | Named-Skill cases do not establish natural routing. | Use existing evals for natural positives, neighbor negatives and task benefit. |
| [agent-skills-spec](../upstreams/agent-skills-spec/69ef37e9424c0a7ea9dd2293b559e43ec8176379.md) | Unchanged | existing report | No revision change. | Retain format conformance. |
| [andrej-karpathy-skills](../upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md) | Unchanged | existing report | No revision change. | Retain restraint, no new layer. |
| [antfu-skills](../upstreams/antfu-skills/d02c48452d782231e4c32d7069cde731a4c7db42.md) | Covered / reference | R5–R6 | Authored/projection/cache ownership already exists. | No framework corpus or submodule layer. |
| [anthropic-managed-agents](../upstreams/anthropic-managed-agents/33375500bcea98d610eb30ce10ac4e59b89c390d.md) | Defer host work | R5–R6 | No hosted adapter selected. | Reopen on actual pause/settlement mapping need. |
| [anthropic-skill-creator](../upstreams/anthropic-skill-creator/33375500bcea98d610eb30ce10ac4e59b89c390d.md) | No scoped delta | R5–R6 | Registered scope diff is empty. | No new behavioral candidate. |
| [compound-engineering](../upstreams/compound-engineering/8a6e0a2ff0e0d4c71cdb0b5cc4eefb847d6c646c.md) | Include evidence; defer edits | R5–R7 | Conditional review already exists; local cost is unmeasured. | Measure repeated decisions and opposite-direction regressions. |
| [deepseek-harness](../upstreams/deepseek-harness/21638c56315ae6a2b552d6091945d3144c9af32e.md) | Covered / reference | R6–R7 | Boundary and test-value rules already implemented. | Reopen a process repair only on a demonstrated race/leak. |
| [everything-claude-code](../upstreams/everything-claude-code/d3b8a3e908904e242ed2dbe66af62cca71131419.md) | Catalog / optional evidence | R6–R7 | Conditional TDD/test-value rules already exist. | Selected pressure cases only; no suite or quotas. |
| [gsd-core](../upstreams/gsd-core/b5dc98a4c748746e915612dc37e76255d74e464f.md) | Covered / reference | R4–R5 | Document-model ownership and parse diagnostics already exist. | No phase system or parser replacement without a bug. |
| [langgraph](../upstreams/langgraph/07b33185eab893be2ed031eedae52f09314bf77c.md) | Defer host work | R5–R6 | Typed interruption is a runtime capability. | Keep replay constraints, not runtime objects. |
| [matt-skills](../upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md) | No new candidate | R4–R5 | Sampled mechanisms remain; invocation/wording changed. | Do not prioritize rewriting from file-count churn. |
| [no-negative-echo](../upstreams/no-negative-echo/eba9f1d2b4c19e699786a49427189988ad6d8d65.md) | Covered / reference | R4–R5 | Substantive conditional-loading change, but RSP already has the pattern and readback. | No always-on cleanup Skill. |
| [openai-agents-python](../upstreams/openai-agents-python/08e5c431eb85d243b62d904f21bc57b6db1682a1.md) | Conditional evidence | R5–R6 | Current rules disclose authority and isolation limits. | Test actual recipient input for a selected host; no SDK persistence. |
| [openai-plugins](../upstreams/openai-plugins/1dc195897af4161d039b80d8471ec0a10c9bbc89.md) | Distribution reference | R5–R6 | No concrete integration gap. | Plain Skills; per-asset licensing. |
| [openspec](../upstreams/openspec/79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777.md) | Bounded evidence option | R4–R5 | Removal/rename is a distinct case class, not a reproduced RSP bug. | Test correct absence versus missing behavior; no lifecycle import. |
| [planning-with-files](../upstreams/planning-with-files/51c1caa27f9fefe259e45a7cc92fa79ee8787cd7.md) | Covered / optional evidence | R4–R5 | Explicit ownership and fresh recovery already exist. | Stale-owner control if selected; no second ledger. |
| [ponytail](../upstreams/ponytail/e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156.md) | Keep integration excluded | R1–R2 | Canonical Skills unchanged; hooks changed. | No ambient injection. |
| [skill-use-bench](../upstreams/skill-use-bench/b1f74886957e13b8013fa554649b210955b69980.md) | Unchanged | existing R1–R5 | No revision change; prior licensing restriction remains. | Model-only dimensions, no copied corpus. |
| [skillopt](../upstreams/skillopt/79124b37e9a6371e13b753f8bcd7adb1e493ade1.md) | Reference / exclude heuristic | R5–R6 | Metric repair is path-specific; density bonus remains elsewhere. | No keyword-density reward or automatic promotion. |
| [skills-cli](../upstreams/skills-cli/7407f3893ad4dceab546ac002c3ef806e4000c73.md) | No current repair | R4–R5 | Canonical project path already matches inspected changes. | Reopen on actual host discovery failure. |
| [skillspector](../upstreams/skillspector/89e90872e2ec813bcb137bf6b3145c92e55811ae.md) | Defer reporting extension | R5–R6 | Opaque-content limitation exists, but no such current shipped asset was found. | Reopen for opaque content or expanded security claims. |
| [spec-kit](../upstreams/spec-kit/c00dc0551583428a10a94443c58c6a41e5e0138c.md) | Covered / reference | R4–R5 | Independent intent-based routes already exist. | No assessment tree or mandatory stages. |
| [superpowers](../upstreams/superpowers/8ca22dba9a94f28898bbce59f2537ff4d87c747d.md) | Defer product edits | R4–R5 | Lean Shape and conditional delegation already exist. | First capture a local redundant-planning/coordination trace. |
| [temporal-workflow-observability](../upstreams/temporal-workflow-observability/7ae5c7fb6728fe93696e1fc2f0da97018f6f20cc.md) | Covered / host reference | R5–R6 | Current Verify/Manage distinguish cancellation from observed settlement. | No durable event history. |

## Shared mechanisms

1. **Carry decisions, not implementation transcripts.** Superpowers and Compound Engineering separate non-derivable decisions/conditions from execution details. RSP already favors compact Changes and callee-owned procedures. Measure redundant work before trimming.
2. **Routing, benefit and safety differ.** Addy and Skill-Use-Bench distinguish invocation from quality and boundaries. RSP already separates exposure, execution and independent semantic review; explicit Skill naming still leaves natural-selection coverage incomplete.
3. **Recovery requires identity and fresh evidence.** Planning-with-files, Agents SDK, LangGraph and Temporal reinforce bounded inputs, replay caution and observed settlement without requiring an RSP runtime database.
4. **Unknown is not success.** OpenSpec separates inapplicability from missing evidence; SkillSpector separates finding severity from coverage. Existing RSP largely preserves this, and extensions must not erase it.

## Disagreements

- Superpowers simplifies plan bodies but retains blanket TDD, commit steps and fixed review policy. RSP keeps test-first conditional and delivery separately authorized.
- Compound Engineering has system-specific line thresholds and review topology. The useful consequence/cost model does not require copying those values.
- Addy uses lexical/regex diagnostics beside behavioral evaluation. Those diagnostics must not become RSP acceptance gates.
- SkillOpt permits soft/text-density rewards and maps some invalid values to zero. RSP must not trade correctness for a soft score or label missing evidence as a measured model failure.
- Host frameworks expose service permission controls and runtime objects. Available capability never expands user authority.

## Candidate recommendations

### C1 — Natural-request routing and benefit evidence: first candidate to select

- **Observed gap:** public trigger cases including rsp-shape and rsp-manage explicitly name the Skill. Natural review/workflow cases do not establish catalog-wide natural selection. Host version is already captured in evals/adapters/opencodex.mjs; do not add it again.
- **Owner:** evals/cases/ and the existing comparison/review runner, not a new router.
- **Provenance:** addy-agent-skills R5 and compound-engineering R7, independent-reimplementation; retained skill-use-bench R1/R3, model-only.
- **Smallest behavior set:** selected capability natural positive, neighboring-intent negative, paraphrase/pressure variant, and independently judged task/authority outcomes separate from exposure. Select cases by risk, not a fixed count.
- **Evaluation:** hold prompt, fixture, host and model settings fixed between current/candidate. Use a no-Skill arm only when it answers incremental benefit. Compare success, wrong stops, forbidden actions, corrections, tool calls, total tokens and time. Real runs require separate cost/configuration authority.
- **Non-goals:** universal router, immediate description rewriting, regex/heading acceptance or live execution in this research wave.

### C2 — Coordination and plan cost: collect evidence before editing Skills

- **Hypothesis, not observed defect:** Core/Manage may repeat decisions or over-prepare. Existing direct/local routes mean upstream evidence alone is insufficient.
- **Owner and provenance:** maintainer evaluation; superpowers R4/R5 and compound-engineering R5/R6, model-only.
- **Required evidence:** a real trace identifying a repeated decision, its loaded references and an outcome-preserving alternative. Contrast a cheap local failure with a similarly small silent authority-sensitive failure.
- **Stop:** retain the baseline if no redundant step is found. A quality tie or tiny cost sample does not establish broad improvement.

### C3 — Targeted boundary cases: select independently when relevant

- openspec R4: intended removal/rename versus genuinely missing required behavior.
- planning-with-files R4: selected owner versus stale/ambiguous guidance and unrelated dirty work.
- openai-agents-python R5: synthetic inherited-context contamination at an actual host adapter; attestations are not input-isolation proof.
- deepseek-harness R6 and skillspector R5: observed process failure or newly in-scope opaque content only.

These are separate options, not an omnibus infrastructure Change or permission to add tests for unreachable states.

## Continued exclusions

Keep whole suites, universal routing, automatic Git/publication, ambient hooks, session scraping, unattended self-modification, secondary ledgers, runtime persistence, generic remote installers and framework bundles excluded. Reopening requires a concrete local need, an owning artifact, explicit authority, a bounded mechanism and exact source/license provenance. No formerly rejected mechanism is automatically reopened.

Instruction length, keyword density, test count, coverage percentage and reviewer count are not quality criteria. Source freshness and a new model label establish neither obsolescence nor improvement.

## Validation and acceptance boundaries

Closing validation passed for report metadata, prepared evidence hashes, exact Git patch hashes and file inventories, required sections, absent scaffolding markers, 62 local links, all 25 model source revisions and declared path coverage. Historical reports and accepted lock values remain unchanged. The existing docs check and git diff --check also passed; site checks and research provenance checks have distinct scopes. No product build/test or real-model result is inferred from them.

nextAction=accept is a mechanical indication of completed distillation, not authority to advance the lock. Research-baseline acceptance needs a separate user choice; product work needs a selected Change. Live models, independent holdouts and full host behavior remain unverified.
