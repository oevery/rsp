# Local checks

Run `mise exec -- pnpm run release:check` serially. This thin package script builds, typechecks, lints, runs `test:code`, checks full Skill project readiness, security and docs. Consult `tests/README.md` for scope.

Package installation uses a temporary consumer and offline cache. Missing cache is unavailable verification; only explicit authorization permits `RSP_INSTALL_ALLOW_NETWORK=1`. No real consumer checkout is modified.

A local pass is local evidence, never a model-quality result or release approval. Select provider validation separately when the release decision needs behavioral evidence. No baseline or holdout is mandatory for ordinary validation.
