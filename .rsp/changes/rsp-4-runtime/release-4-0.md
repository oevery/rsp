---
kind: "feature"
---

# Change: rsp-4-runtime/release-4-0

## Proposal
- Outcome: Reconcile the accepted RSP 4.0 outcomes into one exact local release candidate
- Why:
  - Independently archived runtime, migration, query, and Web outcomes must converge on one package identity, compatibility ledger, shipped inventory, and public narrative before any external release operation.
  - Terminal release preparation must remain separate from feature implementation and from push, tag, hosted release, registry publication, or authentication authority.
- Scope:
  - Confirm the exact `4.0.0` comparison range and reconcile every accepted child into one net compatibility and migration ledger.
  - Finalize package metadata, changelog, release notes, migration guide, README, site, CLI and Skill documentation, protocol/schema support, and shipped assets.
  - Run exact-candidate release, clean-install, cross-version migration, Broker, runtime, Manage, Specs, Web, fallback, and immutable comparison gates.
- Non-goals:
  - Implement or repair feature behavior owned by another child Change.
  - Publish, tag, push, create a hosted release, mutate issues, perform registry authentication, or claim human acceptance without separate authority.
  - Promise remote hosting, multi-user collaboration, automatic memory promotion, provider integration, or unverified performance/productivity outcomes.
  - Rewrite historical 3.x release records or hide known compatibility, resource, security, or host limitations.

## Spec
### ADDED
- Requirement: The exact 4.0 local release candidate has one coherent, evidence-backed package and compatibility boundary.
  - Package version, protocol and schema support, Node range, built assets, Skills, docs, migration guidance, cache behavior, and public command output agree.
  - The net compatibility ledger distinguishes already-removed behavior, new 4.0 removals, optional runtime services, no-service fallback, and external operations not yet authorized.
  - Exact-package validation covers fresh initialization, supported migration, Broker reuse, worktree isolation, runtime concurrency/recovery, bounded context reuse and stale fallback, Manage observability, direct Specs queries, base Web, managed-run Web, and cache disposal.
  - Publication remains a separate authority stage after the local candidate is accepted.

### Acceptance
#### Scenario: exact local candidate
- GIVEN every prerequisite child is archived with fresh required verification
- WHEN candidate metadata, docs, build, tests, package, clean install, migration, runtime, and browser gates run on one commit
- THEN the exact package identity, shipped inventory, public claims, supported environments, and immutable comparison surfaces agree

#### Scenario: unsupported external action
- GIVEN a green local 4.0 candidate without push, tag, hosted-release, or registry authority
- WHEN terminal preparation completes
- THEN it returns an exact local release receipt and performs no external action

## Design
- Approach:
  - Build one net-release evidence ledger from accepted child outcomes and the exact candidate diff.
  - Project that ledger into package metadata, cumulative changelog, release notes, migration guidance, public docs, and release checks without duplicating child execution logs.
  - Reuse repository release tooling and extend package checks only for newly shipped runtime and Web assets and exact migration/runtime behavior.
- Boundaries:
  - This Change owns terminal versioning, package-facing truth, documentation reconciliation, and local candidate evidence only.
  - Feature and migration children retain their implementation, Specs, review, and archive evidence.
  - Push, tag, hosted release, npm publication, authentication, reconciliation, approval, and human acceptance remain separately authorized operations.
- Affected areas:
  - `package.json`, changelog, 4.0 release and migration documents, READMEs, public site, CLI/Skill references, package inventory, and release scripts.
  - Exact-package smoke tests, protocol/schema compatibility matrices, migration fixtures, Broker/runtime checks, and browser asset verification.
- Constraints:
  - Versioned prose is written only after the exact release identity and comparison range are confirmed.
  - No release surface claims unverified remote, multi-user, provider, performance, memory, or productivity behavior.
  - A green local candidate does not imply publication or external delivery.

## Tasks
- [ ] Confirm explicit owner authority for the exact release identity and comparison range, then construct the net compatibility, migration, omission, and risk ledger.
- [ ] Finalize package metadata, changelog, release notes, migration guide, README, site, CLI, Skill documentation, and shipped inventory in a dedicated release commit.
- [x] Extend candidate and clean-install checks for Broker, runtime, bounded context reuse, stale fallback, Manage observations, direct Specs queries, base Web, managed-run Web, migration, and fallback assets.
- [ ] Run the exact local candidate gates and record the local release receipt plus explicit external omissions.

## Verify
### Required
- Automated:
  - [ ] `mise exec -- pnpm run release:check` on the dedicated release commit — proves: metadata, docs, build, typecheck, lint, tests, and exact clean installation agree.
  - [ ] The same release gate covers the published 3.2.0 migration fixture, fresh initialization, Broker/worktree isolation, runtime concurrency/recovery, context hydration/full-reread equivalence, Manage observation, direct Specs query, base and managed Web, no-service fallback, and exact project-bound cache disposal.
  - [ ] `mise exec -- pnpm run release:candidate-check` on the exact release commit — proves: version, docs, package, build, typecheck, lint, tests, and clean installation agree.
  - [ ] `git diff --check`, `mise exec -- pnpm run release:metadata-check`, and fixed-scope release prose review — prove: confirmed version, release date, comparison range, Node.js support, breaking/migration guidance, README links, and publication-invariant wording agree.
- Exact shipped inventory is frozen: authored package files are explicitly declared, and every emitted `dist/` file must be reachable from the five stable distribution entries. A negative clean-install test rejects undeclared files even under an otherwise allowed package root.
- Fixed-scope release review remains pending until versioned surfaces are written in the dedicated release commit. The implementation-owned inventory-freeze correction is complete.
### Optional
- Manual or environment:
  - [ ] Install the exact packed candidate in temporary repositories, exercise two worktrees and a parallel managed run, and inspect base and managed Web views.
- Coverage:
  - Push, tag, hosted release, npm publication, registry reconciliation, and exact remote installation remain outside this local Change.

## Blockers
- explicit owner authority to begin release finalization, followed by a dedicated exact release commit and clean `release:candidate-check`
