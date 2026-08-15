---
kind: "feature"
---

# Change: add-skill-security-preflight

## Proposal
- Outcome: Add a deterministic, offline Skill security preflight that fails release-candidate promotion on high-confidence supply-chain risks while retaining content-bound suppression provenance.
- Why:
  - Existing Skill packaging checks validate structure and destination safety but do not inspect scripts, permissions, embedded secrets, egress, prompt injection, dependencies, or MCP metadata.
  - Q4 is explicitly deferred until a release-candidate security decision; the requested implementation supplies that bounded local gate without treating static analysis as behavior proof.
- Scope:
  - Scan every bundled Skill in deterministic path order using local file bytes and metadata only.
  - Emit bounded machine-readable and human-readable findings without reproducing suspected secret values.
  - Support explicit suppressions bound to the exact rule, Skill-relative path, file hash, and maintainer reason so changed content is rescanned.
  - Run the gate from `release:candidate-check` before the ordinary release suite.
- Non-goals:
  - No provider/LLM semantic scan, OSV or other network lookup, external SkillSpector dependency, automatic remediation, runtime scanning, installation-time policy expansion, or claim that a clean static result proves safe behavior.

## Spec
### ADDED
- Requirement: Release-candidate Skill security checks are deterministic and offline.
  - The scanner rejects unsupported file types and unsafe permissions, then checks executable content, dependency manifests, secret signatures, egress primitives, prompt-injection signatures, and MCP metadata using versioned local rules.
  - Findings are stable-sorted and bounded; secret findings expose only rule, location, and redacted diagnostic metadata.
- Requirement: Suppressions remain attributable to unchanged content.
  - A suppression names one rule, one Skill-relative file, its exact SHA-256 content hash, and a non-empty reason.
  - Missing, malformed, duplicate, stale, or unused suppressions fail closed.
- Requirement: Static security evidence gates release candidates without expanding authority.
  - `release:candidate-check` fails before the ordinary release suite when an unsuppressed finding exists.
  - Passing the gate grants no installation, publication, provider, network, or behavioral-safety authority.

### Acceptance
#### Scenario: Block a risky bundled Skill
- GIVEN a bundled Skill contains a high-confidence secret, unsafe script primitive, unsafe permission, dependency install hook, prompt-injection signature, or broad MCP permission
- WHEN the deterministic security preflight runs
- THEN it returns a non-zero result with a bounded redacted finding and the release candidate stops

#### Scenario: Accept an attributable exception
- GIVEN a reviewed finding has an exact rule/path/content-hash suppression with a reason
- WHEN the unchanged Skill tree is scanned
- THEN the finding is reported as suppressed and the gate may pass, while changed content or unused suppression data fails closed

#### Scenario: Preserve offline and authority boundaries
- GIVEN the release-candidate gate scans the bundled Skill suite
- WHEN the scan completes successfully
- THEN it performs no network or provider operation and claims only that the declared deterministic rules produced no unsuppressed findings

## Design
- Approach:
  - Add a maintainer script with exported scan primitives and a small CLI supporting repository root, optional suppression manifest, and JSON output.
  - Use exact regular-file inspection, SHA-256 content identities, extension-aware script checks, conservative high-confidence signatures, deterministic sorting, and capped findings.
  - Keep suppression data outside packaged Skill trees so exceptions cannot self-authorize; release uses the repository-owned manifest when present.
- Boundaries:
  - This is repository maintainer tooling and release evidence, not a published runtime command or a replacement for code review, behavior holdouts, dependency review, or provider-backed semantic analysis.
- Affected areas:
  - `scripts/skill-security-preflight.mjs` and its declaration surface.
  - Repository-owned `skill-security-suppressions.json` policy data.
  - Focused security-preflight tests and release-candidate contract tests.
  - `package.json` release scripts and `.rsp/specs/distribution.md`.
- Constraints:
  - Do not print matching secret content, read credentials, contact external services, or add production dependencies.
  - Avoid generic keyword scanning of ordinary explanatory prose; prompt and authority findings require high-confidence imperative signatures.

## Tasks
- [x] Implement deterministic Skill-tree inspection, versioned findings, bounded output, and content-bound suppressions.
- [x] Cover risky, clean, redacted, stale/unused suppression, permission, dependency, prompt-injection, egress, and MCP cases.
- [x] Integrate the preflight into the release-candidate gate and update stable distribution facts.
- [x] Run focused, package, full regression, review, and readiness checks.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-security-preflight.test.ts test/release-candidate-check.test.ts --no-file-parallelism` — passed 2 files / 20 tests; proves deterministic rules, content-bound suppression provenance, secret redaction, binary-asset handling, dependency coverage, MCP host metadata, and release-gate integration.
  - [x] `mise exec -- pnpm run skills:security-check` — passed over 40 bundled Skill files with zero findings and zero suppressions; proves the exact offline release gate accepts the current suite.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run test` — passed; documentation reported 7 bilingual pairs and 30 Markdown files, and the full suite passed 75 files / 814 tests.
  - [x] Fixed-scope Code and Document re-review — clean after connecting the repository-owned suppression manifest to the production release path and ensuring extensionless/lock dependency manifests reach their rule; `node dist/cli.mjs check --focused --json` and `git diff --check` passed with zero errors and zero warnings beyond the informational ADDED marker.
### Optional
- Manual or environment:
  - [-] External SkillSpector, provider semantic scan, and live OSV lookup — omitted because they require separate external execution, disclosure, and network authority.
- Coverage:
  - Required evidence covers deterministic local release-candidate scanning of supported Skill text, binary-asset metadata, file modes, dependency declarations, and host/MCP metadata. It does not prove semantic safety, inspect binary payload contents, or establish vulnerability-database freshness.

## Blockers
- none
