---
kind: "fix"
summary: "Refresh direct tooling dependencies and vulnerable transitive resolutions while preserving product and evaluation behavior."
---

# Change: dependency-security-refresh

## Proposal
Refresh dependencies across the Node product/toolchain and Python evaluation
environment, preferring compatible upstream resolutions over forced overrides.
Retain security exceptions where their benefit justifies compatibility costs;
accept bounded tooling alerts rather than require a zero-advisory graph. Incorporate the
filelock update proposed by Dependabot PR #8 alongside the remaining applicable
alerts. Preserve runtime, viewer, documentation and offline evaluation behavior.
Scope is dependency resolution and necessary compatibility corrections, without
new direct libraries, unrelated major migrations, paid evaluations or automatic release.
Remote PR merge/closure and dismissal of alerts require separate delivery authority.

## Spec
### MODIFIED
- Requirement: Verified dependency resolution
  - Resolve alerts through compatible direct upgrades where available, retain
    justified overrides and document residual advisory conditions while preserving the CLI, viewer and
    distribution contracts in `.rsp/specs/cli.md` and `.rsp/specs/distribution.md`.

### Acceptance
#### Scenario: Install and use the repaired dependency graph
- GIVEN the updated Node and Python locks
- WHEN installing with frozen locks and running the existing product checks
- THEN installation, CLI/viewer behavior, documentation builds and offline
  evaluation checks succeed, with remaining security alerts explicitly assessed.

## Design
Compare alerts with actual locked versions before updating. Certifi is already
2026.10.19, outside the reported vulnerable range; retain it. Update filelock to
the PR's fixed version through uv rather than merging a stale lock wholesale.
Prefer compatible direct dependency upgrades and normal lock resolution before
adding overrides. Refresh ESLint, Vitest, release-it, Wrangler and the paired
Tailwind packages. Remove the Undici override now resolved upstream. Vitest 5.1
accepts Vite 6 as a peer, and pnpm now shares the patched VitePress resolution;
remove the unused Vite 8 override and its separate dependency branch.
Keep Wrangler at 4.157.0 to avoid the release-age exceptions generated for
4.158.0 and its Miniflare dependency. Retain only the VitePress-to-Vite 6.4.5
exception and the PostCSS patch override for source-map file disclosure.
VitePress stays at stable 1.6.4; do not migrate to 2.x alpha for dependency cleanup.
Restore upstream ranges for basic-ftp, KaTeX, Minimatch, Browserslist and
postcss-selector-parser. Their remaining advisory conditions and tradeoffs are
recorded under Verify; absence of a demonstrated exploit is not proof of safety.
Keep Harbor, rewardkit, TypeScript and the Node 22 type baseline fixed.

## Tasks
- [x] Reconcile repository alerts, current locks and the dependency PR.
- [x] Update affected dependency branches and verify frozen installation.
- [x] Validate affected product/toolchain behavior and review the final diff.

## Verify
### Required
- Automated:
  - [x] Fresh frozen Node and Python installation — lock reproducibility.
  - [x] `mise exec -- pnpm audit --json` — classify residual alerts; zero advisories is not required.
  - [x] `mise exec -- pnpm run build` — complete runtime and assets.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint` — API and lint-tool compatibility.
  - [x] `mise exec -- pnpm run test` — code and build/lifecycle regressions.
  - [x] `mise exec -- pnpm run test:viewer:browser` — rendered viewer and Mermaid behavior.
  - [x] `mise exec -- pnpm run test:pack` — installed package behavior.
  - [x] `mise exec -- pnpm run docs:build` — documentation toolchain compatibility.
  - [x] `mise exec -- uv run --frozen --project tests/skills python tests/skills/evaluate.py check` — offline evaluation schemas.
  - [x] `mise exec -- node dist/cli.mjs check dependency-security-refresh` — Change consistency.
- [x] Review the affected dependency paths and final compatibility evidence.

Residual Node audit: seven advisories (three high, two moderate, two low) in
five tooling packages. These remain accepted maintenance risks under the
requested override reduction, not fixed vulnerabilities or proven-unreachable
code. Reassess if the following inputs or uses change:

| Package | Exposure and retained tradeoff |
| --- | --- |
| basic-ftp | release-it's proxy/PAC dependency chain; the advisory requires FTP directory-list parsing. Repository release configuration does not configure that use, but external proxy settings were not exhaustively inspected. Restore the upstream 5.x API rather than force 6.x. |
| KaTeX | The affected 0.16 branch belongs to ESLint Markdown tooling and requires existing prototype pollution. Viewer Mermaid retains its separate patched 0.18.10 branch. |
| Minimatch | Repository lint and Panda/ts-morph tooling; malicious glob patterns can exhaust resources. Accept this tooling-input risk rather than force consumers of 10.x onto 11.x. |
| Browserslist | Panda CSS tooling; untrusted custom statistics or growing distinct queries can trigger the advisories. The viewer build uses esbuild and Tailwind, not a Panda CLI. |
| postcss-selector-parser | Panda CSS's selector-processing dependencies; attacker-controlled selectors can exhaust resources. Accept the build-input risk while retaining upstream resolution. |

Additional tooling checks: `mise exec -- pnpm exec wrangler deploy --dry-run`
validated the generated documentation assets without uploading;
`mise exec -- pnpm exec release-it --version` loaded the updated release CLI.
Actual publication and FTP proxy behavior were not exercised.

Residual alerts are expected to remain open; PR #8 disposition and closure of
fixed alerts remain unverified until delivery and GitHub rescanning.
Existing DocSearch 3.8.2 peer ranges exclude React 19; those
packages are unchanged and documentation builds pass. Offline schema checks do
not establish live model acceptance.
Python frozen-install and offline-schema evidence is reused because its lock
and evaluation inputs have not changed during the direct Node tooling refresh.

## Blockers
None
