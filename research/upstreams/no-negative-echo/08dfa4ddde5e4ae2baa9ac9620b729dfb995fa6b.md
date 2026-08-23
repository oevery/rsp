---
source: no-negative-echo
revision: 08dfa4ddde5e4ae2baa9ac9620b729dfb995fa6b
base: null
strategy: model
evidence_hash: sha256:63db614dcfde02571539edded705b2fedf11daaa8119d0ebe017dda28fb3e8d9
status: complete
---

# Upstream Distillation: no-negative-echo

## Source Position
- `no-negative-echo` is a prompt-level Agent Skill for preventing rejected session alternatives, user corrections, and process residue from becoming the identity of final prose, code comments, test names, commit or PR metadata, release text, and handoffs (`no-negative-echo/SKILL.md`). Its core model is audience- and surface-specific finalization from the accepted result, not general deletion, implementation simplification, or test pruning.
- The source treats activation as a mitigation rather than semantic non-interference: host discovery, invocation, fresh context, complete surface access, and model behavior must be observed separately. Package or CI success does not establish efficacy (`README.md`, `no-negative-echo/SKILL.md`, `evals/evaluation-protocol.md`).
- The repository is MIT licensed (`LICENSE`). Direct copying would require preservation of the license notice in substantial portions, but the recommendations below need only model-level adoption or independent reimplementation of small mechanisms.

## Extracted Mechanisms
- **M1 — Positive-result reconstruction:** classify the positive target, observed final state, silent session exclusions, required facts, pre-existing user changes, executed external events, and per-surface audiences before producing final text. Uncommitted user work and real external actions are not treated as rejected drafts (`no-negative-echo/SKILL.md`).
- **M2 — Counterfactual surface admission:** retain a mention only when a reader without the session needs it and omission would be materially unsafe, inaccurate, misleading, incompatible, noncompliant, or would hide a real baseline change. A negative instruction does not by itself authorize publishing its terms (`no-negative-echo/SKILL.md`).
- **M3 — Per-surface baseline and high-salience regeneration:** commit text uses the task-owned diff, release prose uses the released range, and replacement titles, openings, labels, and filenames are regenerated from retained content instead of edited around rejected wording (`no-negative-echo/SKILL.md`).
- **M4 — Two-sided acceptance:** evaluation scores both residue suppression and preservation of safety, migration, compatibility, audit, quotation, domain-rule, and requested-comparison facts. Its four primary conditions also separate no Skill, a fixed comparator, explicit invocation, and implicit routing (`evals/evaluation-protocol.md`, `evals/evaluation-oracle.jsonl`, `tests/evaluation-cases.md`).
- **M5 — Frozen-surface readback:** the source proposes preflight, unchanged external mutation, readback, and postflight across accessible wrappers. It correctly treats a clean response as insufficient when a filename, commit, or generated wrapper still leaks session history (`no-negative-echo/SKILL.md`).
- **M6 — Exact-term scanning is diagnostic only:** the optional scanner normalizes text, checks content and filenames without printing protected terms, rejects unsafe paths and encodings, and explicitly cannot detect semantic paraphrases (`no-negative-echo/scripts/check_surface.py`).

## Applicable to RSP
- RSP already derives commit messages from the owned outcome and repository history, excludes command transcripts and execution chronology, and projects release notes from net release behavior (`skills/rsp-commit/SKILL.md`, `skills/rsp-release-docs/SKILL.md`). M1-M3 therefore support a narrow clarification of existing finalization owners rather than a new published Skill.
- Current RSP contracts do not state one shared counterfactual rule covering session-only rejected alternatives across code comments, test names, commit or release prose, and the final handoff. The concrete gap is cross-surface reintroduction after implementation is already correct, especially following correction, compaction, or delegated narrative handoff.
- M4 supplies the decisive evaluation shape for this gap: suppression and task preservation must be co-primary. A candidate that removes a real API deletion, safety exclusion, failed external action, migration fact, or requested comparison is a regression even if forbidden session terms disappear.
- M5 is useful only at actual finalization boundaries already owned by RSP. The general repository workflow should not require frozen bundles, independent agents, or postflight for ordinary local edits; commit and publication operations may use their existing readback contracts where the protected surface is materially at risk.
- M6 does not justify shipping a scanner. RSP can use deterministic fixture assertions for known synthetic terms while semantic adjudication remains necessary for paraphrases and task preservation.
- This source does not address the separate downstream problem of low-value permanent tests. Test admission remains owned by `rsp-implement`, `rsp-tdd`, and `rsp-review`; only a test name or comment that replays rejected session history belongs to the final-output residue gap.

## Rejected
- A new universal `no-negative-echo` or cleanup Skill in the published RSP suite: existing implementation, commit, release, and handoff owners already control the relevant actions, and another always-on workflow would duplicate routing and authority.
- Keyword bans or automatic rewriting of identifiers, tests, snapshots, diagnostics, migrations, or history: exact matching cannot distinguish session residue from required product truth and can hide real compatibility or audit facts.
- Bundling the Python scanner or upstream installer: RSP needs semantic finalization behavior and contrastive fixtures, not another runtime dependency, discovery path, provenance marker, or installation lifecycle.
- Mandatory fresh-agent production and validation: host identity and context isolation may be unavailable, while RSP must remain correct in a single ordinary session. Fresh independent validation is optional evidence, not a runtime requirement.
- The full four-condition cross-host evaluation protocol for ordinary candidate work: it is appropriate for a dedicated efficacy study but exceeds the one-to-three unseen-case promotion boundary used by current RSP Skill candidates.
- Treating every negative statement as residue: safety rules, actual removals, migration facts, external failures, requested comparisons, quotations, and domain constraints remain required content.


## Recommendations
- **R1 — Add counterfactual final-surface admission to existing finalization owners (`independent-reimplementation`).** Before finalizing a changed comment or test name, commit or release prose, or a completion handoff, derive it from the accepted result and the authoritative baseline for that surface. Omit a rejected session-only alternative or correction unless a session-independent reader needs it and material necessity, real baseline change, or an explicit comparison, audit, quotation, or migration request justifies it. Keep implementation, Git, release, and response ownership unchanged.
- **R2 — Evaluate residue suppression and required-fact preservation together (`independent-reimplementation`).** Add one positive residue case, one material-negative control, and one neutral-finalization pressure case to the existing Skill candidate infrastructure. Bind expected changed surfaces and task result separately; a suppression pass cannot waive lost safety, compatibility, migration, audit, external-action, or verification facts.
- **R3 — Reuse existing readback boundaries without a shipped scanner (`model-only`).** Where `rsp-commit` or release finalization already reads the resulting message or artifact back, include accessible wrappers in the final semantic check. Use exact-term assertions only inside bounded synthetic evaluation fixtures; do not add a package runtime scanner or claim semantic proof from zero matches.
