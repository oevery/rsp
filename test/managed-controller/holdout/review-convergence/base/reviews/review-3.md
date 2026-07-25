# Fixed review 3

## Finding
- F3 P1 accepted scope: `normalizeLabel` preserves repeated internal whitespace.
- Required correction: collapse internal whitespace only while preserving accepted trim and case behavior.
- Fresh verification: `node --test test/collapse.test.mjs test/lowercase.test.mjs test/trim.test.mjs`.

## Re-review
- This is a new in-scope Finding under the original Change authority. After correction, use `reviews/review-4.md`.
