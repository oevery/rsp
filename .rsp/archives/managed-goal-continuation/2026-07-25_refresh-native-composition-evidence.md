---
kind: "research"
---

# Change: managed-goal-continuation/refresh-native-composition-evidence

## Proposal
- Outcome: Refresh final exact-package native composition evidence
- Why:
  - The retained native-design composition run is immutable and correctly fails closed after executed Skills and `rules/rsp-rules.md` change, even when focused behavior remains valid.
- Scope:
  - Build one final exact package after all managed-goal product changes settle, run the existing native-design composition host qualification, and retain a new immutable evidence set.
  - Reconcile evaluator references and deterministic gates to the new run without rewriting prior retained evidence.
- Non-goals:
  - Do not change native-design product behavior merely to satisfy an oracle, overwrite old evidence, publish the package, or replace the new managed-goal behavior evaluation.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: independent native composition evidence matches the final product package
  - The final executed Skill tree and package behavior hashes are qualified by a fresh real-host run using the existing frozen scenario and semantic gates.
  - Previous runs remain immutable; failed or stale evidence is superseded only by a new run identity and explicit deterministic reference update.

### Acceptance
#### Scenario: final Skill changes invalidate retained evidence
- GIVEN focused managed-goal contracts pass but the native-design exact-package gate reports hash drift
- WHEN all product Skill and fallback-rule mutations are complete
- THEN a fresh exact-package native composition run passes its unchanged semantic gates and the repository-wide tests reference that new immutable evidence

## Design
- Approach:
  - Reuse the existing native-design composition runner and frozen fixture against one final local tarball, then retain sanitized metadata, outputs, hashes, and report under a new run identity.
- Boundaries:
  - This Change owns evidence refresh only; product behavior remains owned by the preceding Changes.
- Affected areas:
  - `research/evaluations/rsp-native-design-composition/`
  - deterministic native-design evaluator references and tests
- Constraints:
  - Use the final exact package, preserve failed-attempt provenance, retain no sensitive raw events or disposable workspace paths, and do not weaken semantic assertions to exact wording.

## Tasks
- [x] Run the frozen native-design composition scenario against the final exact package.
- [x] Retain the new immutable evidence and update only the deterministic current-run reference.
- [x] Prove the native composition and full repository gates pass without product-source mutation.

## Verify
- Automated:
  - [x] `node scripts/native-design-composition-eval.mjs` and `mise exec -- pnpm exec vitest run test/native-design-composition.test.ts` — default evaluator passed every retained-evidence gate with exact package SHA-256 `e01fdded8d075cf7fc5a979dba040fe057497e892548dd2ac123ed1f0cea17fa`; 15/15 focused tests passed.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed with 505/505 tests; proves: the new deterministic reference and immutable evidence preserve the full authored-package gate without product-source mutation from this Change.
- Manual or environment:
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — four ordered phases passed unchanged semantic gates against the exact local tarball in `device-discovery-boundary-managed-goal-continuation-sanitized-v2-final`; retained normalized events, sanitized phase finals, metadata, hashes, score, and durable artifact under a third immutable run identity while preserving both predecessors.
  - [x] Phase-final sanitization audit — no `/Users`, tmp/cache disposable path, or randomized `device-discovery-boundary-<suffix>` remains; absolute workspace and relative workspace basename forms normalize to `<workspace>`.
- Coverage:
  - Cross-provider repetition remains out of scope; this refresh preserves the existing provider/model qualification boundary.

## Blockers
- none

## Review Resolution
- F1 (`P2`, retained phase finals exposed a randomized disposable workspace path): `accepted` — sanitizer now replaces both the exact absolute workspace and `basename(workspace)` before generic home/tmp redaction; direct regression coverage exercises both host-output forms. Two earlier runs remain immutable, while `device-discovery-boundary-managed-goal-continuation-sanitized-v2-final` is the new current reference and passes semantic, integrity, exact-package, and path-sanitization gates.
- F2 (`P3`, Change reported an incorrect hard-coded retained gate count): `accepted` — verification now states that every retained-evidence gate passed without duplicating a drift-prone count.
- Fixed-scope re-review: clean; both accepted findings are resolved, all retained semantic and integrity gates remain unchanged, and no blocker remains.
