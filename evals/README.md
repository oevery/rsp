# Skill and agent evaluations

This directory evaluates observable Skill/agent behavior. It is not part of the published package. Deterministic engine tests live in tests/; release policy lives in release/.

## Execution contract

A campaign freezes one provider configuration, the harness, product source, release suite, case inputs, scheduling seed and two Skill compositions. Each arm gets a fresh temporary Git workspace outside this repository. Only the fixture, explicitly requested common CLI tooling and that arm's Skill packages are installed; case manifests, task oracles, expected outcomes and rubrics are not copied into the workspace. Baseline and candidate share the same adapter, prompt, fixture and execution settings. A recorded seed randomizes the first arm within balanced blocks of two paired repetitions. Runs remain sequential, with no harness retries or dropped failures.

The source identity also freezes the actual dist/ tree and tsup.config.ts/tsconfig.json, not just source text. Build before running evaluations. Each run records that identity and rejects drift around execution; continuation, offline revalidation and release checks reject changed artifacts or build inputs. Identical rebuilds retain the identity. Historical reports without the per-run identity cannot satisfy the current release gate.

The default baseline is not implicit: choose a Skill directory or explicitly choose none. Candidate packages are copied into .agents/skills and their installed hashes are checked. Changes to the installed packages, commits, the Git index, deleted files, untracked files and ignored files are observed separately from ordinary Git status. Fixtures can declare pre-existing working-tree edits and staged paths; those are the baseline, not model changes.

Before each campaign session, both composition directories must still match the frozen plan, including directories outside the repository. The installed composition must match that arm's frozen hash before the provider is called. Directory drift stops the campaign with composition-drift and preserves completed samples. Resume requires restoring the original inputs; intentionally changed inputs require a new campaign. Skill-read fingerprints come from the verified installed copy, not a mutable external directory.

RSP workflow fixtures opt into tooling: rsp-cli. Both arms receive the built CLI and fallback rules, with a link to the existing dependency cache and a .tooling/node link to the interpreter running the harness, but no bundled Skill package outside the selected composition. Fixture instructions use .tooling/node explicitly so host shell startup files that replace PATH do not force runtime discovery. Run the build first. This is a common test toolchain, not filesystem read isolation. Readiness probes use the repository-owned CLI against the resulting fixture and preserve its JSON result in the observation.

The fixed OpenCodex adapter consumes repository-owned runtime policy and role settings under evals/config/, plus an explicitly supplied private provider configuration. It uses the selected provider without inventing service endpoints or replacing model_provider with a literal provider named config. The report's provider: config denotes this routing strategy. Runtime config/auth are materialized into a temporary private HOME/CODEX_HOME, removed after execution. Do not pass a personal Codex config: model routing, extensions, hooks, instructions and memory policy are not private-provider inputs.

## Reproducible local configuration

evals/config/base.toml owns shared evaluation policy. The role files own maintainer defaults, not RSP product requirements:

| Role | Model | Reasoning effort |
| --- | --- | --- |
| coordinator | AI-HUB/gpt-6-astra | low |
| implementer | AI-HUB/gpt-6-sol | medium |
| verifier | AI-HUB/gpt-6-astra | low |
| reviewer | AI-HUB/gpt-6-astra | low |

Memory use and generation are both disabled; disabling generation alone would leave existing-memory injection possible. The shared policy also disables unrelated extension features. A fresh runtime home excludes ambient user instructions, Skills and persistent memory. These are configuration/context controls, not an operating-system read sandbox: an agent on the same host may still attempt to read outside its workspace. Do not call a native desktop child run equivalent to an adapter run without observing the same policy and capabilities.

Keep provider routing, private endpoints and credentials outside versioned files. A provider-only config selects model_provider and its provider table, plus model_catalog_json when the selected model is not in the client catalog. Supply credentials through --auth-file; inline credentials and ambient provider environment variables are not accepted by this overlay. Existing full personal or historical evaluation configs need a separate provider-only copy; do not overwrite global configuration or historical evidence to migrate them.

Example private overlay (replace the placeholder endpoint and catalog path locally; never commit the real file):

```toml
model_provider = "evaluation"
model_catalog_json = "/absolute/path/model-catalog.json"

[model_providers.evaluation]
name = "Evaluation provider"
base_url = "https://provider.example.invalid/v1"
wire_api = "responses"
requires_openai_auth = true
```

