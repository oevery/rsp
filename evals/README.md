# Skill and agent evaluations

This directory evaluates observable Skill/agent behavior. It is not part of the published package. Deterministic engine tests live in tests/; release policy lives in release/.

## Execution contract

A campaign freezes one provider configuration, the harness, product source, release suite, case inputs, scheduling seed and two Skill compositions. Each arm gets a fresh temporary Git workspace outside this repository. Only the fixture, explicitly requested common CLI tooling and that arm's Skill packages are installed; case manifests, task oracles, expected outcomes and rubrics are not copied into the workspace. Baseline and candidate share the same adapter, prompt, fixture and execution settings. A recorded seed randomizes the first arm within balanced blocks of two paired repetitions. Runs remain sequential, with no harness retries or dropped failures.

The source identity also freezes the actual dist/ tree and tsup.config.ts/tsconfig.json, not just source text. Build before running evaluations. Each run records that identity and rejects drift around execution; continuation, offline revalidation and release checks reject changed artifacts or build inputs. Identical rebuilds retain the identity. Historical reports without the per-run identity cannot satisfy the current release gate.

The default baseline is not implicit: choose a Skill directory or explicitly choose none. Candidate packages are copied into .agents/skills and their installed hashes are checked. Changes to the installed packages, commits, the Git index, deleted files, untracked files and ignored files are observed separately from ordinary Git status. Fixtures can declare pre-existing working-tree edits and staged paths; those are the baseline, not model changes.

Before each campaign session, both composition directories must still match the frozen plan, including directories outside the repository. The installed composition must match that arm's frozen hash before the provider is called. Directory drift stops the campaign with composition-drift and preserves completed samples. Resume requires restoring the original inputs; intentionally changed inputs require a new campaign. Skill-read fingerprints come from the verified installed copy, not a mutable external directory.

RSP workflow fixtures opt into tooling: rsp-cli. Both arms receive the built CLI and fallback rules, with a link to the existing dependency cache and a .tooling/node link to the interpreter running the harness, but no bundled Skill package outside the selected composition. Fixture instructions use .tooling/node explicitly so host shell startup files that replace PATH do not force runtime discovery. Run the build first. This is a common test toolchain, not filesystem read isolation. Readiness probes use the repository-owned CLI against the resulting fixture and preserve its JSON result in the observation.

The fixed OpenCodex adapter requires an explicit model, effort and isolated config file. It uses the provider selected by that config, without constructing service endpoints or replacing its model_provider with a literal provider named config. The report's provider: config denotes this routing strategy. Config/auth are snapshotted into a temporary private HOME/CODEX_HOME, which is removed after execution. Ambient credentials and global configuration are not inherited. The operator-supplied config must contain the intended provider definition and any required absolute catalog paths; do not supply a personal config that enables unrelated plugins, MCP servers or global Skills.

## Commands

Run these from the repository root with the configured toolchain:

    mise exec -- pnpm run eval:list
    mise exec -- pnpm run eval:plan -- --case preserve-user-files
    mise exec -- pnpm run eval:check

These commands do not contact a provider. The check command validates schemas and oracle wiring, not Skill behavior.

After explicit authorization, a small live campaign can be run with:

    mise exec -- pnpm run eval:campaign -- \
      --allow-live \
      --case preserve-user-files \
      --baseline-skills none \
      --candidate-skills ./skills \
      --model AI-HUB/gpt-6-sol \
      --effort medium \
      --config-file /absolute/path/evaluation-config.toml \
      --auth-file /absolute/path/auth.json \
      --repetitions 2 --max-sessions 4

The auth file is optional if the explicitly supplied provider configuration does not need it. The config is required. Use --codex-bin to select the intended OpenCodex executable and --timeout-ms to bound each run. Arbitrary --command and separate baseline/candidate commands are no longer supported by the live CLI. A programmatic local-command seam exists only for deterministic engine testing; its reports cannot pass the provider release gate.

Use --seed to reproduce scheduling. It does not make model output deterministic.

