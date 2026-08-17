# Semantic concision

Reduce context only after naming the behavior that must remain equivalent. Compare the complete package, not `SKILL.md` in isolation.

## Safe transforms

- **Numbering:** encode strict order once instead of repeating sequence words.
- **Lists:** remove repeated subjects and prefixes while preserving parallel meaning.
- **Tables:** express fixed mappings such as mode → input → owner → output.
- **Closed flows:** use `A → B → C` only when each symbol is defined and the transition has one meaning.
- **Canonical terms:** reference an existing enum, type, template, or owner instead of paraphrasing it repeatedly.
- **Progressive disclosure:** move uncommon branches to a plainly named, directly linked reference.
- **Co-location:** place constraints beside the governed action and delete distant restatements.
- **Leading words:** start bullets with the decision or action so scanning is sufficient.
- **No-op pruning:** remove prose that changes no decision, action, boundary, or evidence.
- **Short examples:** replace long abstract explanation when one bounded example carries the same rule.

## Unsafe transforms

Do not introduce a private DSL, unexplained symbols, shortened public fields, or compressed prose that merges different producers, owners, lifecycles, or failure states. Do not hide permissions, stops, exceptions, verification, or return behavior behind implication. Do not optimize only the two largest files when the user selected a suite-wide audit.

## Equivalence check

Compare current and candidate for trigger, inputs, authority, action order, outputs, stops, verification, conditional loading, and failure/acceptance boundaries. Treat word, line, byte, token, and repetition deltas as diagnostics. A smaller candidate with weaker compliance or boundary behavior is a regression.
