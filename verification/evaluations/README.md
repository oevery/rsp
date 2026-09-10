# Provider evaluations

## Select a case

Active cases are immediate child directories containing `case.yaml` under `behaviors/` or `workflows/`. Discovery reads these files directly. Nested collections retain specialized comparison inputs; they are not automatically expanded into a required matrix.

| Layer | Case | Evidence |
| --- | --- | --- |
| Behavior | `preserve-user-files` | Formatter result, unchanged user notes, allowed mutations |
| Behavior | `material-negative-fact-control` | Working API plus semantic review of removal, migration and safety facts |
| Workflow | `implement-and-verify` | Product/documentation agreement and truthful completion |
| Workflow | `recover-and-complete` | Recovered product behavior and evidence-based continuation |

Use `mise exec -- pnpm run eval:behavior -- --list` or `eval:workflow -- --list`. Inspect one case with `--case <id> --plan`. Planning never spends provider tokens.

## Run explicitly

After choosing the model, time budget and authorizing cost, use the existing isolated process adapter:

```sh
mise exec -- pnpm run eval:behavior -- --case preserve-user-files --run \
  --model <model-id> --effort <effort> --provider <provider-id-or-config> \
  --auth-file <local-auth-file> --model-catalog-json <local-catalog-file> \
  --openai-base-url <provider-endpoint> --timeout-ms 600000
```

Use `eval:workflow` for workflow cases. Credentials and endpoints are operator inputs, not tracked data. The adapter does not modify user configuration. `--codex-bin` selects the existing host executable.

Default sampling is one run. Use `--repetitions <1..10>` only for deliberate repeated observation. Runs are serial and stop on an observed failure or unavailable execution. Baseline/candidate comparison is a separate explicit release/research operation, not a prerequisite.

## Define and judge

A case needs an id, goal/request, installed Skills, allowed changes and verification command. Put its initial project in `base/`, or use `fixture` relative to the case directory for a genuinely shared project. All fixtures remain inside `verification/evaluations/`.

Use `__CASE_DIR__` in verification arguments to run a trusted check outside the agent writable workspace. The check runs with that workspace as cwd. Verify public product behavior; do not match final-response phrases or let agent-modified tests be the sole oracle.

Optional `rubric` entries describe semantic criteria. Until reviewed, semantic acceptance stays inconclusive. Accept equivalent explanations and reasonable execution paths, without exact headings, labels, receipts or call counts. Actual failed product checks or authority violations remain failures.

Each run writes a fresh directory under `verification/artifacts/evaluations/`, with a compact report and local evidence pointers. Keep execution state separate from acceptance. Missing observations do not establish behavioral failure or success.

## Historical inputs

Specialized datasets were relocated without rewriting retained research. Legacy comparison runners keep their original scoring for explicit historical/release use. Their results, fake runs and new outcome reports are not interchangeable. See [dataset conventions](DATASETS.md).
