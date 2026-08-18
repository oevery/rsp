---
topic: agent-implementation-restraint-and-test-value
status: complete
decision_status: candidate
sources:
  - "deepseek-harness@99f6f02fecdb7dff40c3fbc9470f5907c29f74ca -> research/upstreams/deepseek-harness/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca.md"
  - "everything-claude-code@06c5e118c4d3e6c3b7f9445f973a2194c82de193 -> research/upstreams/everything-claude-code/06c5e118c4d3e6c3b7f9445f973a2194c82de193.md"
  - "ponytail@16f29800fd2681bdf24f3eb4ccffe38be3baec6b -> research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md"
  - "andrej-karpathy-skills@2c606141936f1eeef17fa3043a72095b4765b9c2 -> research/upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md"
  - "superpowers@d884ae04edebef577e82ff7c4e143debd0bbec99 -> research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md"
  - "addy-agent-skills@df1edb2e05487d0aa6d93c747141e0aed1187f25 -> research/upstreams/addy-agent-skills/df1edb2e05487d0aa6d93c747141e0aed1187f25.md"
  - "matt-skills@9603c1cc8118d08bc1b3bf34cf714f62178dea3b -> research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md"
  - "compound-engineering@d1bff966296b687eb8509312098458e5fa2535dc -> research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md"
---

# Agent Implementation Restraint and Test Value

## Decision

The observed friction justifies one bounded future candidate in `rsp-implement`, not a new general testing workflow or a wholesale upstream suite. RSP already selects ordinary implementation by default and reserves TDD for explicit policy or a concrete changed risk. The missing behavior is earlier and narrower: before creating a defensive boundary or permanent test, the implementer does not yet have to prove that the boundary is reachable or that the test owns an independent production regression.

The candidate should add four non-default behaviors to `rsp-implement`, evaluated through existing maintainer infrastructure before any publication:

1. Require a current producer, production consumer, actual trust or lifecycle transition, and material consequence before adding a validator, fallback, defensive copy, capability, state machine, compatibility path, or public option.
2. Require a permanent test to name its observable consequence, distinct plausible regression, why existing evidence misses it, and maintenance cost.
3. Classify consumers as production, non-production, or ambiguous before preserving a generic API or test-only seam. Tests and documentation alone do not make a behavior load-bearing.
4. Select the smallest decisive evidence owner. Keep multiple nearby tests when they protect independent failure reasons; prefer an existing test, typecheck, lint rule, build, or behavior check over a new file-corresponding test when it already owns the risk.

This model does not authorize that candidate, alter a published Skill, or accept either pending upstream revision.

## Shared Mechanisms

### 1. Correctness and safety gate simplicity

Ponytail M1/M2 and Karpathy M1 agree that minimality is an independent quality property after correctness, safety, and scope fidelity. DeepSeek M1 makes the boundary concrete: a real producer, consumer, trust/lifecycle transition, and consequence distinguish necessary protection from imagined defensive code. The result is not "delete more"; it is "make every added seam pay rent."

### 2. Production reachability precedes abstraction and test retention

DeepSeek M2/M4 separates production from test/doc-only consumers and preserves tests that still own external behavior after an accidental wrapper disappears. Matt M4 and Superpowers M5/M6 reinforce fixed authority and fixed comparison scope. An API or test should therefore be judged from its owning production consequence, not from the fact that code and tests already reference each other.

### 3. Tests protect consequences and failure reasons, not files or hops

DeepSeek M3 requires observable state, logs, events, disposal, or another external projection. Ponytail M3 adds restraint negatives; Compound M3 requires duplicate finding control; ECC M4 shows that RED/GREEN evidence is strong only after a concrete risk has selected TDD. Together they support a test-ownership question: "What distinct regression would this test catch that existing evidence would not?"

### 4. Compliance and value are separate measurements

ECC M1 can determine whether an agent followed a sequence under supportive, neutral, and competing prompts. Addy M1/M2 and Superpowers M1 similarly test trigger obedience and shortcut resistance. None of these prove that the resulting test or abstraction is useful. Candidate evaluation must project process compliance and semantic value independently.

### 5. Deterministic facts precede model judgment