The isolated configuration must explicitly select a simple model_provider identifier at the top level. Reports retain it as configuredProvider, separately from provider: config (the routing strategy). Review may use the same provider and even the same model as execution; independence here means a fresh, blind-packet-only review context, not a different service or model. Gateway/upstream identity still requires truthful operator attribution; the harness cannot attest opaque remote routing.

The project-default execution model is AI-HUB/gpt-6-sol with medium effort; the default semantic reviewer is AI-HUB/gpt-6-astra with low effort. Supply execution settings explicitly to the live command. review-live, review-batch and calibrate apply the reviewer defaults when --model or --effort is omitted; explicit overrides remain supported. These defaults are not model-identity acceptance gates and do not change global host configuration.

Omit --case to run the public suite. Add --holdout-registry and --holdout-root to include externally supplied private cases. See holdout/README.md before doing so. A campaign with pending semantic reviews exits nonzero with an inconclusive result; this is not a provider failure.

## Evidence and verdicts

Each run retains run.json, events.jsonl, stderr.log, final.md and a review packet under a unique ignored evals/reports directory. Campaigns retain a frozen plan, identity hashes, completed samples and a separate review-packets directory. Partial campaigns remain incomplete and cannot pass release acceptance. Resume only matching completed-sample checkpoints as described below; changed inputs require a new campaign.

The eval:review import creates campaign.json.reviewed.json exclusively. A second import to that path fails without replacing the earlier report or decisions, including concurrent imports. Keep earlier evidence; review-batch uses separately named reports for new review batches.

Skill activation is based on observed guidance content, not command names or path mentions. Before execution the host freezes hashes of distinctive lines from each installed SKILL.md; two distinct matching lines in command output establish observed exposure, including rg line-number output. Shared boilerplate does not identify a Skill. These fingerprints remain in the private operator bundle for offline replay, never the blind packet. This is a content-exposure observation, not proof that the agent read or followed the entire Skill.

Missing or truncated content is not proof of non-activation. Any opaque command or delegated/tool call makes absence unknown: a forbidden-activation case then remains inconclusive unless exposure was observed (failed). With no such calls and complete event evidence, absence can pass. Legacy runs without the frozen fingerprints cannot establish absence through replay. This conservative boundary may require richer provider read telemetry for negative cases involving tools; semantic approval does not replace missing activation evidence.

## Batches, budgets and continuation

Use comma-separated IDs with --case to select a batch. Omit --case for all public cases. Preview the selected cases, paired session count and budgets with eval:plan using the same --case/--repetitions/--max-sessions/--max-tokens options; planning never contacts a provider. The campaign CLI requires --max-sessions; a session means one fresh task execution, not one underlying model request. Batch commands also accept --max-tokens, measured as reported input_tokens + output_tokens (cached input is not subtracted; reasoning tokens are not added again).

Budgets apply to each invocation, including resumed invocations. Token limits are admission thresholds checked between sessions, not hard provider billing caps: the final in-flight session can exceed the threshold. Missing usage stops further work when a token budget is specified. Session count is bounded even when usage is unavailable. Review retries consume the same session/token budget; at most two attempts per packet are retained across budget-boundary resumes.

Normal project runs do not set a token budget. Record actual token usage without stopping on token counts; supply --max-tokens only when the user explicitly requests a token limit. Session bounds describe the authorized task/retry scope, not an inferred token or cost budget.

To continue a budget-stopped execution, repeat the same config/auth, model/effort and compositions, and add --resume /absolute/path/campaign.json --max-sessions N. The saved case list, seed, repetition count and timeout are reused when omitted. If private cases were included, supply the original holdout inputs again. Complete samples are validated and skipped, never rerun. Recorded candidate failures or unavailable executions are not silently retried.

Batch state is written atomically under an exclusive lock. A kill during a provider call leaves inFlight state (and possibly a stale lock). Do not delete that state and retry blindly: inspect the retained evidence and process first. Automatic continuation supports completed-sample checkpoints, not ambiguous in-flight recovery. A changed config, input or execution identity stops before another session. Keep a stable isolated config/catalog path for continuation; reconstructing equivalent config at a different absolute path changes its hash.

