# Exact candidate

Load this reference only after version identity and release surfaces are final and the intended release commit has a clean worktree.

Run `mise exec -- pnpm run release:candidate-check`. It checks exact candidate identity first, deterministically verifies that release behavior evidence is either unnecessary or covered by matching retained scenario reports, then runs deterministic acceptance. Candidate validation never invokes a provider; missing or stale behavior evidence stops with an explicit single-case `release:behavior-check` handoff. Run the optional full routing comparison separately when its deeper topology boundary applies.

Re-run deterministic acceptance after any source, package inventory, generated output, release metadata, or required-scenario change. Run required PTY, Windows, or provider evidence serially and record unavailable environments as incomplete, never passed.
