# Local validation and release acceptance

The release runner consumes evidence; it never launches a provider, publishes, approves a release or updates the version.

- pnpm run release:acceptance runs local build, Skill package structure and security, documentation, typecheck, lint, deterministic tests, case schema/oracle checks and package contents. Its mode is local-validation. Local success does not imply releaseReady.
- pnpm run release:candidate-check runs those same checks and requires a reviewed OpenCodex campaign through RSP_CAMPAIGN_REPORT. Missing or inconclusive provider evidence exits nonzero.
- prepublishOnly uses the candidate gate, so package publication cannot silently fall back to schema-only acceptance.
- pnpm run release:package-check checks tarball contents, installs that tarball into a clean temporary consumer with lifecycle scripts disabled, and exercises the installed CLI and project/Skill refresh. tests/, evals/ and release/ must remain outside the package. No repository dependency or global installation is changed.

Clean installation defaults to offline mode using the ignored .cache/rsp-package-install cache. On a machine without the required cached dependencies, explicitly permit downloads once:

    RSP_INSTALL_ALLOW_NETWORK=1 mise exec -- pnpm run release:package-check

Subsequent local validation can use the populated cache. Failure to obtain dependencies is a verification limitation, not permission to skip installation checks. Reports record dependency mode and the resolved consumer lockfile hash. Project update tests cover stale managed files and user-owned content; they are not a historical-version compatibility matrix.

For an independently accepted evidence bundle:

    RSP_CAMPAIGN_REPORT=/absolute/path/campaign.json.reviewed.json \
      mise exec -- pnpm run release:candidate-check

The gate checks current source, Skill composition and execution hashes; frozen case identities; unique paired baseline/candidate runs; at least two repetitions; public and holdout coverage for every packaged Skill; holdout authorship/freeze/isolation attestations; retained execution artifacts; candidate hard/task results; and complete independent semantic decisions. If deterministic grading has changed, it requires current offline revalidation receipts bound to the original plan and evidence. Infrastructure, harness and missing-evidence outcomes invalidate acceptance. It recomputes policy rather than trusting a report's cached summary.

The frozen suite hash binds release/suites/required-cases.json. All named public scenarios must be present, each packaged Skill needs positive private coverage, and the three pilot Skills additionally need negative holdout activation cases. Version-2 run evidence, activation results and blind packets are required. Older smoke reports cannot satisfy this contract merely by changing their summary.

Activation measures observed guidance exposure in captured outputs, not every filesystem read. External push/publish policy requires the host-added external-action-boundary semantic dimension; local hard graders do not classify shell programs by regex. Observer and packet changes alter execution identity, so reports made before these corrections cannot be upgraded by editing a verdict or replaying deterministic graders alone.

Keep the original campaign directory and per-run artifacts together with the reviewed or revalidated report. Copying just the reviewed JSON is insufficient. A changed source, package manifest, lockfile, Skill, public case or execution mechanism requires fresh execution. Review defaults do not invalidate execution; deterministic grader changes require the offline revalidate command documented in evals/README.md. Legacy reports without split execution/grading identities remain historical, not retroactively upgraded. Do not edit report fields to turn an incomplete campaign green.

Semantic independence means a fresh, blind-packet-only context, not different providers or models. Same-provider and same-model reviews are accepted with truthful reviewContext declarations; missing declarations fail closed even if the cached semantic summary says passed. See evals/README.md for the decision format and the default sol/medium execution and astra review roles.

Reports and attestations are trusted operator inputs, not signed remote attestations. Context isolation is operator-attested, not proven by JSON validation. The gate is a consistency and completeness check, not an authentication mechanism. A passing report does not grant publication authority.

Source identity includes the actual dist/ artifacts and tsup.config.ts/tsconfig.json. The release runner builds before checking evidence, so a report made against a stale or different build cannot pass merely because source files match. Every retained run must match the campaign's source/build identity; older reports lacking it remain historical.
