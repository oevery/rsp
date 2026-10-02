---
kind: "fix"
---

# Change: rsp-workflow-alignment/cli-first-config-reading

## Proposal

- Outcome: Make validated CLI projection the default source of effective RSP configuration, while preserving agent-owned decisions and bounded tool-unavailable fallback.
- Scope: Core/Manage and product Skill consumers of effective RSP language; Skill/CLI Specs, bilingual configuration and workflow guidance; two bounded shared-runner cases for inherited language and rejected configuration.
- Non-goals: Rewriting CLI or config parsers, changing keys/defaults/authority ceilings, forcing configuration reads for unrelated work, creating a runtime policy helper, altering provider/upstream configuration, global installation, archive, staging, commit, remote actions or publication.

All previous uncommitted implementation, expression work, Changes and evidence are baseline, not transferred ownership or acceptance.


This Change was explicitly re-homed from `cli-first-config-reading` to `rsp-workflow-alignment/cli-first-config-reading` for the authorized grouped local delivery. Original candidate identities, reports and verdicts retain their historical scope.

## Spec

Apply existing [Skill](../../specs/skill.md), [CLI](../../specs/cli-contracts.md) and [writing quality](../../specs/writing-quality.md) authorities.

### MODIFIED

- Read effective RSP settings through the same selected CLI's successful rsp config --json projection, with optional --compact. The CLI owns validation, supported defaults and language inheritance; Agent owns interpreting the result within authority. status and raw/cached YAML are not equivalent effective summaries.
- Read only when the current decision needs configuration. Reuse observed effective values while relevant facts remain unchanged; refresh on configuration drift, recovery or the dependent closeout boundary, not every method transition.
- Diagnose failed/unavailable configuration projection without bypassing its refusal or inventing inherited/default values. Raw-file inspection is diagnostic only. A tool-unavailable fallback may continue independently authorized work that needs no unresolved configuration; dependent decisions and automatic closeout remain unavailable.
- Preserve existing language precedence, standalone invocation, all Manage duties and qualification, named evidence and lifecycle/Git separation. This rule applies to RSP configuration, not other tools' configuration.

### Acceptance

#### Scenario: Inherited language

- GIVEN a valid RSP config with language.default and no surface override
- WHEN a new artifact needs its effective language
- THEN the writer uses the CLI's resolved language, preserves explicit overrides and existing-file language, and changes only authorized artifacts.

#### Scenario: Rejected policy

- GIVEN plausible Manage fields in configuration the CLI rejects
- WHEN coordinated closeout is considered
- THEN raw values supply no valid policy or closeout grant; preserve files/Git and report the actual missing condition.

#### Scenario: Tool unavailable

- GIVEN a diagnosed unavailable selected CLI and an independent authorized task
- WHEN that task needs no unknown configured value
- THEN it may continue with the configuration gap explicit, without manual resolution, automatic closeout or a forced tool repair.

## Design

Use rsp-doc's Skill/agent-facing methods and author-rsp-skills revise mode. Keep each consumer standalone with concise local guidance; do not create another common runtime policy or impose RSP CLI on non-RSP repositories. Core's default selection and detailed coordination procedure name the CLI consistently. Other configuration systems retain their owning methods.

Use the pre-edit source snapshot recorded under ignored tests/skills/reports/cli-first-config-reading for fixed review. Reuse production CLI fixtures and the existing project/case runner; test observable artifacts and refusal effects, not reading fingerprints. Shared execution remains gpt-6.1-sol medium with high judging. Keep private configuration and raw records outside tracked artifacts.

The refusal case supplies initialized RSP prerequisites. A disposable valid-policy control must reach completionGate pass and archiveReady yes, so missing initialization cannot mask the configuration-refusal outcome.

## Tasks

- [x] Revise affected Skill readers and linked human guidance while preserving other contracts.
- [x] Write back the current configuration-consumption contract to its existing Spec owners.
- [x] Validate packages, links, unchanged CLI/defaults and proportionate repository checks.
- [x] Obtain independent fixed-scope review and candidate-bound inherited-language/refusal task evidence.
- [x] Converge final evidence and durable decisions without lifecycle or Git delivery.

## Verify

### Required

- [x] Product packages/resources and complete-candidate security pass: nine published packages pass, the 12-package candidate has 64 scanned files and no findings. Docs checks and site build, product build, typecheck, lint and all 18 code files / 115 tests pass.
- [x] New cases and the 63-case corpus pass offline readiness, separately from model execution. Snapshot comparisons confirm CLI/config implementation, project configuration/defaults, prior Changes and historical evidence remain unchanged; no global configuration was mutated. Initialized refusal probes fail with invalid_config; removing only the unsupported key in a disposable control makes config and ready pass, with completionGate pass and archiveReady yes.
- [x] Independent fixed-scope review finds consumer guidance, Specs and bilingual documents clean. The refusal case's initialization finding is corrected and independently re-reviewed clean; standalone and configuration-refusal boundaries are preserved.
- [x] Both final-candidate isolated tasks physically complete, pass mechanical checks and receive high independent judging: config-inherited-artifact-language produces Chinese prose in only guide.md; config-rejected-closeout-policy identifies invalid_config and preserves files, index, HEAD and closeout state. The fixed composition and distinct final-input records are retained under ignored tests/skills/reports/cli-first-config-reading.

### Optional

Actual old/missing CLI behavior, every language consumer, natural discovery, all hosts and full terminal lifecycle/Git execution remain uncovered unless separately exercised. No measured quality/cost gain or release acceptance follows from these bounded checks.

At this stage the generic Skill quick validator was unavailable because local and bundled Python lacked PyYAML. Repository package/resource validation passed independently. Later isolated uv validation of rsp-review and rsp-doc belongs to the writing-quality evidence; it establishes no host-validator pass for other packages.

The original joint matrix remains incomplete/inconclusive after a frozen-input change; its completed language-task pass and the separate final-input refusal-task pass are retained independently. No complete joint-matrix claim or historical verdict rewrite follows from these task results.

### Durable Decisions

- Current facts: Update existing spec or scoped instruction.
- Current-fact targets: .rsp/specs/skill.md and .rsp/specs/cli-contracts.md.
- Facts written: CLI-first validated configuration consumption, resolved inheritance/defaults, and dependent-only refusal handling; existing bilingual guidance is synchronized.
- Decision Record: No Decision Record needed.
- Decision Record target: N/A.
- Rationale to write: none — restores the existing configuration-summary ownership without another architecture or configuration system.
- Archive ready: yes — required implementation and bounded task evidence are complete. The Group owns final integrated review, fresh readiness, authorized archive and one local delivery.

## Blockers

- none