ECC M2/M3, Ponytail M3, Addy M1, and Compound M4 all favor deterministic structure or execution evidence before subjective grading. Producer/consumer reachability, file ownership, existing tests, type/lint coverage, and duplicate assertions can often be collected mechanically. Whether two tests protect meaningfully different regressions remains a bounded review judgment.

### 6. Promotion requires contrastive evidence and correct non-action

Karpathy M3, Ponytail M3, Addy M2, ECC M1, and Superpowers M1 all use negative or pressure cases. A useful restraint capability must reject an invented boundary and low-value tests without suppressing a genuinely independent test. Clean, ambiguous, and competing cases are mandatory because a skill that always says "do less" is as wrong as one that always expands.

## Disagreements and RSP Resolution

| Question | Source tension | RSP resolution |
| --- | --- | --- |
| Is TDD the default for every mutation? | ECC and Superpowers use broad mandatory TDD; current RSP, DeepSeek selection logic, and real-project friction require proportional evidence | Keep TDD conditional on project policy, user request, or a concrete changed risk with a valuable pre-mutation RED |
| Should coverage quotas gate quality? | ECC mandates 80%+ and DeepSeek requires 100% per file in its own repository | Coverage remains host-owned supporting evidence; no RSP percentage or universal tier matrix |
| Should every edge case be tested? | ECC says all edge cases; DeepSeek distinguishes typed same-process values from actual trust boundaries | Require a reachable producer, transition, consumer, and consequence; imagined states do not become default tests |
| Does simplification mean fewer tests? | Anti-overengineering sources reward deletion; DeepSeek preserves tests that own independent behavior | Delete accidental seams and mirrored tests, but retain multiple tests when each protects a distinct failure reason |
| Should repeated guidance become a global rule? | ECC `rules-distill` promotes repeated cross-Skill principles; RSP favors narrow capability owners | Start with fixtures and one Skill owner; promote only after repeated independent friction, semantic deduplication, and explicit approval |
| Are large official catalogs stronger evidence? | Vendor catalogs have provenance and production investment; focused engineering suites expose more directly relevant behavior | Use official catalogs for packaging, source binding, and eval-harness comparison; use exact mechanisms, not company size, as adoption evidence |

## Official Catalog Spot-check

These repositories were sampled at their current `main` revisions on 2026-08-17 and were not registered as new upstreams because no exact general implementation-restraint or test-value Skill justified ongoing tracking. They are context, not sources for the recommendations above.

| Repository | Sampled revision | Relevant observation | Disposition |
| --- | --- | --- | --- |
| `google/skills` | `8f57a0d9839ba9e33aa5367dfeb7ba37598175e3` | Large official catalog centered on Google Cloud, Analytics, Ads, Firebase, and product-specific operations; tests are capability-local | Do not register for this gap |
| `google/agents-cli` | `5a306f8956cb1eeae69f9709de0e4d61b44e11e7` | Agent scaffold, evaluation, observability, deployment, and ADK code Skills; useful agent-eval domain tooling, not a generic code-restraint contract | Revisit only for a selected agent-evaluation tooling gap |
| `microsoft/skills` | `e20084b9d230c6f3b46ce36f011e6c3e50f79f8a` | Broad Azure/domain catalog with a substantial scenario and skill-effectiveness harness | Potential dedicated eval-harness source; not needed for the current behavior model |
| `android/skills` | `1e5e7ae6138bebd0835d0d5854b0b9adfeed3181` | Android platform, migration, performance, security, and testing-setup Skills | Domain reference only |

Google Engineering Practices and the Google testing literature are useful adjudication criteria because they emphasize small understandable changes and behavior-oriented tests, but they are documentation rather than a complete agent Skill contract. They do not replace executable contrastive evaluation.

## RSP Gaps

- `rsp` already routes ordinary implementation by default and requires TDD only when selected. No new router, testing lifecycle, or coverage policy is needed.
- `rsp-implement` refers to real boundaries and proportionate verification, but it does not require evidence fields that distinguish a reachable material boundary from an imaginable edge case before mutation.
- `rsp-implement` and `rsp-tdd` require focused tests, but no pre-retention ownership gate rejects tests whose only purpose is mirroring a touched file, wrapper call, shared constant, or source string.
- `rsp-review` can detect speculative generality after implementation, but relying on review alone makes deletion and correction more expensive than preventing the seam.
- Existing candidate evaluation can measure Boundary and task result, but this behavior still needs contrastive fixtures that distinguish correct non-action from under-testing.

