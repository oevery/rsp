# Verification Architecture

verification/ is the canonical control plane for repository verification. It keeps three semantic layers distinct while sharing configuration, contracts, fixtures, harnesses, metrics, evidence, and reports:

- tests/ — fast deterministic unit, contract, integration, and architecture checks.
- evaluations/ — task-shaped Skill, Core, worker, and model-judged behavior campaigns.
- acceptance/ — disposable project, package, worktree, install, and release-facing scenarios.

Synthetic traces are not execution evidence. Scenario builders declare inputs only; host receipts come from a real local process. A package or fixture inspection is local evidence, but cannot satisfy Skill semantic or worker lifecycle coverage when the corresponding runtime adapter is unavailable.

Use the explicit package commands:

- pnpm run verify:test
- pnpm run verify:evaluate
- pnpm run verify:accept
- pnpm run verify:provider:fake
- pnpm run verify:local
- pnpm run verify:provider:real (disabled; separate authorization required)

verify:local runs the deterministic test layer, local evaluation commands, fake-provider gate, and disposable acceptance. Its aggregate verdict is incomplete whenever required Skill semantic, worker lifecycle, or real-provider coverage is unavailable; the report preserves those omissions instead of promoting them to pass.

Generated reports belong under verification/artifacts/ and are ignored. Raw private traces, credentials, provider sessions, and user Memory are never inputs to tracked verification artifacts.
