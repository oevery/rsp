# Ink TUI package and startup evidence

This retained measurement compares the completed `add-ink-tui-dashboard` package with baseline commit `8d351c2` on the same macOS arm64 host and Node.js v24.18.0.

The complete chain is replayable with `node scripts/package-evidence.mjs --baseline-ref 8d351c270b1116e9d1b2929208ee898cd7f7e998 --output research/evaluations/rsp-package-footprint/2026-07-23/ink-tui-dashboard/measurement.json`. The orchestrator creates an independent baseline worktree, installs and builds both source trees, packs both artifacts, installs each exact tarball with production dependencies only and lifecycle scripts disabled, measures logical bytes, invokes each installed `node_modules/@oevery/rsp/bin/rsp.mjs` for the startup comparison, invokes the installed candidate CLI through the PTY lifecycle check, and removes all transient worktrees and directories in a `finally` path.

- Packed size: 87,382 B baseline; 94,922 B candidate; +7,540 B. Candidate is below 512 KiB.
- Installed logical size: 1,061,309 B / 272 files baseline; 8,709,088 B / 4,905 files candidate; +7,647,779 B / +4,633 files. The size delta is below 15 MiB.
- Warm-cache startup median: 32.545 ms baseline; 33.040 ms candidate; +0.495 ms. The allowed regression was the greater of 25 ms or 20%, therefore 25 ms.
- Baseline lockfile SHA-256: `7b65d76a6212d78fede55c5b8d4ee9469bf4e327d19653c80d84b27a3a06d05f`.
- Candidate lockfile SHA-256: `d34703da216a5d659a139872c52adf8234d2acb052794888116bbd3f84d333c6`.
- Baseline tarball SHA-256: `e621a85f78fa9ceaa5d91c08a697c8b5dcf5cd160f0e2a6611e7bbf8ef72444d`.
- Candidate tarball SHA-256: `42bbf81006eace778d4ad1b880c30134eeece52aaa85d01033d64ad2df2bb2d8`.
- Installed candidate PTY lifecycle: `q`, contextual `Esc`, raw `Ctrl-C`, `SIGINT`, `SIGTERM`, and `SIGHUP` all restored terminal attributes and alternate-screen state with exit codes 0, 0, 0, 130, 143, and 129 respectively.

`measurement.json` retains the exact commands, transient source/tarball/installed-bin paths from the completed run, both tarball and lockfile hashes, logical-byte counts, startup samples, PTY observations, runtime, OS release, architecture, and tool versions. Node.js 22 and Node.js 24 clean-install execution are separate compatibility gates and are not inferred from this Node.js 24 same-host comparison.

Node.js 22 compatibility was verified separately with the temporary runtime acquired by `npx -y -p node@22`. The runtime reported Node.js v22.23.1 on macOS arm64. The exact verification commands and results are retained in `node22-clean-install.json`; the Node 22 `process.execPath` ran npm 11.16.0 through its `npm-cli.js`, every installed CLI smoke, and the logical-byte footprint measurement. It built and installed the exact candidate tarball SHA-256 `42bbf81006eace778d4ad1b880c30134eeece52aaa85d01033d64ad2df2bb2d8`, measured 8,709,071 installed logical bytes across 4,905 files, then passed installed help, initialized-project status JSON, concise non-TTY `rsp ui` failure, and concise unsupported-locale failure.