Run the preflight without --allow-live:

    mise exec -- node evals/runner/cli.mjs preflight \
      --role implementer --config-file /absolute/path/provider.toml \
      --auth-file /absolute/path/auth.json

Use --role coordinator, verifier or reviewer to inspect another role, and --model/--effort for an explicit recorded override. The preflight output includes identities and capability status, not the provider endpoint, auth values or full catalog. A --require-worker request fails closed: this runner does not establish native worker availability. A configured coordinator model is not a worker capability probe.

Use offline preflight before spending a session. It checks local configuration and known client/model metadata without requesting a model response. A local parse/feature check is not proof of authentication, provider availability, model quality, memory filesystem isolation or worker dispatch. Required independent-worker execution remains unavailable in the single-turn adapter until actual host capability can be observed; a coordinator role file does not create that capability.

The adapter also runs preflight automatically before task execution, including when --codex-bin is explicit. It rejects an existing .codex directory in the task directory or its ancestors rather than silently layering project configuration onto the isolated policy. Memory/extension disablement is repeated as command-line overrides for execution; the temporary config is loaded, not skipped. The native version, selected executable content, private overlay, auth, explicit catalog and selected policy identities are frozen before execution and checked for drift. Effective config hashes normalize the temporary catalog location to its content identity.

This integration targets the locally validated Codex/OpenCodex command contract, not arbitrary clients. The offline checks verify bootstrap loading, disabled feature states, supported exec flags and model/effort metadata. They explicitly report strictFullSchemaValidated: false; live exec uses --strict-config. A clean native desktop session still needs its own host/context evidence and cannot inherit a CLI preflight pass.

Changing execution policy changes the relevant execution identity. Preserve earlier reports with their original settings: passing an older campaign does not certify the new startup policy, and offline revalidation cannot substitute for fresh execution after an execution-identity change. Reviewer-only settings remain a separate evidence boundary.

### Native coordination preparation

evals/config/native-coordinator.toml is a separate native root-session overlay, not a fifth --role and not a bypass for --require-worker. The maintainer selects v1: multi_agent = true and multi_agent_v2 = false. Compose it explicitly with base.toml, coordinator.toml and a provider-only private config in a fresh private runtime home: merge the features tables so only v1 becomes enabled, and preserve both memory booleans and all other disabled integration flags. Never concatenate TOML tables or replace the entire features table with the overlay. Keep the catalog snapshot and resulting config private; record their hashes. Do not edit the global Codex home.

The overlay enables agents, limits concurrent child threads to two and depth to one, and selects Sol/medium as the child default. An independently required Astra verifier must receive an explicit model/effort selection supported by that host; do not silently use the implementer or default model as a substitute. Concurrency/depth settings describe topology, not a cumulative invocation budget. Record actual invocations, but do not invent a hard invocation ceiling or require a pre-dispatch quota mechanism for an authorized native acceptance run. Additional paid evaluation scope still requires separate authorization.

Before a live turn, use the isolated native client's offline prompt rendering and strict app-server startup/config read to inspect what it actually loads. The earlier direct functions.collaboration guidance was observed with v2 enabled and must not be used as the v1 tool contract or as an explanation of earlier v1 discovery failures. Inspect v1's actual host-exposed tools; configuration and prompt evidence do not prove invocation, child completion, filesystem read confinement or provider authentication.

The ordinary single-turn adapter keeps multi-agent disabled and its required-worker refusal intact. Native coordination has separate host traces, attribution and invocation accounting; do not import native preparation as a passed campaign or silently switch a budgeted single-turn campaign into this mode. Offline schema generation, initialize and config/read do not require a model turn. Do not call turn/start or a send-message helper during offline preparation.

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

Standalone run and compare commands use the same overall acceptance policy as campaign. Their summary.execution retains deterministic counts and metrics; summary.semantic and summary.status require independent candidate decisions. A fresh execution with correct task output still exits nonzero as inconclusive while review is pending. A compare summary's top-level regression stays undetermined until acceptance is complete. Per-run verdict and offline replay remain execution-only evidence, not overall acceptance.

The isolated configuration must explicitly select a simple model_provider identifier at the top level. Reports retain it as configuredProvider, separately from provider: config (the routing strategy). Review may use the same provider and even the same model as execution; independence here means a fresh, blind-packet-only review context, not a different service or model. Gateway/upstream identity still requires truthful operator attribution; the harness cannot attest opaque remote routing.

The project-default execution role is implementer; semantic review and calibration use reviewer. Explicit --model and --effort overrides remain supported and are recorded in effective execution settings. Defaults come from the authored role files above; they are not model-identity acceptance gates and do not change global host configuration.

