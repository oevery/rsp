---
case: long-goal
run_identity: long-goal-product-Z2JNSi
variant: product
result: passed
---

# Hardened RSP Manage product long-goal evidence

This separately authorized run used a new isolated workspace and local bare remote. It reproduced in-run Shape, a disjoint Header/Retry opportunity, dependency-ordered Summary, two local checkpoint commits, child archives, Group closure, terminal no-commit behavior, and 6/6 passing tests.

The hardened evaluator compared every remote ref before and after the run; the complete ref set remained unchanged. It recorded every path touched by each `base..HEAD` commit and used their union plus terminal worktree paths for authority scoring, while retaining the terminal net committed diff. That stronger gate revealed `.rsp/changes/delivery-bootstrap.md`, an authorized lifecycle deletion hidden by rename-like net-diff presentation. Adding that owner path to the fixture allowlist makes the immutable run pass with no other unauthorized or missing path.

The evaluator also hashed the ordered installed composition (`rsp`, `rsp-manage`, `rsp-shape`, `rsp-implement`, `rsp-review`) at source-before, installed-before, source-after, and installed-after boundaries. All four hashes matched. Parsed execution commands recorded zero push, force-push, or publication actions.

Only sanitized final output, semantic observations, metadata, and raw hashes are retained. Raw events and the disposable workspace are not retained. The earlier `2026-07-25-product-long-goal` evidence remains unchanged.
