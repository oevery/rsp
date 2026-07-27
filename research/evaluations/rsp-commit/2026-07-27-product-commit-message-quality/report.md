# rsp-commit real holdout

- Result: `passed`.
- Run identity: `commit-message-quality-product-gpt-5-6-sol-high-2026-07-27T11-36-50Z`.
- Scenario: a Chinese implementation-and-commit request in an English Conventional Commit repository.
- Observed commit: one exact-scope local commit with an English Conventional subject, three outcome/boundary bullets, and `RSP-WorkRef: add-greeting-format`.
- Verification: `npm test` passed 2 tests; the evaluator observed the complete `%B` message, exact committed paths, a clean worktree, and unchanged remote refs.
- Omitted by authority: archive, push, tag, publication, amend, rebase, and force-push.
- Provenance: sanitized retained evidence from the passing product run; raw events and disposable workspace remain untracked under `.cache/rsp-commit-eval-v2/`.