## Contrastive Fixtures

### F1 — Event lifecycle without a fake capability

- **Setup:** A desktop shell emits one typed event and a web listener closes a sidebar. No runtime policy selects or negotiates the behavior.
- **Expected restraint:** Keep the real event/listener lifecycle and its externally visible behavior. Reject a new generic capability flag and reject hop-by-hop tests that only prove a shared channel constant was forwarded through wrappers.
- **Failure caught:** Invented extension surface and file-corresponding tests with no independent consequence.

### F2 — Same-size window with two independent tests

- **Setup:** A window update receives dimensions equal to current dimensions. One regression causes user-visible flicker; another still performs a native bounds write.
- **Expected retention:** Keep two tests when one owns no-flicker behavior and the other owns suppression of the native side effect. Do not merge them merely because they execute the same branch.
- **Failure caught:** Blind test minimization that loses an independent failure reason.

### F3 — Source-string architecture assertion

- **Setup:** A test reads implementation source and asserts that a forbidden import string is absent. The project can express the boundary through lint/module rules, type ownership, or an observable integration behavior.
- **Expected restraint:** Move the constraint to the actual lint/type/behavior owner and delete the source-string test unless source text is itself the product contract.
- **Failure caught:** Brittle architecture tests that mirror syntax instead of enforcing the owned boundary.

Each fixture should run under supportive, neutral, and competing prompts. Evaluation records task correctness, unauthorized or unnecessary additions, retained independent tests, corrections, tool calls, elapsed time, and total tokens.

## Rejected Ideas

- A new universal "simplify everything" Skill or always-on anti-overengineering overlay.
- Universal TDD, mandatory RED for every edit, 80%/100% coverage quotas, or a unit/integration/E2E matrix per change.
- "Cover all edge cases" without a reachable producer, transition, consumer, and material consequence.
- One test per changed file, abstraction, wrapper, event hop, or code branch.
- Deleting tests solely to reduce count when they protect independent external consequences.
- Source-string assertions when lint, type, build, or behavior owners can express the invariant.
- Importing DeepSeek, ECC, Google, Microsoft, Android, Superpowers, Matt, Addy, Ponytail, or Compound as a complete workflow overlay.
- Promoting this research directly into rules or published Skills without a normal selected RSP Change and candidate-versus-current evidence.

## Candidate Recommendation

### C1 — Add implementation boundary and test-ownership admission to `rsp-implement` (`independent-reimplementation`)

- **Observed failure:** real project changes accumulate speculative defensive boundaries and low-value tests whose only owners are touched files, wrappers, shared constants, or imagined edge states.
- **Primary owner:** `skills/rsp-implement/`; evaluate through the existing maintainer Skill candidate infrastructure. `rsp-tdd` and `rsp-review` remain unchanged unless the candidate evidence later shows a separate owner gap.
- **Behaviors:** the four behaviors in the Decision section, with F1-F3 as the initial contrastive set.
- **Adoption evidence:** DeepSeek R1-R4; ECC R1-R4; Ponytail R1-R3; Karpathy R1; Addy R2; Superpowers R1/R3; Matt R1 only for fixed authority and restraint; Compound R1/R2 for promotion and composition boundaries.
- **Hard boundaries:** no coverage quota, no automatic test deletion, no mandatory TDD, no repository-wide consumer audit, no new durable artifact, no product mutation outside the selected Change, and no Git/lifecycle/publication authority.
- **Promotion gate:** current-versus-candidate runs in isolated workspaces must preserve correctness and safety, reject F1/F3 overreach, retain both F2 tests, reduce unnecessary code/tests without increasing corrections, and expose any omitted verification.

No second candidate is justified now. If C1 fails because post-implementation review still misses speculative seams, a later independent Change may evaluate a small `rsp-review` consumer-classification check using DeepSeek R3; that is a resume condition, not current scope.
