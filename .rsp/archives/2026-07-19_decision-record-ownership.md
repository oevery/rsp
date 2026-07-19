---
kind: feature
---

# Change: decision-record-ownership

## Proposal
- Summary: Add one authoritative Decision Record path and separate lasting rationale from durable current facts
- Source: `research/models/rsp-engineering-domain-model.md` recommendation C2 (`independent-reimplementation`)
- Why:
  - Specs currently own durable facts, but RSP has no explicit owner for hard-to-reverse rationale, alternatives, tradeoffs, and consequences
  - Durable review currently presents one fact-oriented decision axis and cannot state independently whether a Decision Record is needed
- Scope:
  - Add `.rsp/specs/decisions` as the default authoritative Decision Record directory
  - Allow one project-relative external authoritative path through `decisions.path` in `.rsp/config.yaml`
  - Expose current-fact and rationale decisions independently through `rsp show` and `rsp ready`
  - Validate the configured path with `rsp doctor` and deterministically create the authoritative directory with `rsp init` or `rsp update`
  - Exclude the authoritative Decision Record subtree from the generated Specs index
  - Update the RSP skill, fallback protocol, documentation, and durable project design
- Non-goals:
  - Do not add a second Decision Record path, automatic ADR discovery, backlinks, numbering policy, or a Decision Record lifecycle
  - Do not add `rsp add decision`, auto-create Decision Record files, or promote Change content during archive
  - Do not implement WorkRef, Change Groups, review capabilities, or managed delivery

## Spec
### ADDED
- Requirement: authoritative Decision Record path
  - Each RSP Workspace has exactly one authoritative Decision Record directory
  - The default is `.rsp/specs/decisions`; `decisions.path` may select one project-relative external directory such as `docs/adr`
  - Configured paths must not be absolute, escape the Host Project, or target another `.rsp/` core location
- Requirement: separate rationale ownership
  - Specs own durable current facts
  - Decision Records own lasting rationale, alternatives, tradeoffs, and consequences for hard-to-reverse decisions
  - Durable review exposes current-fact and rationale choices independently

### MODIFIED
- Requirement: deterministic setup and repair
  - `rsp init` and `rsp update` ensure the one authoritative Decision Record directory exists without creating a Decision Record
  - `rsp doctor` reports invalid configuration or a missing authoritative directory
- Requirement: generated Specs index
  - Decision Records under the configured authoritative directory are not listed as ordinary Specs
- Requirement: archive boundary
  - Archive never creates or updates Specs or Decision Records automatically

### Acceptance
#### Scenario: initialize default decision ownership
- GIVEN a Host Project without RSP
- WHEN `rsp init` succeeds
- THEN `.rsp/specs/decisions` exists as the only authoritative Decision Record directory
- AND no Decision Record file is fabricated

#### Scenario: use an external authoritative path
- GIVEN `.rsp/config.yaml` sets `decisions.path` to `docs/adr`
- WHEN `rsp update` and `rsp show <change> --json` run
- THEN `docs/adr` exists
- AND durable review reports `docs/adr` as the authoritative Decision Record path
- AND `.rsp/specs/decisions` is not treated as a second authority

#### Scenario: reject an unsafe path
- GIVEN `decisions.path` is absolute, traverses above the project, or targets another `.rsp/` core location
- WHEN `rsp doctor` runs
- THEN it reports a semantic configuration issue
- AND no out-of-scope directory is created

#### Scenario: reject filesystem escape
- GIVEN a project-relative `decisions.path` traverses a symlink whose resolved ancestor is outside the Host Project
- WHEN `rsp update` runs
- THEN it fails before creating the Decision Record directory
- AND no out-of-project filesystem entry is created

#### Scenario: review facts and rationale independently
- GIVEN a Change is ready for semantic review
- WHEN `rsp ready <change> --json` runs
- THEN durable review exposes current-fact decisions independently from Decision Record decisions
- AND it reports the one authoritative Decision Record directory

#### Scenario: keep Decision Records out of the Specs index
- GIVEN the default Decision Record directory contains a Markdown Decision Record
- WHEN `rsp update` rebuilds the Specs index
- THEN the Decision Record is absent from `.rsp/specs/INDEX.md`

#### Scenario: switch authority without losing old rationale
- GIVEN an external Decision Record path is configured while Markdown records remain under `.rsp/specs/decisions`
- WHEN `rsp doctor` runs
- THEN it reports the inactive records as a manual migration issue
- AND it does not move, delete, or reclassify them as Specs

## Design
- Approach:
  - Add a typed `decisions.path` config value plus one resolver that returns a normalized safe project-relative directory
  - Keep raw semantic validation in `rsp doctor`; runtime consumers fall back safely when invalid configuration is present
  - Make init/update directory creation a deterministic structural operation and keep semantic document creation under skill or human judgment
  - Evolve `durableReview` into two explicit decision lists while preserving candidate current-fact files separately from the Decision Record root
  - Reimplement recommendation C2 against RSP's existing CLI seams without copying upstream artifact layouts
- Affected areas:
  - `src/types.ts`, `src/core/config.ts`, `src/commands/init.ts`, `src/commands/update.ts`, `src/commands/doctor.ts`
  - `src/commands/show.ts`, `src/commands/ready.ts`, `src/commands/specs-index.ts`, `src/core/helpers.ts`
  - `rules/rsp-rules.md`, `skills/rsp/SKILL.md`, README files, `.rsp/specs/design.md`, tests
- Constraints:
  - Core `.rsp/` locations remain fixed; only the one Decision Record integration path is configurable
  - Directory existence is deterministic, but whether to write a Decision Record and its exact filename remain semantic decisions
  - Existing 3.0 version draft files remain outside this change until release preparation

## Tasks
- [x] Define the Decision Record ownership, path safety, and public CLI seams
- [x] Add red tests for default setup, external configuration, unsafe paths, two-axis review, and Specs-index exclusion
- [x] Implement typed path resolution and deterministic directory setup
- [x] Integrate path diagnostics, Specs-index exclusion, and structured durable-review output
- [x] Update skill, fallback protocol, README, design philosophy, and durable design
- [x] Run focused and full validation and review the complete diff
- [x] Fix review findings for invalid routing, repair preflight, inactive records, reserved paths, and project-scoped config caching

## Verify
- Automated:
  - [x] Run focused Vitest cases for config, init/update/doctor, show/ready, and Specs index
  - [x] Run `mise exec -- pnpm build`
  - [x] Run `mise exec -- pnpm lint`
  - [x] Run `mise exec -- pnpm test`
  - [x] Run `npm pack --dry-run --ignore-scripts`
  - [x] Run `node dist/cli.mjs check --focused` and `git diff --check`
- Manual:
  - [x] Initialize a temporary project and confirm the default directory exists without a fabricated Decision Record
  - [x] Configure `docs/adr`, update, and confirm only that path is reported as authoritative
- Durable updates:
  - [x] Decide whether stable Decision Record ownership and configuration facts belong in `.rsp/specs/design.md`
  - [x] Write only verified stable facts before archive
  - [x] Record the lasting ownership and single-path rationale in `.rsp/specs/decisions/decision-record-ownership.md`

## Blockers
- none
