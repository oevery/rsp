---
kind: "refactor"
---

# Change: fallback-protocol-path

## Proposal
- Summary: Introduce the target fallback protocol path and project-instruction ownership
- Why:
  - The current consumer layout makes `.rsp/rules/` look like the owner of project rules, while the accepted model assigns scoped project instructions to nearest `AGENTS.md`
  - The target `.rsp/rsp-rules.md` must be the only runtime fallback path after an explicit update migration
- Scope:
  - Make initialization and runtime commands use only `.rsp/rsp-rules.md`
  - Make `rsp update` migrate the old generated fallback path and remove that obsolete file
  - Remove the project-rules CLI and generated template surfaces now owned by nearest `AGENTS.md`
  - Shorten the bundled fallback protocol and update the managed AGENTS navigation/read order
  - Publish optional `commands/` prompt assets with the npm package
  - Update directly affected README, skill, command prompts, durable design, and behavior tests
- Non-goals:
  - Do not semantically rewrite arbitrary user-authored `.rsp/rules/` contents into `AGENTS.md`; report them for manual migration
  - Do not implement Decision Records, WorkRef, Change Groups, external context-map configuration, or managed delivery

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: canonical fallback protocol
  - New RSP projects store the bundled minimal fallback protocol at `.rsp/rsp-rules.md`
- Requirement: explicit path migration
  - A project with only the old generated fallback path must run `rsp update` before normal RSP commands operate

### MODIFIED
- Requirement: update migration
  - Updating an old project creates or refreshes `.rsp/rsp-rules.md`, removes the obsolete generated fallback, and removes `.rsp/rules/` only when empty
  - Update must not report successful migration when remaining `.rsp/rules/` cannot be inspected
  - Any residual file, hidden entry, symlink, or non-empty directory requires manual migration; a directory tree containing only empty directories may be removed safely
- Requirement: project instruction ownership
  - The managed AGENTS block routes scoped rules to nearest `AGENTS.md`, optional context to `CONTEXT-MAP.md`/`CONTEXT.md`, and RSP operation to the skill or fallback protocol
- Requirement: optional prompt distribution
  - The npm package includes `commands/` alongside the fallback source and skill

### Acceptance
#### Scenario: initialize a new project
- GIVEN a directory without `.rsp/`
- WHEN `rsp init` succeeds
- THEN `.rsp/rsp-rules.md` exists
- AND `.rsp/rules/` is not created by default

#### Scenario: reject an unmigrated project
- GIVEN `.rsp/rules/rsp-rules.md` and `.rsp/specs/design.md` exist without `.rsp/rsp-rules.md`
- WHEN an RSP command checks initialization
- THEN the command rejects the project and directs the user to `rsp update`

#### Scenario: update an old project
- GIVEN only the old generated fallback protocol path
- WHEN `rsp update` succeeds
- THEN `.rsp/rsp-rules.md` contains the current bundled fallback protocol
- AND the obsolete generated fallback file no longer exists

#### Scenario: migration inspection fails
- GIVEN `.rsp/rules/` exists but cannot be inspected
- WHEN `rsp update` or `rsp doctor` checks migration state
- THEN the command reports an incomplete migration
- AND the command exits unsuccessfully instead of reporting a healthy project

#### Scenario: navigate RSP work
- GIVEN RSP manages the root AGENTS block
- WHEN an agent reads it
- THEN nearest project instructions and module context precede focused RSP work
- AND the RSP skill is preferred with `.rsp/rsp-rules.md` as fallback

#### Scenario: package optional prompts
- GIVEN the npm package is prepared
- WHEN its file manifest is inspected
- THEN `commands/` prompt assets are included

## Design
- Approach:
  - Use one canonical runtime path and keep old-path knowledge only inside update and doctor migration handling
  - Keep `rules/rsp-rules.md` as the package-authored source while changing its consumer destination
  - Exercise migration only through public CLI and rendered managed-block seams
- Affected areas:
  - src/core/config.ts, src/core/helpers.ts, src/commands/init.ts, src/commands/update.ts, src/commands/doctor.ts
  - rules/rsp-rules.md, skills/rsp/SKILL.md, commands/, README.md, README.zh-CN.md, .rsp/specs/design.md
  - test/helpers.test.ts, test/integration.test.ts, test/commands.test.ts
- Constraints:
  - Migration deletes only the obsolete generated fallback; arbitrary rules require manual semantic migration
  - The fallback protocol stays compact and excludes project-specific rules and detailed operational procedure
  - Generated/index behavior and the existing open-to-archived lifecycle remain unchanged

## Tasks
- [x] Finalize the proposal, spec, design, public seams, and migration boundary
- [x] Update behavior tests for canonical-only runtime, explicit update migration, doctor diagnostics, and removed rules CLI
- [x] Remove compatibility runtime, project-rules generation, and fixed root AGENTS durable candidate
- [x] Implement update cleanup and unsupported custom-rules diagnostics
- [x] Update distributed guidance, content CalVer, and self-hosted RSP state
- [x] Run full validation and self-review the final migration behavior

## Verify
- Automated:
  - [x] Run focused red/green Vitest cases for init, update, doctor, guard, and managed AGENTS output
  - [x] Run `mise exec -- pnpm run build`
  - [x] Run `mise exec -- pnpm run lint`
  - [x] Run `mise exec -- pnpm run test`
  - [x] Run `npm pack --dry-run --ignore-scripts`
  - [x] Run `node dist/cli.mjs check --focused` and `git diff --check`
- Manual:
  - [x] Initialize a temporary project and confirm only the canonical fallback path is created
  - [x] Update an old project and confirm the generated legacy path is removed while arbitrary legacy rules are preserved and reported
- Durable updates:
  - [x] Decide whether this change produced durable knowledge for `.rsp/specs/` or stable instructions for the nearest project-owned `AGENTS.md`
  - [x] Update `.rsp/specs/design.md` and root `AGENTS.md` after implementation makes the canonical path and instruction ownership true

## Blockers
- none
