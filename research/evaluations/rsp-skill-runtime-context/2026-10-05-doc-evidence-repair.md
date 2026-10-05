# Doc evidence-chain repair and fresh assessment

## Result and boundary

The fresh `doc-write-grounded` execution and independent judgment passed using two root sessions, with no automatic retry or product Skill change. This supplements the seven passing cases in the [completed campaign](2026-10-05-contract-path-model-completion.md). The original Doc judgment remains inconclusive; it is not relabelled. The assessment demonstrates this task outcome, not natural triggering, a paired improvement, complete reading-path compliance or release acceptance.

The repaired runner retains sanitized session tool calls, returns and host tool items before isolated-home cleanup. Review validates the retained file reference and hash, exposes collection gaps and provides labelled literal argv decoding. Missing historical session evidence remains missing. Session instructions/messages and configuration records are excluded; injected credential values use the existing exact-value redaction policy. This is not general secret detection.

## Frozen inputs and records

- WorkRef: `.rsp/changes/concise-agent-responses.md`.
- Nine-package composition: `b5198f093d118e7e60f30cc1ff6b4287733cc0809c6d166eecdff7c2b37af516`, 48 files; unchanged from the completed campaign.
- Runner identity: `01480cd1248bff35d9a751a907514ec86f29fd114a88e5de34cb89b4a7873f00`.
- Case input: `a9a35a2651ac1624ef418e3887f5c42cdd472cec9116b8235269ffaa60d1e0a1`.
- Shared executor/judge: `AI-HUB/gpt-6.1-sol`, medium/high; `codex-cli 0.150.1`.
- [Matrix](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/live/dece17a0-9328-4e37-9751-b657d2be54bc/matrix.json): `passed`, complete, two root sessions.
- [Execution](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/live/dece17a0-9328-4e37-9751-b657d2be54bc/a580f1f9-1a23-44de-baab-e2c409ba05b6/run.json) and [independent report](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/live/dece17a0-9328-4e37-9751-b657d2be54bc/review-22c7c35c-acfc-45d2-9643-dc554ed6fa4b/report.md).

## Located evidence discrepancy

The new execution retained 31 session tool records; the judge retained 44. Both collectors reported no collection gaps. Ten host shell-command items matched the CLI commands after literal argv decoding, and their aggregated outputs matched exactly. However, the host/CLI representation was not always the full tool return.

In the execution's [session-tools.jsonl](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/live/dece17a0-9328-4e37-9751-b657d2be54bc/a580f1f9-1a23-44de-baab-e2c409ba05b6/session-tools.jsonl):

- Retained line 6 (source session line 17) is the host completion for CLI `item_3`. Its `stdout`, `aggregated_output` and `formatted_output` contain the same 4,963-byte suffix.
- Retained line 8 (source line 19) holds the enclosing tool return. Its first command result contains 9,411 bytes, including the artifact-lenses text absent from the host completion. The host output is an exact suffix of that return; the missing prefix is 4,448 bytes. The returned text contains no truncation notice.
- The full return's SHA-256 is `ad8197087e32f7911de6e387229b5999d7288a9879396c58568ed178de3f6a7c`; the host/CLI output hash is `b50822a8224be31a731dc348bf9e0d62f8f9f128b55679934974b3800d973b16`.

This locates an observed loss at or before host command-completion materialization, upstream of the runner's CLI-event retention and review copying. It does not identify the host implementation bug. The independent judge used the newly retained return to establish that artifact lenses had actually been read. Preserving both representations fixes the runner's evidence gap without pretending to repair the external host.

The earlier Doc event's literal argv decodes to a valid link regex. Its original event and review copy agree, but the four claimed missing/empty-input output lines are absent. That historical session's underlying tool return was deleted before this repair, so the newly observed host discrepancy is a plausible explanation, not proof of the historical cause.

## Execution quality and limits

The fresh run also contained genuine, recovered failures: a rejected absolute-path patch, an orchestration syntax error and an invalid check script. For source session line 49, static parsing of the submitted tool program yields exactly the script recorded in the host command at line 50, including the invalid literal newline. This failure was present in command construction, not introduced by CLI display escaping. No captured program was replayed during diagnosis.

Later assertion-bearing execution confirms exact export output, unchanged existing files, missing/empty inputs and missing-parent failure on Node v24.21.0. Separate execution verifies the README quickstart and 13 local links/anchors. Node 22 and permission failures were not exercised and were disclosed. `git diff --check` produced no diagnostics, but its individual exit status was not retained because it was grouped with later commands.

The independent report also notes an unnecessarily broad parent-directory search into unrelated temporary directories, ending with permission errors. Only the three authorized documents changed. This task pass does not establish the reading-path objective completely; it justifies no additional universal Skill restriction.

## Local verification and preservation

- Consumer regression passed all 12 checks, covering tool retention through execution and independent review, exact credential redaction, excluded session context, unsafe/missing evidence and literal multiline/regex decoding.
- `mise exec -- pnpm run test` passed build plus 18 code-test files / 131 tests. The strengthened regex-navigation assertion subsequently passed the focused retention suite. Lint and typecheck passed after final code changes.
- Documentation checks passed seven bilingual pairs and 29 Markdown files; RSP consistency and whitespace checks passed. Selected offline readiness passed with zero provider calls. Prepared-composition security passed all 48 files with no findings.
- [Preservation](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/preservation.json) passed for HEAD, index, source, runner, composition, case, existing patch/untracked files and actual private provider/auth/catalog copies. Personal credential refresh was not an acceptance gate.
- [Cleanup](../../../tests/skills/reports/rsp-doc-evidence-20261005.DKkvPI/cleanup.json) removed only the verified temporary provider/auth/catalog copies and composition after both consumers completed. Authored sources, original personal inputs and all historical/new evidence remain. No archive, commit, upstream acceptance or publication was performed.
