# Reading-path context probe

## Conclusion

Retain the existing product Skills. Four bounded executions and four independent judgments completed: all mechanical checks passed, but the original judgments are **three passed and one failed**. The failed Doc treatment judgment includes an unsupported interpretation of serialized command literals and a reader-path criterion applied differently across the pair. This research diagnoses those limits; it does not replace the verdict or establish candidate acceptance.

The Catalog treatment avoided a redundant fallback read observed in its control. Both Doc samples avoided the earlier broad parent-directory search, including the control without AGENTS.md. Project entry context is a useful investigation lead, not a demonstrated general fix. One sample per arm cannot establish causality, reliability or efficiency.

## Design and frozen inputs

This follows the [Doc evidence-chain repair](2026-10-05-doc-evidence-repair.md) without modifying Skills, Specs, the runner or historical judgments. Catalog control/treatment and Doc control/treatment ran serially, with unchanged task prompts, rubrics and oracle bytes within each pair. Treatment case metadata differs only in case/project identity.

- Catalog treatment copies the original project and appends the repository's standard RSP Entry block to AGENTS.md.
- Doc treatment copies the original project and adds a minimal AGENTS.md identifying CONTEXT.md as vocabulary/navigation owner, spec.md as export-contract owner, export.mjs and project-brief.md as grounding sources, and the authorized document-only boundary. It adds no search recipe. The control has no AGENTS.md.
- Byte/map comparisons confirmed AGENTS.md as the only project-file difference. All four offline checks passed. Composition security checked 48 files with no findings or suppressions.
- Both consumers used `AI-HUB/gpt-6.1-sol`: executor medium, judge high, with `codex-cli 0.150.1`. There were no automatic retries or total time/token caps.

Candidate identity:

| Boundary | Identity |
| --- | --- |
| Source HEAD | `c630a4ba0d6c917e9fc51533257c23b480d7526c` |
| Source identity | `fd22b5fb7f67020f5b60dbdbafab6c267c91c67752bbd7e9b894552faee8f475` |
| Nine-package composition | `b5198f093d118e7e60f30cc1ff6b4287733cc0809c6d166eecdff7c2b37af516` |
| Product | `2808767d36b1b7315c977351dc47632116f29ad14d4b3ee93a0de2f6f42e2b42` |
| Runner | `01480cd1248bff35d9a751a907514ec86f29fd114a88e5de34cb89b4a7873f00` |

The [preflight record](../../../tests/skills/reports/rsp-context-probe-20261005.haCe2z/preflight.json) retains preparation evidence. The [matrix](../../../tests/skills/reports/rsp-context-probe-20261005.haCe2z/live/356159f7-2c15-4766-975b-2c6db1e413de/matrix.json) binds all four input hashes, executor records, independent reports and their hashes. It remains `complete: true`, `status: failed`, with eight root sessions and no cancelled or unparsed judgment. These ignored private records must be retained with the research; a repository checkout alone does not contain the live evidence.

## Paired observations

| Case | Mechanical | Independent judgment | Observed reading path |
| --- | --- | --- | --- |
| `catalog-completion` | Passed | Passed | Read Core/Implement, then the fallback protocol despite the supplied single-entry rule. |
| `context-catalog-entry` | Passed | Passed | Read AGENTS/Core and Implement; no fallback read observed. Initial batched read failed on absent optional CONTEXT.md, then execution continued. |
| `doc-write-grounded` | Passed | Passed | No broad parent-directory search; final changes stayed within three documents. |
| `context-doc-entry` | Passed | Failed | No broad parent-directory search; final changes stayed within three documents. Judgment issues are analyzed below. |

Both Catalog samples preserved permitted scope and the index. A separate treatment project check passed. The control's batched whitespace check did not independently retain its exit status. Both Doc samples recovered from patch/orchestration/check-construction failures, including invalid literal newlines. These recovered failures are distinct from the later valid final checks.

All eight session-tool collectors reported no gaps. In the Doc control, retained session-tool line 22 (source line 51) preserves full PASS output while CLI event line 16 contains only a suffix. This supports retaining full tool returns alongside host/CLI representations; it does not repair the external host behavior.

## Failed judgment: evidence and disposition

The Doc treatment judge questioned the retry stdout assertion and link-check regex as incorrectly escaped. A read-only [literal analysis](../../../tests/skills/reports/rsp-context-probe-20261005.haCe2z/literal-analysis.json) parsed the retained final host argv scripts with TypeScript, extracted literal values and replacement arguments, and matched the resulting regex against saved Markdown and the repository Markdown-link parser. No captured program was executed and neither model nor judge was rerun.

Both scripts parse without diagnostics. Both expected stdout strings end in code point 10 (an actual LF), not literal backslash-n. Their link regexes match all parser-discovered links: control 13 (README 4, CONTEXT 5, Spec 4), treatment 14 (README 4, CONTEXT 6, Spec 4). The relevant final host records are control retained line 21/source line 50 and treatment retained line 18/source line 46. The escaping criticism is therefore unsupported by the retained literal evidence. This static check is not a replay or new behavioral acceptance.

The other criticism concerns explaining Job versus Run before use. Both README openings mention the fixed Job named `daily`, and both link CONTEXT after runnable instructions. Both CONTEXT files define Job and Run before explaining their relationship. The control judge accepted the CONTEXT explanation; the treatment judge required the definition earlier in the README-first path, under the same rubric.

That common reader-path concern may be legitimate. However, inconsistent interpretation is a confound, not evidence of a treatment-only regression. Keep the original three-pass/one-fail result; do not relabel either sample. Author diagnosis and independent judgment remain separate.

## Descriptive executor measurements

| Case | Input tokens | Cached input | Output tokens | Duration (ms) | Executor/judge retained tool records |
| --- | ---: | ---: | ---: | ---: | ---: |
| Catalog control | 127970 | 100992 | 1145 | 71759 | 22 / 39 |
| Catalog treatment | 133336 | 109824 | 1188 | 87171 | 25 / 30 |
| Doc control | 164068 | 140416 | 7179 | 299761 | 25 / 43 |
| Doc treatment | 141614 | 118912 | 6997 | 299231 | 22 / 40 |

Token usage is cumulative across executor calls, with cached tokens included in input. Duration includes provider/tool variability. These are single samples in fixed serial order, not cost measurements, savings estimates or an optimization acceptance metric.

## Preservation and next step

[Preservation](../../../tests/skills/reports/rsp-context-probe-20261005.haCe2z/preservation.json) passed for source, runner, HEAD, index, tracked diff, product, composition, preflight untracked files, four case hashes and the frozen private provider/auth/catalog copies. Personal credential refresh was not a drift gate. No personal settings were modified.

[Cleanup](../../../tests/skills/reports/rsp-context-probe-20261005.haCe2z/cleanup.json) byte-verified treatment inputs into the retained `inputs/` backup before removing the three temporary fixture/case paths. The exact temporary runtime and composition copies were removed after all consumers exited. Historical and new evidence remain available; removed fixtures are recoverable from the backup.

The bounded diagnostic research is complete. Keep product Skills and stable contracts unchanged. Before any future comparison, settle a consistent interpretation of the existing before-use rubric and distinguish decoded literals from serialized display text. Only then would repeated or randomized paired runs help test the Catalog lead. The Doc control did not reproduce broad search, so AGENTS absence is not a sufficient explanation and warrants no incident-specific runtime restriction. No further model invocation is needed for this scoped conclusion.