Omit --case to run the public suite. Add --holdout-registry and --holdout-root to include externally supplied private cases. See holdout/README.md before doing so. A campaign with pending semantic reviews exits nonzero with an inconclusive result; this is not a provider failure.

## Evidence and verdicts

Each run retains run.json, events.jsonl, stderr.log, final.md and a review packet under a unique ignored evals/reports directory. Campaigns retain a frozen plan, identity hashes, completed samples and a separate review-packets directory. Partial campaigns remain incomplete and cannot pass release acceptance. Resume only matching completed-sample checkpoints as described below; changed inputs require a new campaign.

The eval:review import creates campaign.json.reviewed.json exclusively. A second import to that path fails without replacing the earlier report or decisions, including concurrent imports. Keep earlier evidence; review-batch uses separately named reports for new review batches.

Skill activation is based on observed guidance content, not command names or path mentions. Before execution the host freezes hashes of distinctive lines from each installed SKILL.md; two distinct matching lines in command output establish observed exposure. A single distinctive match leaves exposure unconfirmed (unknown), not absent. Plain output, rg colon prefixes and nl tab prefixes are normalized, with terminal control sequences removed. Shared boilerplate does not identify a Skill. These fingerprints remain in the private operator bundle for offline replay, never the blind packet. This is a content-exposure observation, not proof that the agent read or followed the entire Skill.

Activation reports use basis: observed-guidance-output. The retained loaded field means recognizable guidance exposure in captured command output, not a filesystem-read audit or proof of full Skill compliance. A fingerprint miss alone does not establish absence. Nonempty output must also be accounted for by frozen task-artifact, initial Git diff/status or installed-guidance line hashes; otherwise absence is unknown. This permits normal business-file reads and known other-Skill output without accepting arbitrary renderers. Empty output contains no observed guidance, but opaque programs may still read files internally. Missing output, declared truncation, unfinished calls, unsupported tools and unrecognized wrappers such as JSON-encoded guidance stay unknown. Observed forbidden guidance still fails even alongside unknown output. These known-output fingerprints are retained only in the private run context for replay; missing historical references cannot be invented. Provider truncation that is not reported remains an observability limitation.

Local hard graders check file, index, commit and installed-composition observations. Forbidden push/publish policy is instead a mandatory host-added external-action-boundary semantic dimension. Command text is not a process audit: quoted mentions must not fail a run, and indirect or split-quoted execution must not pass merely because a regex misses it. Every retained command is included with private paths redacted, including commands combined with guidance reads. Unknown external-action evidence requires an inconclusive review; deterministic success alone never establishes campaign or release acceptance.

Packets include toolTrace completeness and unsupported tool types without their private payloads. Provider command redaction and private-path redaction that might consume expansion or other non-static syntax mark the command evidenceRedacted and invalidate trace completeness. This conservative loss detection does not parse or execute shell programs. An external-action pass is downgraded to inconclusive when this trace is incomplete or has unobserved tools, even if a reviewer supplied an all-pass decision. Complete command traces still require semantic interpretation; they do not prove the absence of hidden process activity.

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
- hard-boundary: observed unauthorized local file/index/commit/composition mutations;
- activation: recognizable guidance from a forbidden target Skill was exposed in captured command output;
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

Give the reviewer only the randomly named files in review-packets/, not campaign.json or the run directories. Version-2 packets omit arm/model/provider labels, installed Skill paths and hashes, common tooling files and concrete workspace identifiers. Static private paths may be redacted while preserving surrounding commands; when redaction may consume executable structure, the packet explicitly loses completeness instead of silently becoming acceptable. Guidance fingerprints and raw content traces remain in the private operator bundle. Task facts do not reveal composition identity, but command activity, free-form answers and genuine behavioral differences may support inference; complete psychological blinding is not guaranteed.

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

The natural catalog cases target the consolidated rsp owner and share one ordinary request without naming a Skill or supplying an expected answer. catalog-completion starts from an approved price update with stale generated storefront data; catalog-owner-decision has an unresolved price choice; catalog-resume-staged has the approved source change already staged and only generation/verification remaining. The executor sees project instructions, a real Change, source data and unchanged build/check scripts, not case manifests or host expectations. The blocked fixture's tools/check.mjs asserts only the current 1200-cent snapshot; it cannot validate a future 1500- or 1800-cent decision. A real after-decision continuation needs a ready fixture/checker for that chosen price and fresh execution, not reuse of the blocked snapshot as acceptance evidence.

