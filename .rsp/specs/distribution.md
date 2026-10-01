# Distribution

## Purpose

Define package contents, Skill installation, release boundaries, provenance, and the separation between product distribution and maintainer research.

## Current facts

- Bundled package sources are authored under `rules/` and `skills/`. `.agents/skills/` contains repository-local projections and maintainer-only capabilities.
- The current source candidate's eight default Skill identities and their responsibilities are owned by [Skill](./skill.md); this does not assert a released package version or completed behavioral acceptance.
- Package installation validates package-owned files, preserves unrelated and unknown Skills, and reports differing selected trees or recognized obsolete package-owned identities before mutation. Preview with `--dry-run`; replacing or removing recognized targets requires explicit `--force` and rollback on activation failure. User-customized trees require inspection and preservation before force; silent upgrade safety is not implied. Installation grants no workflow, lifecycle, Git, publication, or external authority.
- Verification has two lanes: observable CLI/package/runner code tests in `tests/code/`, and task-based Skill validation in `tests/skills/`. Projects, cases, suites and one shared executor/judge configuration serve both individual capabilities and natural workflows. Release only aggregates these checks; baseline pairing and holdout are optional research designs, not universal release gates. Publication remains separately authorized.
- Skill acceptance evaluates actual outcomes, mutation/authority boundaries and independent semantic review, never Skill wording or printed-reading fingerprints. Offline schema, project readiness and local adapter results cannot establish model acceptance. Source, dependency, composition, case and effective configuration identities accompany retained execution evidence; old failures are not relabelled by new harness checks.
- Private execution evidence belongs under ignored `tests/skills/reports/`; its `legacy/` subtree retains selected evidence, exact disposition/recovery mappings and verification receipts, not permanent full cache backups. Preserve selected original bytes and historical verdicts. Clearly distinguish retained blob recovery, fixed-history Git recovery and authorized permanent disposal; restoring files does not certify replay compatibility. Raw events, provider sessions and credentials stay outside tracked artifacts.
- `research/upstreams/` stores immutable source distillations. `research/models/` stores cross-source synthesis and recommendations. `research/evaluations/` retains readable conclusions, necessary metadata and minimal reference evidence; unused runners, duplicate fixtures and raw transcripts are recoverable from private bundles or their exact Git revision instead of remaining active research inputs.
- Regenerable cache and unique evidence have different lifecycles. Preserve cache with an active consumer, including pinned upstream inputs and offline package-install dependencies. Retire other work copies only after read-only occupancy/worktree checks and verified preservation of selected unique evidence, including recovery sampling. Before discarding full safety backups, verify every retention/disposal mapping and disclose irreversible losses; name, size or dirty status alone does not establish value. Ambiguous or occupied targets remain in place.
- Research is maintainer-only and is not a runtime dependency or product authority. A recommendation enters product artifacts only through a selected RSP Change with an identified owner and adoption mode.
- Managed Git distillation retains pinned revision evidence; advancing its accepted baseline requires separate authorization. Targeted web snapshots retain dates, URLs, content hashes, source locations, retrieval gaps and reuse limits, with facts distinct from inference. They are not Git revisions, require no managed registry entry and do not advance a managed baseline.
- An adopted current behavior belongs in the smallest relevant Spec. A lasting rationale belongs in one Decision Record. Research history remains research history.

## Boundaries

- Distribution owns package inventory, installation, release checks, and provenance.
- Maintainer research owns source comparison, synthesis, evaluation, and candidate recommendations.
- Product runtime and published Skills do not import research or upstream caches.

## Constraints

- Never execute cached upstream code as product behavior or overwrite tracked research automatically.
- Do not promote research recommendations automatically through acceptance, packaging, release, or evaluation success.
- Keep publication, remote delivery, deployment, approval, and human acceptance separately authorized.
