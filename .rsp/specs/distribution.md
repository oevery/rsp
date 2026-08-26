# Distribution

## Purpose

Define package contents, Skill installation, release boundaries, provenance, and the separation between product distribution and maintainer research.

## Current facts

- Bundled package sources are authored under `rules/` and `skills/`. `.agents/skills/` contains repository-local projections and maintainer-only capabilities.
- Package installation validates package-owned files, preserves unrelated Skills, reports conflicts, and grants no workflow, lifecycle, Git, publication, or external authority.
- Release checks bind the candidate version, package inventory, Skill composition, contract identity, fixtures, and required verification evidence. Publication remains separately authorized.
- Release and evaluation reports retain sanitized evidence and provenance. Disposable caches, provider sessions, credentials, raw events, and workspace paths remain outside tracked product artifacts.
- `research/upstreams/` stores immutable source distillations. `research/models/` stores cross-source synthesis and recommendations. `research/evaluations/` stores evaluation evidence.
- Research is maintainer-only and is not a runtime dependency or product authority. A recommendation enters product artifacts only through a selected RSP Change with an identified owner and adoption mode.
- An adopted current behavior belongs in the smallest relevant Spec. A lasting rationale belongs in one Decision Record. Research history remains research history.

## Boundaries

- Distribution owns package inventory, installation, release checks, and provenance.
- Maintainer research owns source comparison, synthesis, evaluation, and candidate recommendations.
- Product runtime and published Skills do not import research or upstream caches.

## Constraints

- Never execute cached upstream code as product behavior or overwrite tracked research automatically.
- Do not promote research recommendations automatically through acceptance, packaging, release, or evaluation success.
- Keep publication, remote delivery, deployment, approval, and human acceptance separately authorized.