Review a campaign in bounded batches without writing custom scripts:

    mise exec -- node evals/runner/cli.mjs review-batch --allow-live \
      --report /absolute/path/campaign.json --max-sessions 4 \
      --config-file /absolute/path/isolated-config.toml --auth-file /absolute/path/auth.json

Continue with the same arguments plus --resume /absolute/path/review-batch-ID/batch.json. Optional --decisions imports existing valid decisions on the first invocation; their actual identities are preserved, including a different effort/model. The batch writes batch.json, decisions.json and summary.md. When every packet has a valid decision it also writes a separate campaign.<batch-id>.reviewed.json alongside the original run directories. Valid fail/inconclusive decisions are not retried; other independent packets may continue. Infrastructure, exhausted format retries or unclean context stop the batch. All-pass parsing is not the success criterion.

## Evidence reuse

New reports retain executionHash and gradingHash in addition to the whole-harness provenance hash. Execution identity covers adapters, observers, workspace preparation, serialization and blind-packet projection. Task grading identity covers the deterministic graders. Reviewer prompts/defaults and review-decision policy do not alter execution identity; semantic decisions are always checked against current review policy.

- Product, input, composition or execution identity changed: fresh execution required.
- Only deterministic grading changed: revalidate recorded evidence offline; do not call the execution model again.
- Only reviewer settings/prompt changed: execution can be reused, but do not relabel old decisions as results from the new reviewer. Obtain new decisions when that new reviewer behavior is what you intend to evaluate.

    mise exec -- node evals/runner/cli.mjs revalidate --report /absolute/path/campaign.reviewed.json

This validates retained artifacts with the shared replay graders, then writes a separate .revalidated.json with receipts bound to each original evidence hash and current grading identity. For private cases supply the original holdout registry/root. Original run data and decisions remain untouched. The release gate consumes the receipts and independently checks source, coverage and semantic requirements. Older reports without split identities cannot be retroactively upgraded; they remain useful historical evidence but do not pass the new release gate.

## Judge calibration

The four synthetic seed cases in calibration/cases.json exercise a correct result, a false success claim, missing evidence and an out-of-scope write. Expected dimension labels remain outside the packet supplied to the reviewer. Maintainers should inspect/approve these seed labels before treating them as a gold set; they are not independent private holdouts.

    mise exec -- node evals/runner/cli.mjs calibration-plan
    mise exec -- node evals/runner/cli.mjs calibrate --allow-live --max-sessions 4 \
      --config-file /absolute/path/isolated-config.toml --auth-file /absolute/path/auth.json

Calibration uses the same batch/resume/budget path, but scores agreement with expected labels rather than requiring every answer to pass. Always-passing graders therefore fail calibration. Missing decisions are inconclusive. Calibration JSON records per-case expected/observed dimensions and agreement; local fake-provider tests prove scoring mechanics, not astra quality. A bounded September 27, 2026 astra/low run matched all four seed cases with four sessions; that is a scoped smoke result, not broad model reliability or independent holdout acceptance. Further real calibration runs require separate cost authorization.

Verdicts distinguish:

- infrastructure: spawn failure, nonzero execution exit, timeout, provider error or output limit;
- evidence: malformed/missing completion events, missing final response or unavailable required Skill-read evidence;
- harness: workspace, observation or oracle execution failure;
- hard-boundary: observed unauthorized mutations/actions;
- activation: a forbidden target Skill was observed loading on a negative case;
- task: a completed execution that did not achieve the case's observable task result.

Infrastructure, harness and insufficient evidence are inconclusive, not successful cases or measured model regressions. A baseline task failure is retained and does not excuse a candidate failure. Reports include success rates with explicit valid/inconclusive denominators, failure categories, per-arm metric samples/means/sample standard deviations, and paired resource deltas. Missing metrics remain missing rather than becoming zero. Resource statistics cannot override correctness failures; small samples do not establish a quality or performance advantage.

