# Writer and reviewer agreement

These cases use the same factual export-tool corpus for Doc and Document Review. The fixtures intentionally differ in document quality: writing starts from weak prose; review includes a usable README, reversed domain definitions, and a fluent false retry promise. The exported source and project brief must remain identical between those two fixtures.

- `doc-write-grounded`: improve README, CONTEXT, and Spec without inventing behavior or changing implementation.
- `doc-review-grounded`: find consequential defects, leave the adequate README alone, and preserve all files.
- Its copyable README command receives bounded Code checks alongside Document review; the implementation remains evidence-only and no export execution is authorized. The existing `review-dirty-workflow` case covers API comments inside code, while `review-preserve-staged-work` and `release-review-grounded` retain pure-Code and pure-Document restraint.
- `doc-review-only`: a near-negative task that requests judgment, not authoring.

Use the shared `test:skills` runner and fresh independent semantic review. Readiness is not model acceptance: `test:skills -- check` checks schemas and project readiness only. The writing oracle checks artifact presence and permitted paths, deliberately not prose or keyword density. Five semantic dimensions match the author and reviewer methods.

Keep expected findings and rubric data outside fixture directories. Never install this case README or oracle in a model workspace. No live campaign result is asserted by adding these cases.
