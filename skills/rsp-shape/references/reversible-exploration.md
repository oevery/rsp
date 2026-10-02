# Reversible exploration (Shape design method)

Use this procedure only when a material design conclusion depends on behavior that available code, tests, documentation, or runtime evidence does not establish.

## Define the probe

- State one question, falsifiable hypothesis, observation, and stop condition.
- Prefer inspection or an existing focused command. Create code only when that cheaper evidence cannot answer the question.
- Require explicit authority for disposable mutations and any runtime or external side effect. Otherwise describe the probe and return the authority blocker.

## Isolate and clean up

- Keep disposable code outside production owners and name it clearly as temporary. Do not change public interfaces, migrations, persistent data, credentials, or delivery state.
- Record the pre-probe file state and exact cleanup target. Avoid the probe when unrelated work makes safe cleanup uncertain.
- Run only the minimum observation and capture the evidence. If the probe fails, inspect actual effects before a repeat or cleanup; never replay a one-shot action or guess at an unknown mutation. Remove every disposable artifact within the exact authorized cleanup boundary before returning, and verify cleanup without discarding unrelated work. Report any cleanup that cannot safely be completed.

## Return evidence, not architecture

Report the hypothesis, method, observation, confidence and limitations, cleanup evidence, design implication, and remaining owner decision. A probe can support a recommendation; it is never durable architecture or permission to implement production behavior.
