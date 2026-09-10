# Fixed review 2

## Finding
- F2 P1 accepted scope: `normalizeLabel` preserves uppercase characters.
- Required correction: normalize case only while preserving the accepted trim behavior.
- Fresh verification: `node --test test/lowercase.test.mjs test/trim.test.mjs`.

## Re-review
- This is a new in-scope Finding under the original Change authority. After correction, use `reviews/review-3.md`.
