---
kind: "research"
---

# Change: skill-capability-research/accept-research-baselines

## Proposal
- Summary: Close the reviewed upstream baseline used by the Skill System research.
- Why:
  - Three completed reports still point at unaccepted candidate revisions, so the synthesized baseline is not fully reproducible from accepted source identity.
  - `superpowers` was accepted earlier and must remain matched rather than being accepted again.
- Scope:
  - Re-verify the completed report identities for `antfu-skills`, `gsd-core`, `superpowers`, and `andrej-karpathy-skills`.
  - Accept the remaining pending revisions for `antfu-skills`, `gsd-core`, and `andrej-karpathy-skills`.
- Non-goals:
  - Fetching newer revisions, changing report conclusions, or adopting product behavior.

## Spec
### MODIFIED
- Requirement: Every source revision used as an active minimum-suite research input is both completely distilled and explicitly accepted.
  - Acceptance occurs only when the report revision equals the prepared candidate revision and required path coverage is complete.

### Acceptance
#### Scenario: maintainer closes the pending research baseline
- GIVEN all four named sources have complete reports matching their candidate revisions
- AND `superpowers` is already accepted at its matching candidate revision
- WHEN the maintainer accepts the other three exact revisions
- THEN `status all --json` reports no pending baseline action for any declared source
- AND `upstreams.lock` adds only the three previously unaccepted reviewed sources

## Design
- Approach:
  - Compare status, evidence identity, report frontmatter, required sections, and lock state before invoking `accept` once per pending source.
- Affected areas:
  - `upstreams.lock`
  - `research/upstreams/{antfu-skills,gsd-core,superpowers,andrej-karpathy-skills}/`
- Constraints:
  - Do not prepare or accept a different revision during this Change.

## Tasks
- [x] Verify all four candidate revisions, path coverage, completed reports, provenance, and current lock state.
- [x] Accept the three remaining exact reviewed revisions.
- [x] Confirm all source research states and next actions are closed.

## Verify
- Automated:
  - [x] `node scripts/upstreams.mjs status all --json`
  - [x] `mise exec -- pnpm run test`
- Manual:
  - [x] Inspect the `upstreams.lock` diff and confirm only the intended three flat hash entries changed.
- Durable updates:
  - [x] No product Spec or instruction update; the accepted lock is the reproducible research baseline.

## Blockers
- none
