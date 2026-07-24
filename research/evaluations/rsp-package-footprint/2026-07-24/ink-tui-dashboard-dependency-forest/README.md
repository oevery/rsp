# Ink TUI dependency-forest package evidence

This retained measurement compares the completed `add-ink-tui-dashboard` dependency-forest and localization refinement with baseline commit `8d351c2` on the same macOS arm64 host and Node.js v24.18.0.

The complete chain is replayable with `node scripts/package-evidence.mjs --baseline-ref 8d351c2 --output research/evaluations/rsp-package-footprint/2026-07-24/ink-tui-dashboard-dependency-forest/measurement.json`. It builds, packs, and production-installs both source trees, measures logical bytes, benchmarks each installed CLI, runs the installed candidate through the PTY lifecycle gate, and removes transient worktrees and directories.

- Packed size: 87,382 B baseline; 95,630 B candidate; +8,248 B. Candidate is below 512 KiB.
- Installed logical size: 1,061,309 B / 272 files baseline; 8,712,238 B / 4,905 files candidate; +7,650,929 B / +4,633 files. The size delta is below 15 MiB.
- Warm-cache startup median: 34.969 ms baseline; 35.030 ms candidate; +0.061 ms against a 25 ms allowed regression.
- Candidate tarball SHA-256: `860fc21614991227c495acab30d35cd881fcc4d7d2b3d147d3a81628b78f117f`.
- Installed candidate PTY lifecycle: `q`, contextual `Esc`, raw `Ctrl-C`, `SIGINT`, `SIGTERM`, and `SIGHUP` restored terminal attributes and alternate-screen state with exit codes 0, 0, 0, 130, 143, and 129.

`measurement.json` retains exact commands, hashes, byte counts, startup samples, PTY observations, runtime, OS release, architecture, and tool versions. Node.js 22 compatibility is retained separately in `node22-clean-install.json` against the same tarball.
