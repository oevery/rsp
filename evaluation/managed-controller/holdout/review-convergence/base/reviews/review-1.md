# Fixed review 1

## Finding
- F1 P1 accepted scope: `normalizeLabel` preserves leading and trailing whitespace.
- Required correction: trim label boundaries only.
- Fresh verification: `node --test test/trim.test.mjs`.

## Re-review
- After correction, use `reviews/review-2.md` as the independent fixed-scope result.
