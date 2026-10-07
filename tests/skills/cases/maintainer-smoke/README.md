# Maintainer explicit-invocation smoke

These bounded cases use the existing project/case runner and unchanged tests/skills/config.toml executor/judge roles. Explicit Skill invocation tests task behavior, not natural discovery. No live runs or provider configuration are part of these files.

- maintainer-author-revise: an RSP-owned candidate under an executable selected Change; only its SKILL.md and Change writeback may change. Uses the shared document-write oracle, plus offline readiness for the actual mounted CLI and a byte-identical package-checker snapshot. The ready plan has unfinished implementation Tasks; archive readiness is not pre-granted.
- maintainer-distill-retained: one brief-led editable study draft from a 1,911-byte CC BY 4.0 Google excerpt. The oracle checks output/path facts, a parseable completed draft and an unchanged set of supplied evidence references, rejecting added as well as missing references; the judge assesses source fidelity, gap selection and authority. Readiness verifies the retained excerpt and supplied managed evidence, separately from model behavior. The original snapshot hash is provenance, not an ignored-cache or network dependency. Draft writing grants no sealing or adoption authority.
- maintainer-explore-retained: open-ended research from the same excerpt and local guide without a supplied defect. The judge assesses discovery, applicability and honest coverage; a supported no-change result is valid. Offline readiness does not establish model behavior.
- maintainer-topic-retained: compares two operator-guide approaches in a separate study draft using the same retained evidence. Checks the direct-primary-evidence branch without requiring an intermediate source dossier. Select explicitly with --case maintainer-topic-retained; it is not added to the default maintainer-smoke suite.
- maintainer-release-evidence: read-only interpretation of explicitly simulated current/old-composition records using the existing read-only oracle. Report quality and evidence identity are semantic review concerns.

## Inputs and tools

Use an explicit composition containing author-rsp-skills, distill-upstream, release-acceptance, rsp-doc and rsp-review. No additional product Skill is required: the author case already has a selected implementation-ready Change, and no task requests planning, coordination or delivery. The authored candidate under skills/ is task data, not the installed composition.

The author project includes an exact scripts/skill-package-check.mjs snapshot at .tooling/rsp/scripts/. Readiness compares its SHA256 with both tool-source.json and the current tracked source. A source drift fails readiness until the snapshot is deliberately refreshed. tooling:rsp-cli separately mounts the genuine built CLI and an isolated existing dependency graph; no fake checker, dependency installation or access to the maintainer checkout is needed by the task.

The distill input is source text, not an expected research report. sources/provenance.json records original HTML identity/date, the short excerpt's export identity/hash/method, attribution, licensing and omissions. Original HTML was inspected locally during fixture preparation; runtime/CI needs only tracked files. The AI-generated page-summary panel is excluded. No Microsoft or other unconfirmed-license prose is included.

Prompts authorize the task; separate rubrics define judge criteria. Hard checks concern observable writes/artifact existence, not prose patterns or printed Skill-reading commands. The judge reads retained task text and execution records through an evidence index; runtime/dependency files such as .tooling/ are omitted. See the [runner guide](../../README.md) for evidence limits and report interpretation.

## Offline preparation

From the repository root with the existing build and dependencies:

- mise exec -- pnpm run test:skills -- plan --suite maintainer-smoke
- mise exec -- pnpm run test:skills -- check --suite maintainer-smoke

These commands make zero provider calls and do not validate a supplied composition. Offline success must remain behavioralAcceptance: not-run. The separately authorized operator supplies the composition/private routing and a root-session budget covering execution and independent judging for the selected cases. No task-local workers are requested. Preserve actual missing/failed evidence and follow the runner's continuation and safety boundaries; do not count readiness or simulated release inputs as acceptance.
