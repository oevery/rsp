# Exact candidate

Load after version identity and release surfaces are final and the intended release commit has a clean worktree.

Run `RSP_CAMPAIGN_REPORT=<reviewed-campaign-report> mise exec -- pnpm run release:candidate-check`. It runs local validation and consumes the retained independently reviewed provider campaign; it never starts a provider. `prepublishOnly` invokes this same gate. Missing, stale, incomplete or mismatched evidence exits nonzero; stop and return the specific missing evidence, not a release approval.

The current gate binds source and built artifacts, Skill compositions, execution/case/suite identities, paired repetitions, mandatory public scenarios, private holdout coverage/provenance and semantic decisions. Consult `release/README.md` and `release/suites/required-cases.json`; do not substitute a historical smoke count or edit report summaries.

Re-run local validation after changed release surfaces. Source/build, package manifest, lockfile, composition, input or execution changes require fresh authorized provider execution. Compatible deterministic-grader-only changes may be revalidated offline as documented in `evals/README.md`. Keep the reviewed report alongside its original run directories. Unavailable external evidence remains incomplete. A passed candidate gate grants no Git, publication, approval or human-acceptance authority.
