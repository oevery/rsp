---
kind: "research"
---

# Change: daily-workflow-depth/validate-daily-workflow-depth

## Proposal
- Summary: Validate five daily journeys and freeze the 3.0 boundary
- Why:
  - Candidate-local success does not establish an economical, coherent daily workflow or a truthful 3.0 product boundary.
- Scope:
  - Adversarially validate five sanitized daily journeys, integrate only demonstrated behavior, update shared product surfaces, and decide the final stable/optional/external capability boundary.
- Non-goals:
  - Rewriting qualified stable Skills, claiming universal host/provider performance, publishing 3.0, or adding unrelated Matt/Superpowers capabilities.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: daily workflow depth is qualified by journeys rather than Skill count
  - The gate covers ambiguous intent, domain vocabulary, module seams, ordinary correction, and long multi-session continuation with hard-boundary assertions.
  - It reports behavior success, corrections, elapsed time, tokens/tool calls when available, unauthorized actions, stale evidence, and unavailable real-world acceptance.
- Requirement: the 3.0 capability boundary is frozen truthfully
  - Only demonstrated behavior enters package discovery and shared docs/models/specs; optional and project-owned capabilities remain labeled as such.
  - The result states whether release preparation may resume and lists every unqualified boundary.

### Acceptance
#### Scenario: terminal composition gate freezes the release boundary
- GIVEN both candidate slices are archived with evidence
- WHEN the five journeys run against the exact candidate package surface
- THEN the report identifies each promoted, revised, rejected, optional, and external behavior with supporting evidence
- AND release preparation remains blocked unless the full gate and package verification pass

## Design
- Approach:
  - Review candidate oracles independently before integration, then extend deterministic composition coverage and run fresh available-host holdouts against an exact tarball when promotion is justified.
  - Update shared package/docs/model/spec surfaces only after the decision is evidenced.
- Affected areas:
  - terminal daily-workflow fixtures, harness, and evaluation report
  - promoted Skill/package/docs/model/spec surfaces and `release-3-0-0`
- Constraints:
  - Preserve failure attempts and avoid self-scoring prose-only oracles; assert observable files, commands, outputs, mutations, and stops.
  - Hardware, authenticated, deployment, and human acceptance remain explicit coverage gaps when unavailable.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Define five adversarial journey oracles and an isolated host-trace contract.
- [x] Independently review candidate fixtures against the frozen journey oracles; the first composite replay was excluded because it joined evidence from different scenarios.
- [x] Integrate only qualified candidate behavior and update deterministic composition/package coverage.
- [x] Run fresh terminal holdouts, report full cost and coverage, update durable product truth, and archive the Group.

## Verify
- Automated:
  - [x] Run focused daily-workflow composition tests and evaluation harness.
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `mise exec -- pnpm run release:check`
  - [x] `node dist/cli.mjs check --focused`
  - [x] `git diff --check`
- Manual:
  - [x] Inspect the five journey traces, exact package contents, language behavior, authority stops, and release recommendation.
- Durable updates:
  - [x] Update Skill System and Capability Model only with qualified stable facts; retain experiment detail in research.

## Blockers
- requires `daily-workflow-depth/deepen-rsp-shape`: needs qualified shaping-depth behavior and cost evidence
- requires `daily-workflow-depth/prototype-managed-controller`: needs an independently evaluated controller candidate and promotion recommendation
- none
