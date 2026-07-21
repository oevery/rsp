# Deep clarification

Read this reference only when the user explicitly asks for rigorous challenge, or normal shaping leaves a high-risk decision whose dependent choices remain unresolved.

## Establish the fact boundary

Inspect the available code, tests, project instructions, Specs, and Decision Records before questioning the owner. Name the unresolved decision and the implementation consequence that makes it material.

## Project design return

When the repository selects a domain or module design capability needed to resolve that decision, return one bounded design task containing:

- the unresolved design question;
- authoritative project inputs by path;
- the expected existing artifact or decision output;
- its permitted mutation boundary;
- the same returning WorkRef.

The selected capability owns the design analysis, while existing project documents retain domain and architecture authority. Consume its settled result and evidence on return, then resume Shape against the same Change.

## Traverse one decision at a time

Ask exactly one owner decision per turn. Include a recommended answer grounded in inspected facts and the material tradeoff it resolves. After each answer, continue only along that decision's dependencies and derive available facts from the repository.

When no material dependent decision remains, summarize the resulting behavior, boundaries, and acceptance contract, then ask the owner to confirm shared understanding. Keep all artifacts unchanged until that confirmation. After confirmation, write only authorized decisions into their existing RSP owners and reapply the Shape Ready gate.

## Completion criterion

Finish the deep branch when every material dependent decision is either owner-confirmed or recorded as one explicit blocker, the project design task has returned to the same WorkRef when used, and no artifact changed before shared understanding was confirmed.
