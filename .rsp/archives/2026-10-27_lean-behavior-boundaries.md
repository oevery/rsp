---
kind: "refactor"
---

# Change: lean-behavior-boundaries

## Proposal
- Outcome: Reduce routine workflow cost without weakening public behavior, authority or recovery safety.
- Scope: Doc, Review, Implement and Verify methods; their owning Specs; selected references; two redundant runtime checks and a prose-coupled CLI assertion.
- Non-goals: new workflow modes, configuration, ledgers or mandatory test ratios; global configuration and publication.

## Spec
### MODIFIED
- Requirement: Writing distinguishes meaning-preserving edits from authorized retirement of unnecessary instructions. Review admits evidenced simplifications without inventing a functional defect.
- Requirement: Permanent tests protect distinct observable behavior at stable public boundaries, not private structure or source spelling. Real internal collaboration is preferred; focused unit tests remain valid for independently meaningful logic.
- Requirement: Verification identifies its target; a comparison baseline is required only for a comparative claim. Backups, snapshots and digests need a real recovery or identity consumer, not a routine preflight.
- Requirement: Common writing and code-review paths remain usable with fewer reference hops. Conditional release, recovery, authority and independent-evidence obligations remain intact.

### Acceptance
#### Scenario: Ordinary writing and simplification review
- GIVEN a bounded writing task or a correct but redundant implementation
- WHEN Doc or Review selects the applicable method
- THEN it can act from a concise ordinary path, remove authorized unnecessary obligations, and explain a safe smaller alternative without calling it a bug.

#### Scenario: Stable behavior tests
- GIVEN an internal rewrite with unchanged public behavior and a separate real behavioral regression
- WHEN the test and review methods assess coverage
- THEN implementation spelling is not pinned, while the real regression and required independent consequences remain protected.

#### Scenario: Proportionate evidence
- GIVEN a current-target check with no comparative claim or irreversible operation
- WHEN Verify collects evidence
- THEN no old revision, backup, digest or unsolicited machine-result fields are prerequisites; independently trusted digests and destructive-recovery safeguards remain required where applicable.

#### Scenario: Runtime and instruction preservation
- GIVEN CLI positional arguments and existing Focus recovery content
- WHEN redundant internal checks and prose assertions are removed
- THEN summaries remain correct and invalid capsules cannot replace existing recovery content.

## Design
- Revise the existing owners rather than adding another simplicity policy. Fold routine artifact guidance into Doc and structural code lenses into Code Review, removing the superseded resources and updating live links.
- Stable contracts are maintained in [Workflow](../specs/workflow.md) and [Writing quality](../specs/writing-quality.md); this reversible refinement needs no separate Decision Record.
- Keep stable-interface tests, contextual unit coverage and public failure semantics. Reuse existing CLI, package and evaluator checks; expand an existing integration scenario only for relevant capsule admission boundaries.
- Use the [selected upstream synthesis](../../research/reports/2026-10-27T07-39-35Z.md) as model-only input, not copied upstream instructions. Static context counts are diagnostics, not behavioral acceptance.
- This is one consistency boundary across Specs and executable Skills. No candidate performance or model-compliance claim is made without a separately authorized matched experiment.

## Tasks
- [x] Reconciled writing/workflow contracts; removed the ordinary artifact reference and separate structural-review reference, retaining their necessary guidance in the existing owners.
- [x] Consolidated test admission, reuse-first implementation and conditional baseline/backup/digest requirements; removed routine Review metadata and Verify diagnostic fields.
- [x] Removed redundant CLI argument guards, capsule re-encoding/empty checks and two managed-prose assertions; extended the existing capsule scenario for byte-limit, UTF-8 and preservation behavior.
- [x] Ran affected ordinary checks and retained candidate-bound results and limits.
- [x] Obtained separate read-only Code/Document acceptance for the initial frozen candidate.
- [x] Corrected Astra medium's accepted non-blocking P3: Skill revision now states its purpose and supporting evidence without requiring a failure or missing capability.

## Verify
### Required
- [x] Build, lint and repository code tests cover the retained runtime and CLI behavior.
- [x] Skill package/resource checks and documentation checks cover live metadata, local links and source ownership.
- [x] Offline native task schema checks and existing code-quality calibration cover the evaluator contracts without model calls.
- [x] A separate read-only acceptance worker reviewed the initial frozen candidate for ordinary and changed conditional paths, test value, retained safety and Spec/Skill consistency.
- [x] Astra medium independently re-reviewed the bounded P3 wording correction and confirmed resolution without new findings.
- Limits: no native Skill evaluation or matched performance experiment was run. Independent source review and offline checks do not establish native Skill behavior or efficiency gains.

### Evidence
- Validation target: authored Skill sources, owning Specs and runtime changes based on `f686ca6aa7c2285097a51f2129c1a91909bff0a0`, not discovery projections.
- `mise exec -- pnpm run build`, `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` passed; the full suite reported 14 files and 106 tests. After the final malformed UTF-8 fixture refinement, `mise exec -- pnpm exec vitest run tests/code/integration/cli-lifecycle.test.ts -t 'admits bounded UTF-8'` passed (1 test; 19 unrelated cases skipped). Unchanged suite evidence remains applicable.
- `mise exec -- pnpm run skills:package-check` passed for all seven packages; `mise exec -- pnpm run skills:security-check` passed for 39 files, with no findings or suppressions. `mise exec -- pnpm run docs:check` passed for its 24 README/CHANGELOG/docs files; it does not cover `.rsp` or research. A final read-only check using the repository Markdown parser verified 17 local link targets across the two changed Specs, this Change and the selected research report; earlier unchanged anchor checks remain applicable.
- `mise exec -- uv sync --project tests/skills --frozen` completed; `mise exec -- uv run --project tests/skills python tests/skills/evaluate.py check` validated 47 native Harbor tasks offline. The passing full code suite includes `code-quality-matrix.test.js`, which runs `tests/code/tooling/code_quality_matrix.py` without containers or model calls. This is evaluator calibration, not Skill behavior acceptance.
- Independent Code/Document review covered the complete candidate and work/research records, including ordinary Doc, bounded structural Review, current-target Verify, evidence reuse and retained safety gates. It traced the CLI/capsule production paths, confirmed the malformed UTF-8 fixture's discrimination, and probed citty's four valid argument forms plus missing-name rejection in memory. No blocking findings remained; applicable implementation checks were reused.
- Astra medium's additional review identified a non-blocking P3 in `skills/rsp-doc/references/skill-authoring.md`: the revision-purpose sentence still required a failure or missing capability. The correction requires purpose and supporting evidence while retaining package/caller inspection and unrelated adaptations. Independent bounded re-review confirmed resolution with no new authority or behavior issue.
- Correction checks: `mise exec -- pnpm run skills:package-check` passed for all seven packages; the current source CLI `check --json` reported one Change, no errors or warnings and no focus; `git diff --check` passed. No runtime, tests, metadata or other product files changed in this correction, so unaffected earlier checks were reused.
- Static context diagnostics for the same seven packages, observed before the P3 wording correction: entrypoints 8,665 to 8,635 whitespace-delimited words; references 32 to 30 files and 14,575 to 13,522 words. All retained package Markdown was reachable; one exact repeated-paragraph group remained. Counts do not establish model cost, behavioral equivalence or efficiency.

## Blockers
None
