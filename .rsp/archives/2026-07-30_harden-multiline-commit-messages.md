---
kind: "fix"
---

# Change: harden-multiline-commit-messages

## Proposal
- Outcome: Reject escaped newline sequences in structured commit messages
- Why:
  - A release commit body passed `\\n` through an ordinary quoted shell argument, and Git persisted the two literal characters instead of multiline prose.
  - The current commit capability requires post-commit observation but does not define a safe multiline transport or classify escaped newline sequences as a post-commit mismatch.
- Scope:
  - Require structured multiline commit messages to use actual line breaks or a safely prepared message file instead of relying on shell interpretation of `\\n`.
  - Require raw post-commit message inspection to reject unintended literal `\\n` sequences and stop for explicit repair authority.
  - Retain a Skill contract test for both requirements.
- Non-goals:
  - Do not add a new CLI commit command, shell-specific helper, automatic amend, or history rewrite behavior.
  - Do not change commit subject/body semantics, trailers, staging ownership, or publication authority.

## Spec
### ADDED
- Requirement: Structured commit message transport must preserve intended line boundaries across tool, shell, and Git layers.
  - Multiline bodies use actual line breaks or a safely prepared message file; ordinary quoted `\\n` escape sequences are not treated as portable newlines.
  - Post-commit observation inspects the raw complete message and treats unintended literal `\\n` sequences as a mismatch rather than silently repairing history.

### Acceptance
#### Scenario: A structured commit body contains multiple bullets
- GIVEN `rsp-commit` has derived a subject and multiple body lines
- WHEN the commit command transports the message through a host shell
- THEN the instructions require actual line breaks or a safely prepared message file
- AND the post-commit check rejects unintended literal `\\n` sequences and reports the mismatch without inferring amend authority

## Design
- Approach:
  - Add a focused contract assertion for safe multiline transport and raw literal-sequence rejection, observe RED, then add the minimum normative instructions to `rsp-commit`.
- Boundaries:
  - `skills/rsp-commit/SKILL.md` owns portable commit execution and post-commit observation guidance.
  - `test/rsp-commit-skill-contract.test.ts` owns the published Skill contract regression.
- Affected areas:
  - `skills/rsp-commit/SKILL.md`
  - `test/rsp-commit-skill-contract.test.ts`
- Constraints:
  - Keep the guidance host-neutral and avoid prescribing a shell-specific escape syntax.
  - Detection must not authorize amend, a second commit, or any other history repair.

## Tasks
- [x] Add and observe a focused failing contract test for safe multiline transport and literal escaped-newline rejection.
- [x] Add the minimum portable `rsp-commit` instructions and make the focused test pass.
- [x] Run the focused RSP check and leave the Change open, unarchived, and uncommitted for owner review.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-commit-skill-contract.test.ts` — passed, 1 file / 6 tests; proves: the published commit capability retains safe multiline transport and post-commit mismatch requirements
  - [x] `node dist/cli.mjs check --focused` — passed with 0 errors / 0 warnings; proves: the open Change remains structurally valid for review
- Manual or environment:
  - [x] `git diff --check` and focused diff inspection passed; guidance is host-neutral and explicitly stops without inferring amend or second-commit authority.
- Coverage:
  - Contract coverage governs agent instructions; it does not make arbitrary host shells reinterpret escape sequences or add a CLI commit implementation.

## Blockers
- none
