---
kind: "fix"
---

# Change: evaluation-contract-repair

## Proposal
- Outcome: Make local evaluation acceptance discriminate observed behavior without command-text verdicts, answer leakage or invalid Skill packages.
- Scope: The five findings in the conversation review of e8ca3d8..88a2221; evals, tests, release validation and maintainer-only evaluation instructions.
- Non-goals: Published Skill behavior changes, historical-suite restoration, live provider/holdout execution or publication.

## Spec
### MODIFIED
- Requirement: A complete ordinary business-file read does not make negative observed-guidance exposure inconclusive. Missing, unfinished, truncated and unsupported tool evidence stays unknown. Exposure is not proof of filesystem reads or full Skill compliance.
- Requirement: Forbidden external actions require independent semantic review of retained evidence, never a shell-string regex verdict. Observable local file, index and commit boundaries remain deterministic.
- Requirement: Recovery prompts request a decision without supplying the expected state or next action; host facts independently reject a wrong decision.
- Requirement: Local package acceptance validates parsed Skill metadata and contained existing local resources, not prose phrases.
- Requirement: Maintainer evaluation and acceptance instructions use the current entrypoints and evidence boundaries.

### Acceptance
#### Scenario: Honest evaluation evidence
- GIVEN normal review reads, forbidden guidance exposure, incomplete traces, quoted action mentions and opaque action commands
- WHEN execution and retained evidence are graded
- THEN local facts and observed exposure are classified independently, while external-action acceptance cannot pass without its semantic decision.
#### Scenario: Discriminating fixtures and usable packages
- GIVEN the same recovery request against unfinished verification or an owner blocker, and valid or malformed Skill packages
- WHEN focused local validation runs
- THEN swapped recovery decisions and malformed packages are rejected without asserting replaceable prose.

## Design
- One correction boundary: the rebuilt evaluation acceptance contract, its regression evidence and owning maintainer instructions.
- Keep existing adapters, run/replay ownership and blind review; change execution identity when observations or packet projection change so old reports cannot silently satisfy the new contract.
- Bound command-output exposure explicitly. Preserve unknown evidence rather than claiming host read confinement. Move external-action policy to a mandatory host-added review dimension.
- Reuse YAML and Markdown parsers already in the repository for package metadata/resource validation. No new dependency or publication surface.
- Maintainer-only Skills under .agents/skills are authored there; do not edit projections of published skills under skills/.
- Current facts belong in evals/release documentation. No lasting architectural decision or published Skill contract change is needed.

## Tasks
- [x] R1 accepted (P1, events.mjs): Plain/rg/nl output is normalized. Frozen task, Git and guidance output fingerprints support absence; unknown wrappers and single distinctive matches remain unknown in execution and replay.
- [x] R2 accepted (P1, hard-boundary.mjs/CLI): Run, compare and campaign share acceptance computed from independent decisions; deterministic scores remain under summary.execution and pending review returns a nonzero public CLI exit.
- [x] R3 accepted (P2, packet.mjs): Potentially lossy private-path and provider command redaction invalidates trace completeness, including substitutions inside private paths; an all-pass decision cannot waive missing evidence.
- [x] F3 accepted: Both recovery scenarios share an answer-free request; swapped decisions and inconsistent host state fail.
- [x] F4 accepted: Parsed metadata and contained Markdown resources are checked by the local/release package gate, with malformed-package CLI refusal coverage.
- [x] F5 accepted: Maintainer instructions use current campaign, review, revalidation and release entrypoints; no published Skill behavior changed.
- [x] Local fixed-scope re-review of the three findings over the uncommitted delta from 88a2221 found their named failures resolved, with no remaining actionable Code or Document finding in that boundary. No independent model-behavior review was performed.

## Verify
### Required
- [x] Focused regressions cover cat/rg/nl, unsupported and partial guidance, known business/other-Skill reads, live/replay agreement, public run/compare pending review and lossy command redaction. CLI tests use a local executable fixture and synthetic external-action events only.
- [x] Fresh final build, lint, typecheck and deterministic suite passed on 2026-09-27: 14 files, 65 tests.
- [x] Local release validation passed all 10 steps, including Skill package/security, docs check/build, all 22 public case schemas/oracles and offline-cache tarball installation. No provider execution or network installation.
- [x] Fixed-scope re-review, RSP check and git diff --check passed.
### Optional
- [ ] Real provider, independent holdout and full release-candidate acceptance; not authorized in this correction.
- Coverage: Local fixtures validate the harness, not model quality or provider-specific tool-output completeness.
- Release boundary: local-validation passed with offline-cache installation; releaseReady remains false because no reviewed current provider campaign was supplied. Execution/packet changes invalidate prior campaign reuse.
- Durable decision: Current facts were updated in evals/release documentation and maintainer instructions. No new Spec or Decision Record is needed; evaluation internals remain outside the published Skill contract. Local lifecycle and Git closeout do not establish release readiness.

## Blockers
- none
