# Interpret RSP as Reliable Software Practice

RSP uses **Reliable Software Practice** as its product expansion because the 3.0 product is a composable engineering workflow, not only the Rules, Specs, Plans file protocol. The name expresses the product promise while the category statement—repository-native engineering workflow for humans and AI agents—states where and for whom it operates. Rules, Specs, Plans remains the lightweight artifact foundation, preserving continuity for existing projects without presenting the repositioning as a breaking protocol rename.

## Considered Options

- Keep Rules, Specs, Plans as the product expansion: rejected because it describes storage artifacts but underrepresents shaping, design, implementation, diagnosis, TDD, review, release documentation, and durable review.
- Use Reliable Software Process: rejected because `Process` implies a fixed staged state machine, while RSP derives the next action from evidence and composes independent capabilities without hidden workflow state.
- Use Repository-native Software Practice: rejected as the expansion because repository-native is the product category and differentiator, while the expansion should state the broader product promise.

## Consequences

- Current product-facing identity surfaces use Reliable Software Practice and the repository-native engineering workflow category statement.
- Rules, Specs, Plans remains a named artifact foundation and existing `.rsp/` structures, commands, and project integrations remain valid.
- Historical release and Changelog wording remains historical evidence unless the corresponding release is still being prepared.
- Future product documentation should preserve the Practice → Workflow → Protocol layering and avoid implying automatic orchestration, delivery authority, or a general-purpose platform.
