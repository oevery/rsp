# Maintainer guide

Run repository commands through `mise exec --`. The [test guide](https://github.com/oevery/rsp/blob/main/tests/README.md) owns tool setup, offline caches and code, package and Skill verification. Installation and publication use the identity in `package.json`; maintainer tooling does not change the consumer Node.js requirement.

## Checks and workflow entries

`.github/xova.json` declares commands, installation and Cloudflare settings once. The three event workflows call Xova Actions through five references pinned to one full toolkit SHA whose remote CI has passed. RSP owns its CLI, installed-package, Skill-resource, security, documentation and offline native task checks. The toolkit owns source guards, packing/publication, documentation artifacts and recovery orchestration.

| Entry | Trigger | Behavior |
| --- | --- | --- |
| CI | Main push, pull request or manual run | Run independent code/docs jobs at the same SHA. Ordinary docs-only code checks use lint and workflow wiring tests; docs always checks/builds the site and saves its artifact. No publication or deployment. |
| Publish | Published GitHub Release or manual run at an existing tag | Run all product checks on the final tagged source, then build documentation and verify/publish one tarball. |
| Recover documentation | Manual run at a confirmed stable release tag | Rebuild the confirmed published source and recover Cloudflare documentation without publishing npm. |

`release:check` builds the CLI, checks types and lint, runs code/package tests, validates native task schemas, scans Skill security and checks documentation. Schema validation is offline: it starts no containers, agents or judges. CI explicitly permits network access for temporary npm installation consumers through `RSP_INSTALL_ALLOW_NETWORK=1`; local checks use the offline cache by default. This flag grants no model-execution or publication authority.

setup.cache selects pnpm/npm download caches keyed by pnpm-lock.yaml and uv downloads keyed by tests/skills/uv.lock. docs.cache selects only pnpm. Locked installation and checks still run on hits and misses. Package consumers accept an explicit npm_config_cache or NPM_CONFIG_CACHE; without either they retain .cache/rsp-package-install. No consumer installation, virtual environment, test result or release receipt is reused as candidate acceptance.

Useful local checks after installing locked dependencies:

```sh
mise exec -- pnpm release:check
mise exec -- pnpm docs:build
mise exec -- pnpm test:pack
```

`test:pack` requires built CLI artifacts. It packs once with npm when `TARBALL` is absent. When supplied an absolute `TARBALL` path, it consumes that archive directly and checks shipped files, installed CLI behavior, Skill resources, customization protection and project updates. It never repacks that candidate. After lockfile changes, also validate a frozen installation and checks in a fresh checkout; an existing `node_modules` can conceal an incomplete dependency graph.

A subprocess timeout or signal termination fails package verification, including commands expected to reject invalid input.

## Final candidates and publication

Prepare the intended package version, release notes and any required migration material before tagging. A candidate may include necessary code and documentation; it need not be a version-only commit. Ordinary CI optimization, a release commit title or successful parent CI never exempts the final candidate from product checks.

Publish passes the checked source SHA to the shared release workflow. Its source guards bind the native event, tag, package version, repository and checked commit. After successful checks on that exact SHA, the publisher runs `pnpm build` and packs with npm lifecycle scripts disabled. It passes the absolute archive path to `test:pack`, rechecks source and tarball bytes, then publishes those same bytes through the locked release-it 21.1.1 npm publisher. The shared publication configuration disables project hooks and Git/GitHub/GitLab delivery; `prepublishOnly` remains a separate guard for ordinary manual npm publication. Product checks are not repeated through package lifecycle hooks in the shared flow.

Configure npm Trusted Publishing for repository `oevery/rsp`, workflow `publish.yml` and environment `npm-publish`. Keep `package.json.repository` consistent with that identity. Configure the `npm-publish` and `docs-production` environments with suitable approval and `v*` tag restrictions. Cloudflare deployment needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, supplied by the documentation environment or the repository secrets forwarded by the thin entries. Code and documentation checks receive neither deployment credentials nor write permissions.

Only stable GitHub Release events request documentation deployment after npm succeeds. Manual publication does not deploy. Publication and recovery share the `docs-production` environment, concurrency group and `latest-stable` policy, evaluated inside the deployment gate. The existing `wrangler.jsonc` selects the Worker and asset directory. The local `docs:deploy` command remains a direct maintainer deployment entry and requires separate authorization.

## Recover after npm succeeds

The shared publisher writes its summary and `publication-result.json` artifact only after npm confirms publication. They identify the source SHA, release tag, version and tarball SHA-256. If artifact recording fails after npm succeeds, inspect the npm job, registry and provenance before taking further action; a missing artifact does not justify publishing again.

If only documentation failed, confirm the npm version and source, then dispatch `docs-recover.yml` at that same stable release tag with `release-tag` and its exact `published-sha`. The source must contain these workflows and `.github/xova.json`. Recovery uses the same documentation check/build path, restores a verified artifact and applies the same latest-stable deployment policy. It has no npm publication path or npm OIDC permission. Retain the successful publication evidence and failed deployment record.

Local checks and toolkit CI establish only their tested boundaries. Consumer-hosted CI, npm OIDC, publication and Cloudflare recovery/deployment require their own evidence and authorization.
