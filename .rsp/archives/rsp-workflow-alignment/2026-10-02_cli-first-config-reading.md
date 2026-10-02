---
kind: "fix"
---

# Change: rsp-workflow-alignment/cli-first-config-reading

## Proposal

- Outcome: Make validated CLI projection the default source of effective RSP configuration, while preserving agent-owned decisions and bounded tool-unavailable fallback.
- Scope: Core/Manage and product Skill consumers of effective RSP language; Skill/CLI Specs, bilingual configuration and workflow guidance; two bounded shared-runner cases for inherited language and rejected configuration.
- Non-goals: Rewriting CLI or config parsers, changing keys/defaults/authority ceilings, forcing configuration reads for unrelated work, creating a runtime policy helper, altering provider/upstream configuration, global installation, archive, staging, commit, remote actions or publication.

All previous uncommitted implementation, expression work, Changes and evidence are baseline, not transferred ownership or acceptance.


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

Each consumer carries standalone CLI-first effective configuration guidance; other configuration systems retain their own readers. Reuse production CLI fixtures and the shared runner to check artifacts and refusal effects, not read-command fingerprints.

The refusal case includes initialized RSP prerequisites. A valid-policy disposable control must reach completionGate pass and archiveReady yes so missing initialization cannot mask invalid_config. Fixed snapshots and private evidence remain under tests/skills/reports/cli-first-config-reading.

## Tasks

- [x] Revise affected Skill readers and linked human guidance while preserving other contracts.
- [x] Write back the current configuration-consumption contract to its existing Spec owners.
- [x] Validate packages, links, unchanged CLI/defaults and proportionate repository checks.
- [x] Obtain independent fixed-scope review and candidate-bound inherited-language/refusal task evidence.
- [x] Converge final evidence and durable decisions without lifecycle or Git delivery.

## Verify

Historical closeout evidence below applies to the original candidate and reviewed text, not this later editorial repair. Original reports and verdicts remain unchanged.

### Required

- [x] Nine product packages passed metadata/resources; the twelve-package candidate passed security across 64 files with zero findings. Build, typecheck, lint, 18 code files /115 tests, docs checks and site build passed.
- [x] The 63-case corpus passed offline readiness. CLI/config parsing, keys/defaults, prior work and historical evidence were preserved. Initialized refusal probes returned invalid_config; removing only the unsupported key in a disposable control made config and ready pass, including completionGate pass and archiveReady yes.
- [x] Independent consumer/Spec/bilingual-document review was clean. The refusal case's initialization finding was corrected and independently re-reviewed, preserving standalone and refusal boundaries.
- [x] Two final-input tasks physically completed and passed mechanical checks and independent judging: inherited language produced Chinese prose only in guide.md; rejected policy identified invalid_config and preserved files, index, HEAD and closeout state. Distinct task/input evidence: tests/skills/reports/cli-first-config-reading/.

### Optional

The original joint matrix remains incomplete/inconclusive after frozen-input drift. Its completed language pass and separate final-input refusal pass do not establish a complete joint-matrix pass.

The host quick validator was unavailable for lack of PyYAML. Later isolated uv validation of Review/Doc belongs to writing-quality evidence and supplies no pass for other packages; repository metadata/resources were independently checked.

Old/missing CLI behavior, every language consumer, natural discovery, all hosts and complete terminal lifecycle/Git execution remain uncovered. Bounded checks establish neither quality/cost gain nor release acceptance.

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
