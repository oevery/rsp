# rsp

<!-- rsp:begin -->
## RSP Entry

RSP tracks current work, stable specs, and archives under `.rsp/`.

Read in order:
1. Nearest `AGENTS.md` for project or module instructions.
2. Root `CONTEXT.md` if present, then the relevant nearest `CONTEXT.md` for domain language, relationships, and navigation. If a legacy `CONTEXT-MAP.md` remains, retain its relevant context and use Core's context-migration branch (or the fallback); discovery alone does not authorize migration.
3. Use the project `rsp` Skill at `.agents/skills/rsp/SKILL.md`; hosts may load it through Skill discovery or read it directly. Only when it is absent or cannot be used, read `.rsp/rsp-rules.md` as the fallback protocol.
4. `.rsp/focus.d/`; marker paths form the open-work candidate set, while optional bounded Markdown content is recovery guidance only. For grouped work read the sibling Group Brief, then the explicitly selected child Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If `.rsp/focus.d/` is empty or has several candidates, use an explicit WorkRef, the user's mentioned Change, or current status/dependency evidence to resolve the default action.
Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.
<!-- rsp:end -->

## Project Development

- `mise.toml` declares the maintainer Node, pnpm, Python and uv version ranges. Run repository tools through `mise exec --`; uv uses the mise Python without downloading a second interpreter. Dependency versions remain in pnpm-lock.yaml and tests/skills/uv.lock. The evaluation image builder resolves installed runtime versions through mise; Docker/Compose are host prerequisites.
- Bundled assets in the repository root are the authored package sources.
- Edit `rules/rsp-rules.md`, build the CLI, then run `node dist/cli.mjs update` to sync the self-hosted `.rsp/rsp-rules.md` fallback.
- Required implementation coverage uses `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test`. Reuse traceable passing results while their relevant inputs and tested boundary remain unchanged; run only missing or invalidated coverage. For document/Skill-only changes, use affected package, resource, document and offline case checks rather than repeat unaffected code checks. Explicit execution or independent-acceptance requirements still apply.
- Keep observable CLI, packaging and maintenance-tool regression tests under `tests/code/`; evaluate Skill behavior with native Harbor 0.24.0 tasks/jobs and harbor-rewardkit 0.2.2 under `tests/skills/`. Install the locked environment with `uv sync --project tests/skills --frozen`; run offline native task schema checks with `uv run --project tests/skills python tests/skills/evaluate.py check`. Package release aggregates local checks and only this offline Skill check; never start paid model calls automatically. Native `jobs/default.yaml` owns agent skills and job settings; follow `tests/skills/README.md` for separately authorized execution, calibration, resume and regrade. Keep private run evidence under ignored `tests/skills/reports/` and selected research conclusions in time-named Markdown under `research/reports/`. Never reinterpret historical verdicts as current acceptance.
- Keep tests focused on observable behavior and public command output rather than duplicated generated content or Skill prose fragments.

## Project Skill Dogfooding

- Use the repository-discovered `rsp`, `rsp-shape`, `rsp-implement`, `rsp-doc`, `rsp-verify`, `rsp-review`, and `rsp-commit` Skills for matching work in this checkout. Shape owns bounded read-only design; Implement owns diagnosis, justified test-first work, and authorized fixed-finding corrections. `rsp-structural-audit` stays optional and report-only. Core selects conditional coordination only for a real obligation, not ordinary single-owner continuity. This self-host keeps `.rsp/config.yaml` Manage activation and closeout keys, values, and defaults: only a qualified and selected coordination branch may use the existing limited local lifecycle/Git closeout ceiling after fresh gates, subject to nearer denial; ordinary flow gains none. Configuration never grants planning, product-mutation, remote, publication, approval, or human-acceptance authority.
- These entries are live projections of the authored package sources under `skills/`; edit the authored source, not `.agents/skills/`.
- Default `rsp-doc` owns repository-document, Skill and release writing through conditional artifact methods. `rsp-review` remains read-only, including release-document checks; both apply the writing-quality contract with standalone guidance.
- Maintainer `author-rsp-skills` adds local Change, provenance and evaluation requirements to Doc's Skill method; these requirements do not apply to ordinary project Skills.
- Treat host metadata limits as hard constraints, but do not use Skill body or reference word-count ceilings as correctness gates. Review concision semantically: remove duplication and unnecessary prose without losing trigger, authority, action, stop, return, or conditional-loading behavior.
- Keep overlapping global engineering workflow Skills disabled in the maintainer environment while dogfooding so RSP capability gaps remain visible. Codex currently supports Skill disablement in user config, not project `.codex/config.toml`; do not add a misleading project-local disable list.

## Maintainer Research

For upstream preparation, source distillation, or cross-source model synthesis, load the repo-local `distill-upstream` skill. Keep research under `research/`; promote selected recommendations through a normal RSP change.