Workspace snapshots are capped at 10,000 entries and 64 MiB; process output at 8 MiB. Task text artifacts, including unchanged inputs, are retained up to 64 KiB each and 256 KiB total. Installed guidance and common tooling are excluded from task-content packets. Omitted binary/large task artifacts make semantic acceptance inconclusive. Timeouts escalate from TERM to KILL for the process group on POSIX. Windows does not provide equivalent descendant termination and is not validated by this implementation.

Boolean-export oracles evaluate the actual export in a bounded, credential-free child process with Node permissions and an import-free VM module. Formatting, comments and equivalent expressions do not affect the result. Unsupported imports or unavailable evaluation return inconclusive. This narrowly scoped probe is not a general adversarial-code execution service.

## Offline replay

    mise exec -- pnpm run eval:replay -- --report /absolute/path/run.json

Replay validates the captured case/spec identity, evidence hash, retained stream/final files and text-content hashes. It reconstructs event observations and invokes the same activation, hard-boundary and task graders as a live run, without constructing or calling a provider adapter. Project readiness remains the captured host observation; replay does not claim to rerun a new CLI against a deleted workspace. Trusted case oracles must consume recorded observations, not perform provider calls or inspect an execution workspace.

The output is a separate replay.json with original/current harness hashes and verdict agreement. Original run evidence is not edited, and replay is not a fresh live campaign or release approval. For private cases supply the matching --holdout-registry and --holdout-root. Changed/missing case input, missing artifacts, redacted task content or older evaluation-run-v1 evidence returns inconclusive; old smoke reports remain historical evidence rather than being silently upgraded.

## Independent semantic review

For a schema-constrained, single-packet live review (explicit provider authorization required):

    mise exec -- node evals/runner/cli.mjs review-live --allow-live \
      --packet /absolute/path/review-packets/PACKET.json \
      --model AI-HUB/gpt-6-astra --effort low \
      --config-file /absolute/path/isolated-config.toml \
      --auth-file /absolute/path/auth.json

This passes a minimal object schema through codex exec --output-schema. The model outputs only dimensions (name, status, reason, evidence); the host binds packet hash, reviewer identity and context attestations after checking the no-tool execution trace. Each attempt uses a fresh session/workspace/config; no campaign or previous attempt is passed to the model. This is observed isolation, not an enforced read sandbox.

Only invalid JSON or decision structure may receive one automatic format retry (two attempts maximum). Every attempt and reported token usage is retained. Valid fail/inconclusive verdicts, provider errors, timeouts, missing trace evidence and observed tool use stop immediately. Unsupported schema is not silently downgraded to prompt-only JSON. Local validation still checks complete rubric coverage and evidence references; schema acceptance alone does not establish semantic correctness or prove an opaque provider enforces constrained decoding. Output is review.json plus decisions.json only when a valid decision exists. Import decisions separately using eval:review; live review does not rewrite execution reports or approve release.

Give the reviewer only the randomly named files in review-packets/, not campaign.json or the run directories. Version-2 packets omit arm/model/provider labels, installed Skill paths and hashes, common tooling files, guidance-loading commands and concrete workspace identifiers. Raw activation/boundary traces remain in the private operator bundle for hard grading. Identical task outputs with different installed guidance produce identical task evidence; free-form answers and genuine behavioral differences can still support inference, so complete psychological blinding is not guaranteed.

Packets include hostGit equality observations for HEAD/index (unknown observations remain null) and projectChecks containing captured CLI results. These are host-observed facts, not previous evaluation verdicts. Raw Git hashes are withheld because they can fingerprint installed guidance. This lets reviewers corroborate preservation and readiness claims without receiving arm labels or cached grades. A review after new evidence is supplied is a separate packet/hash and decision; preserve the original inconclusive review rather than overwriting it or repeatedly asking for a pass. Packet-projection changes alter the execution fingerprint conservatively; supplemental review is not an automatic release-evidence upgrade.

