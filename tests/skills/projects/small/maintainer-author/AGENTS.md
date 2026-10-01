# RSP maintainer candidate workspace

This isolated miniature repository owns an RSP maintenance candidate at skills/rsp-evidence-note/SKILL.md. It is authored product-candidate text, not a generic project Skill and not the installed guidance under .agents/skills/. The selected Change is clarify-evidence-note; its plan and authority are settled, but its implementation checks are not complete.

Only the candidate and .rsp/changes/clarify-evidence-note.md may change. Keep installed guidance, tool snapshots, source facts and focus intact. Do not execute the candidate's report workflow, delegate, install dependencies, use a network/provider, stage/commit, archive or claim independent acceptance.

The runner supplies the real RSP CLI and an isolated copy of its existing dependencies. Run from this workspace:

- .tooling/node .tooling/rsp/dist/cli.mjs check --focused --json
- .tooling/node .tooling/rsp/dist/cli.mjs ready clarify-evidence-note --json
- .tooling/node .tooling/rsp/scripts/skill-package-check.mjs skills

The last command is a byte-identical snapshot of the repository's actual package checker, not a fake tool. tool-source.json identifies it; offline readiness verifies its hash against the source checkout. Do not access that source checkout from the task. These are static checks, not candidate behavior or independent review. If a tool is unavailable, report the gap rather than inventing success. No local model harness or security preflight is supplied for this small wording-only revision; preserve permissions rather than adding them.
