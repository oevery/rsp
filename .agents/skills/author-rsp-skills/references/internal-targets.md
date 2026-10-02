# Internal evaluation targets

Use for maintainer-only packages excluded from the published `skills/` inventory. Security scans `<root>/skills`; behavioral `run` defaults to `skills/`. Passing `.agents/skills/` as a composition is invalid because it contains linked product projections. Metadata/resource checks may inspect real authored directories directly.

## Prepare the selected composition

Run the repo-local `scripts/prepare-internal-targets.mjs` from its original checkout with existing dependencies. Package directory arguments resolve from the working directory; select only packages needed by the experiment. For example, from the repository root:

```sh
node scripts/prepare-internal-targets.mjs .agents/skills/author-rsp-skills .agents/skills/distill-upstream .agents/skills/release-acceptance
```

The helper prechecks all inputs, rejects links, special files and duplicate package names, then creates a unique temporary `root/skills`. It preserves sources and verifies copied bytes, executable bits and the selected package list. Success returns JSON `root`, `composition`, `identity` and actual `fileCount`. Failure exits nonzero without a success identity; stderr identifies any temporary root left after allocation. There is no overwrite or source-deletion option.

Retain the printed paths and identity with the evidence. Recreate the snapshot after source edits. On helper failure, inspect any reported temporary root and source effects before a permitted rerun; do not invent a success identity or reuse an unverified partial copy. Keep copies until their evidence consumers finish, then remove only the exact disposable directory under applicable cleanup authority. Run root maintenance tools from the repository, not the prepared packages. Package security coverage excludes those root tools; their behavior is verified by code tests and lint.

## Bind checks and preserve gaps

- Run `node scripts/skill-security-preflight.mjs --root <printed-root> --json`. Confirm `scanned_files` equals `fileCount` and inspect every finding. A failed scan remains a failure; do not inherit unrelated product suppressions or relax detection.
- For separately authorized model execution, use existing `test:skills run` with `--composition <printed-composition>`, an explicit `--case`, and the live permission, private configuration and session budget documented in `tests/skills/README.md`. Bind reports to the printed identity.
- Inspect the case's task, permitted writes, oracle and project/tool fixtures before execution. Internal Skills may need repository tools, research inputs or other selected Skills that product fixtures lack. Missing applicable cases or fixtures mean internal behavior is uncovered; do not substitute a default product suite. Add coverage only within authorized scope using the existing runner.
- Offline `plan/check` checks case/project readiness, not the supplied composition or internal tool closure. Identity and security establish only the static target, not task execution, discovery or independent model judgment.
