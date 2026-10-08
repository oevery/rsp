# Internal evaluation targets

Use for maintainer-only packages excluded from published `skills/`. Security scans `<root>/skills`; native Harbor jobs receive explicit package paths through `agents[].skills`. `.agents/skills/` contains linked product projections and is not a link-free prepared target. Metadata/resource checks may inspect real authored directories directly.

## Prepare selected packages

Run the helper from the original checkout with installed dependencies. Arguments resolve from the working directory; select only packages needed by the experiment:

```sh
node scripts/prepare-internal-targets.mjs .agents/skills/author-rsp-skills .agents/skills/distill-upstream .agents/skills/release-acceptance
```

The helper validates inputs before allocating a destination, rejects links, special files and duplicate names, and copies packages into a unique temporary `root/skills`. Ordinary directory enumeration counts files; copied packages are validated again. Success prints JSON `root`, `composition`, `skills` and `fileCount`, without identities or per-file hashes. Copying preserves file content and executable bits; it does not attest source immutability during concurrent edits. Failure exits nonzero; stderr identifies any temporary root left after allocation. There is no overwrite or source-deletion option.

Retain printed paths and package names with the experiment source and native job configuration. Recreate prepared packages after source edits. On failure inspect any retained root and source effects before rerunning; do not use a partial copy. Keep copies until consumers finish, then remove only the exact disposable directory under applicable cleanup authority. Run root maintenance tools from the repository; those tools retain separate code-test and lint coverage.

## Bind checks and preserve gaps

- Run `node scripts/skill-security-preflight.mjs --root <printed-root> --json`. Confirm `scanned_files` equals `fileCount` and inspect every finding. Do not inherit unrelated suppressions or relax detection.
- For separately authorized execution, place each selected `<printed-composition>/<skill-name>` in the native job `agents[].skills`. `tests/skills/jobs/default.yaml` owns standard selection; repeat `evaluate.py run --skill <package-path>` to replace that selection for an experiment. The wrapper copies selected packages into job inputs and records their paths in native configuration. Follow `tests/skills/README.md` for task selection, image setup and runtime routing. No composition alias or hash identity is required.
- Inspect each native task instruction, environment and verifier. Internal Skills may require repository tools, research inputs or other packages absent from the task. Missing fixtures mean uncovered behavior; do not substitute unrelated product tasks or infer coverage from successful installation.
- `evaluate.py check` validates task schemas only. Package checks, file counts and security scans do not prove execution, natural discovery, internal tool closure or independent semantic judgment.
