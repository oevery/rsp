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
- [x] Frozen Node and Python installation — lock reproducibility.
- [x] `pnpm audit --json` — classify residual alerts; zero advisories is not required.
- [x] Build, typecheck, lint and code regression checks.
- [x] Viewer browser and installed-package checks.
- [x] Documentation build and Wrangler deployment dry run without upload.
- [x] Release CLI loading and native evaluation schema checks.
- [x] Change consistency.
- [x] Review the affected dependency paths and final compatibility evidence.
### Conclusions
- Evidence covers the dependency candidate committed as `4313f48c`; record cleanup reuses that coverage.
- The recorded Node audit retains seven accepted tooling advisories: three high, two moderate and two low; reassess when their inputs or uses change.
- basic-ftp retains upstream 5.x: FTP listing parsing is not configured by repository release settings, but external proxy use was not exhaustively inspected or exercised.
- ESLint tooling's KaTeX 0.16 risk requires existing prototype pollution; viewer Mermaid uses the separate patched 0.18.10 branch.
- Minimatch retains upstream 10.x despite malicious-glob exhaustion risk in lint and Panda/ts-morph tooling.
- Panda's Browserslist accepts untrusted-statistics/distinct-query risks; the viewer build uses esbuild and Tailwind.
- Panda's postcss-selector-parser retains attacker-controlled selector exhaustion risk with upstream resolution.
- Unchanged DocSearch 3.8.2 excludes React 19 in its peer ranges; the documentation build passed.
- Actual publication, PR #8 disposition and GitHub alert rescanning remain outside this verified local delivery.
- Offline schema checks alone do not establish live model acceptance.

## Blockers
None
