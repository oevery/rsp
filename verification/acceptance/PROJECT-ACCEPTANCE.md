# Release Acceptance Projects

This directory owns report-producing project inputs rather than executable Vitest files.

- `fixtures/` contains immutable sanitized or frozen project trees.
- `projects/` contains the dynamically discovered scenario manifests and stable coverage tags.
- `pnpm test` does not discover or execute this directory.
- `pnpm run release:acceptance` copies every registered fixture to an isolated temporary root, validates the candidate against stable contracts, and emits JSON and Markdown reports.
- `pnpm run release:provider-compare` is separate and runs only when old/new Skill correctness or efficiency evidence is explicitly required and provider cost is authorized.

Do not run commands against a registered fixture in place or retain credentials, private URLs, identities, provider sessions, or production data here.