The reviewer returns a JSON array. Every decision binds the exact packetHash and covers every rubric dimension exactly once:

    [
      {
        "packetHash": "HASH_FROM_PACKET",
        "reviewer": { "id": "independent-reviewer", "kind": "human" },
        "reviewContext": { "fresh": true, "blindPacketOnly": true },
        "dimensions": [
          {
            "name": "NAME_FROM_RUBRIC",
            "status": "pass",
            "reason": "Specific conclusion grounded in the supplied evidence.",
            "evidence": ["diff", "artifacts", "finalOutput"]
          }
        ]
      }
    ]

Dimension statuses are pass, fail or inconclusive. Model reviewers additionally declare their actual provider and model; neither must differ from execution. Every decision, including human review, must attest reviewContext.fresh=true and reviewContext.blindPacketOnly=true. Start model reviews without inherited conversation, execution history, campaign reports, group labels, prior verdicts or access to the operator bundle; provide only the blind packet and neutral review/output-format instructions. A reviewer already exposed to execution results is not eligible for that packet. A fresh model context may use the same model/provider, but cannot continue the execution session.

Missing or false context attestations, reused reviewer IDs within one packet, missing dimensions, stale packet hashes and reviewer disagreement cannot yield a pass. Reviewer identities and context declarations are operator attestations, not cryptographic proof or automatically enforced read isolation; the operator must establish and truthfully record the clean review context. Sharing a model or provider may retain correlated biases and does not establish cross-model independence. Old decisions lacking context declarations remain inconclusive; do not retrospectively invent attestations. Existing raw execution and packets remain unchanged, and importing a review is not fresh execution or a waiver of release identity/coverage checks.

Import the decisions without rerunning the model:

    mise exec -- pnpm run eval:review -- \
      --report /absolute/path/campaign.json \
      --decisions /absolute/path/decisions.json

This writes a separate .reviewed.json report and preserves the original execution evidence. Re-import a complete decision set when adding reviews; imports do not silently merge old decisions.

## Current coverage and limits

The public suite combines the packaged-Skill routing smoke cases with positive, near-intent negative, owner-boundary, workflow and interruption/staging regression scenarios for rsp, rsp-implement and rsp-review. Workflow fixtures contain real RSP state or staged/unstaged Git work. Activation expectations are required, forbidden or optional; absent required read evidence is inconclusive, while observed forbidden activation fails.

The interrupted-verification regression checks observable recovery and authorized owner writeback, not one mandatory Skill-loading path. Its activation is optional because an already implemented change may use a read-only Verify pass followed by Core/owner writeback. Actual export verification, completion under the same Change, unchanged code/notes and index protection remain required. Required rsp-implement activation is still tested by its positive trigger and ready-implementation workflow; negative activation gates are unchanged. The earlier inconclusive sample retains its original required-activation contract and is not retroactively regraded as a pass.

See tests/COVERAGE.md for the risk-to-evidence map. release/suites/required-cases.json names mandatory public scenarios and negative holdout targets; case count or one label per Skill is not sufficient for acceptance. Private holdout cases and independent decisions remain external inputs and are never fabricated by the harness. Local fixture-provider tests validate engine/oracle contracts, not live Skill quality.

Temporary HOME and workspace-write are configuration/write isolation, not read confinement. A process on the same host can potentially read files outside its workspace. Private holdout acceptance therefore requires separately enforced read isolation and an operator attestation bound to the candidate hash. The adapter does not provision a container or remote runner. Do not expose private cases on an agent-readable filesystem and call them sealed.

Hard checks use final snapshots and reported events. Snapshots cannot prove that a file was never temporarily modified and restored. Shell-command matching is conservative, not a general shell parser, and event traces are not a kernel audit log. Retain independent review and the execution sandbox; do not present this harness as a security sandbox.

Known supplied credentials, bearer values and URLs are redacted from retained provider output. This is not a general secret scanner. Do not put sensitive user data or credentials in fixtures or prompts; keep all reports private, especially holdout reports. Review an evidence bundle before sharing it.
