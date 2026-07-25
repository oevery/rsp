---
kind: "ops"
---

# Change: rsp-manage-beta/prepare-beta-package

## Proposal
- Outcome: Prepare a locally verified `@oevery/rsp@3.1.0-beta.0` artifact and complete net-release communication for separately authorized npm beta publication.
- Why:
  - boats-cloud cannot reproducibly dogfood the managed workflow through `npx` until an exact prerelease package contains the promoted Skill.
- Scope:
  - Set the prerelease identity, prepare truthful `v3.0.0..HEAD` changelog and beta release guidance, and validate the exact tarball, clean install, CLI, ten-Skill inventory, and local npm-exec surface without changing the registry.
- Non-goals:
  - npm publication, dist-tag mutation, Git tag, push, GitHub Release, `latest` promotion, boats-cloud initialization, or declaring beta behavior generally stable.

## Spec
<!-- Describe the reliable operational outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: an exact beta package is reproducible and opt-in
  - Package identity is `@oevery/rsp@3.1.0-beta.0`; clean installation exposes the CLI and ten published Skills including `rsp-manage`.
  - The packed tarball works through an isolated npm-exec/npx-compatible invocation; prerelease documentation gives the future exact registry command for post-publication dogfooding without claiming it passed before publication.
  - `npm publish --dry-run` and all local release gates pass, while actual publication and the `beta` and `latest` dist-tags remain unchanged without separate authority.
- Requirement: beta communication is net-release accurate
  - Changelog, English and Chinese product surfaces, stable Spec, design philosophy, and beta release notes cover all user-visible `v3.0.0..HEAD` changes, distinguish explicit managed orchestration from ordinary Core work, require Node 22+, link the 3.0 migration for registry users upgrading from 2.x, state known host/cost and real-project limitations, and avoid claiming registry or boats-cloud acceptance.

### Acceptance
#### Scenario: exact beta tarball is ready for dogfooding
- GIVEN `rsp-manage-beta/productize-controller` is complete and the repository is at version `3.1.0-beta.0`
- WHEN release gates pack and install the artifact into an isolated prefix and invoke its local tarball through npm exec
- THEN the installed CLI reports the prerelease version, exposes ten Skills including `rsp-manage`, passes initialization and help smoke tests, and contains no research or maintainer-only paths

#### Scenario: publication boundary remains explicit
- GIVEN the verified prerelease artifact
- WHEN preparation completes without publication authority
- THEN the npm registry and dist-tags are not mutated and the exact publish command remains a documented next action rather than an executed task

## Design
- Approach:
  - Update package identity and exact version assertions, project release truth, and product documentation from one net-release evidence set, then reuse `release:check` and clean-install tooling with exact prerelease assertions; do not churn the lockfile when its root importer has no package-version field.
- Boundaries:
  - package identity and npm artifact contents change locally; registry, Git remote, and boats-cloud remain external boundaries.
- Affected areas:
  - `package.json`, package/release contract tests
  - `CHANGELOG.md`, `docs/releases/3.1.0-beta.0.md`, `README.md`, `README.zh-CN.md`, `docs/design-philosophy.md`, `.rsp/specs/design.md`
- Constraints:
  - Use prerelease SemVer and a non-`latest` future `beta` tag; never infer external publication authority from green local gates.
  - Keep release prose concise and current-state oriented; no execution diary, repeated test transcript, or unverified boats-cloud outcome.

## Tasks
- [x] Set `3.1.0-beta.0` consistently in package metadata and exact package assertions.
- [x] Prepare concise `v3.0.0..HEAD` changelog, beta notes, product wording, migration guidance, and durable installed-capability facts.
- [x] Run complete local release, tarball, clean-install, local npm-exec, inventory, and dry-run publication checks without external mutation.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run release:check` passed build, typecheck, lint, 43 test files with 463 tests, and exact tarball/clean-install checks; `npm publish --dry-run --ignore-scripts --tag beta --access public` confirmed the 28-file public artifact without registry mutation.
- Manual or environment:
  - [x] The clean-install gate invoked the exact local tarball through npm exec in an isolated temporary project, ran installed CLI version/help/init smoke, and inspected the exact ten-Skill inventory including `rsp-manage`.
- Coverage:
  - npm authentication, registry publication, `beta` dist-tag installation, boats-cloud integration, and eventual `latest` promotion remain explicitly unavailable or out of scope.

## Blockers
- none
