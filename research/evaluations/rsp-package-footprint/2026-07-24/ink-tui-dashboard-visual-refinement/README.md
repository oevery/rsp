# Ink TUI visual-refinement package evidence

This retained measurement compares the completed `add-ink-tui-dashboard` visual refinement with baseline commit `8d351c2` on the same macOS arm64 host and Node.js v24.18.0.

The complete chain is replayable with `node scripts/package-evidence.mjs --baseline-ref 8d351c2 --output research/evaluations/rsp-package-footprint/2026-07-24/ink-tui-dashboard-visual-refinement/measurement.json`. It builds, packs, and production-installs both source trees, measures logical bytes, benchmarks each installed CLI, runs the installed candidate through the PTY lifecycle gate, and removes transient worktrees and directories.

- Packed size: 87,382 B baseline; 96,092 B candidate; +8,710 B. Candidate is below 512 KiB.
- Installed logical size: 1,061,309 B / 272 files baseline; 8,714,091 B / 4,905 files candidate; +7,652,782 B / +4,633 files. The size delta is below 15 MiB.
- Warm-cache startup median: 34.245 ms baseline; 35.400 ms candidate; +1.155 ms against a 25 ms allowed regression.
- Candidate tarball SHA-256: `3c1aafb37372032b3f87e2ae469090913bcbf646d836d0c8a1298030738b52ef`.
- Installed candidate PTY lifecycle: `q`, contextual `Esc`, raw `Ctrl-C`, `SIGINT`, `SIGTERM`, and `SIGHUP` restored terminal attributes and alternate-screen state with exit codes 0, 0, 0, 130, 143, and 129.

`measurement.json` retains exact commands, hashes, byte counts, startup samples, PTY observations, runtime, OS release, architecture, and tool versions. Node.js 22 compatibility is retained separately in `node22-clean-install.json` against the same tarball.
