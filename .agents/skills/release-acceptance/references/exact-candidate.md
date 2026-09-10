# Exact candidate

Load this reference only after version identity and release surfaces are final and the intended release commit has a clean worktree.

Run `mise exec -- pnpm run release:candidate-check` for exact identity and deterministic acceptance. Run `mise exec -- pnpm run release:candidate-provider-check` separately when the candidate Skill composition requires retained provider evidence. The combined `prepublishOnly` lifecycle runs both gates; ordinary candidate checking never invokes a provider. Missing or stale behavior evidence stops with an explicit single-case `release:provider-behavior` handoff.

Re-run deterministic acceptance after any source, package inventory, generated output, release metadata, or required-scenario change. Run required PTY, Windows, or provider evidence serially and record unavailable environments as incomplete, never passed.