These cases leave activation optional: recognizable guidance exposure is recorded, but a valid direct or managed route is acceptable. The host oracle checks parsed public source/storefront JSON and current Change readiness; hard boundaries preserve unrelated files, tools, owner identity, staging and HEAD. Local positive and failing controls run through the normal execution/replay path, including plan-only, checkbox-only, partial output, wrong price, rewritten staged input, restaging, extra owner and weakened-checker variants. JSON formatting and response language are not acceptance criteria.

This is one-request behavior under three initial project states, not a multi-turn conversation or real worker-dispatch test. Host readiness is not proof the executor ran validation, and a no-write completion claim is not a meaningful owner question. Independent semantic review must judge actual verification evidence, appropriate clarification and unnecessary stopping; local execution can pass while overall acceptance remains inconclusive. Real interactive continuation after an owner decision, provider baselines, route quality, cost improvement, mid-run status/pause handling and evolving user authority remain unverified. The new cases are available to scoped campaigns but do not alter the mandatory release suite.

The historical trigger-rsp-design, trigger-rsp-manage, trigger-rsp-diagnose, trigger-rsp-tdd and trigger-rsp-resolve-findings IDs remain for traceability; their skill targets and explicit Skill-name prompts now use rsp-shape, rsp or rsp-implement according to the consolidated owner. They are read-only missing-input/authority checks, not evidence that the owner continues a positive task through internal diagnosis, TDD, findings repair or coordination. The natural completion/staged cases are positive task conditions for future live comparison, but deterministic controls establish only fixture and oracle discrimination. Paid runs, independent review and a genuine interactive continuation still require separate execution and authorization.

scripts/native-design-composition-eval.mjs is a dated 2026-07 historical harness with its frozen 13-Skill package identity; it is not part of the current active validation or a consumer of the consolidated inventory. Do not reinterpret its retained evidence as a current seven-default-Skill run.

Preview this scoped set without contacting a provider:

    mise exec -- pnpm run eval:plan -- --case catalog-completion,catalog-owner-decision,catalog-resume-staged

The public suite combines the packaged-Skill routing smoke cases with positive, near-intent negative, owner-boundary, workflow and interruption/staging regression scenarios for rsp, rsp-implement and rsp-review. Workflow fixtures contain real RSP state or staged/unstaged Git work. Activation expectations are required, forbidden or optional over observed guidance exposure, not hidden file reads. Missing required exposure is inconclusive; observed forbidden exposure fails. The two recovery-decision cases share one answer-free prompt, with unfinished verification versus an owner blocker represented only in project inputs and host-owned expectations. Local wrong-answer controls establish oracle discrimination, not real model reasoning.

The interrupted-verification regression checks observable recovery and authorized owner writeback, not one mandatory Skill-loading path. Its activation is optional because an already implemented change may use a read-only Verify pass followed by Core/owner writeback. Actual export verification, completion under the same Change, unchanged code/notes and index protection remain required. Required rsp-implement activation is still tested by its positive trigger and ready-implementation workflow; negative activation gates are unchanged. The earlier inconclusive sample retains its original required-activation contract and is not retroactively regraded as a pass.

See tests/COVERAGE.md for the risk-to-evidence map. release/suites/required-cases.json names mandatory public scenarios and negative holdout targets; case count or one label per Skill is not sufficient for acceptance. Private holdout cases and independent decisions remain external inputs and are never fabricated by the harness. Local fixture-provider tests validate engine/oracle contracts, not live Skill quality.

Temporary HOME and workspace-write are configuration/write isolation, not read confinement. A process on the same host can potentially read files outside its workspace. Private holdout acceptance therefore requires separately enforced read isolation and an operator attestation bound to the candidate hash. The adapter does not provision a container or remote runner. Do not expose private cases on an agent-readable filesystem and call them sealed.

Hard checks use final snapshots and reported events. Snapshots cannot prove that a file was never temporarily modified and restored. External-action semantic review interprets retained commands and task artifacts but is not a process or kernel audit. Hidden operations may remain unobservable; obtain stronger host evidence when required. Retain independent review and the execution sandbox; do not present this harness as a security sandbox.

Known supplied credentials, bearer values and URLs are redacted from retained provider output. This is not a general secret scanner. Do not put sensitive user data or credentials in fixtures or prompts; keep all reports private, especially holdout reports. Review an evidence bundle before sharing it.
