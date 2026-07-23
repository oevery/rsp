---
kind: "feature"
---

# Change: cli-machine-output/add-compact-json-output

## Proposal
- Summary: Add an opt-in compact serialization mode for RSP's machine-readable JSON commands.
- Why:
  - JSON output is currently always pretty-printed, adding avoidable whitespace when agents or scripts consume it directly.
  - Consumers need a product-owned, deterministic compact form without sacrificing readable defaults or introducing abbreviated schemas.
- Scope:
  - Add `--compact` only to the existing JSON-producing inspection commands `status`, `show`, `ready`, `check`, and `doctor`; compact output is requested with `--json --compact`.
  - Emit the same values and field meanings as pretty JSON with insignificant whitespace removed.
- Non-goals:
  - Compressing transport bytes with gzip, abbreviating field names, adding binary formats, or changing which records a command selects.
  - Making compact output the default for humans.
  - Adding `schemaVersion` or otherwise changing the parsed JSON contract.
  - Converting CLI failures that do not currently emit structured JSON into new JSON error envelopes.
  - Changing general unknown-option handling beyond the new `--compact` option.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: JSON-producing inspection commands support a common opt-in compact serialization mode.
  - Pretty JSON remains the default for existing `--json` invocations.
  - Compact JSON is selected only by combining `--json --compact`; `--compact` without `--json` fails non-zero with no JSON document on stdout and a human-readable diagnostic on stderr.
  - Commands outside `status`, `show`, `ready`, `check`, and `doctor` reject `--compact` as unsupported before command behavior runs; they never silently ignore it.
  - Compact output parses to the same JSON value as pretty output for successful and structured-error results.
  - Compact mode emits one deterministic single-line JSON value without indentation or cosmetic whitespace, followed by exactly one LF (`\n`).
  - Public field names remain descriptive and are not shortened solely to reduce token count.
  - Existing structured JSON failures use the selected pretty or compact serializer; failures outside the current structured JSON contract retain their existing behavior.

### Acceptance
#### Scenario: agent requests compact status
- GIVEN `rsp status --json` returns a valid pretty JSON value
- WHEN the same status is requested with `rsp status --json --compact`
- THEN both outputs parse to deeply equal values
- AND the compact output is one JSON line terminated by exactly one LF

#### Scenario: compact structured failure
- GIVEN a command path already returns a structured error envelope with `--json`
- WHEN the same failure is requested with `--json --compact`
- THEN stdout still contains exactly one compact parseable error envelope
- AND diagnostics do not contaminate the JSON stream

#### Scenario: compact requires JSON mode
- GIVEN an inspection command supports both `--json` and `--compact`
- WHEN it is invoked with `--compact` but without `--json`
- THEN the command exits non-zero without writing a JSON document to stdout
- AND stderr explains that `--compact` requires `--json`

#### Scenario: non-JSON command rejects compact
- GIVEN a command outside `status`, `show`, `ready`, `check`, and `doctor` does not expose JSON output
- WHEN it is invoked with `--compact`
- THEN the command exits non-zero before performing its command behavior
- AND stderr reports `--compact` as unsupported

## Design
- Affected boundaries:
  - `src/core/output.ts` owns shared JSON serialization.
  - `src/cli.ts` and command option types own consistent option exposure and the targeted pre-dispatch rejection of `--compact` on other commands.
  - Existing JSON command error helpers must use the same serializer and output mode as success paths.
  - Integration tests and `README.md` own equivalence and public usage evidence.
  - `scripts/native-design-composition-eval.mjs`, its focused test, and a new retained real-run identity own requalification of the changed `dist/cli.mjs` package behavior artifact.
- Constraints:
  - Preserve stdout as one parseable JSON document and keep verbose diagnostics on stderr.
  - Do not couple compact serialization to status selection, history bounds, dependency semantics, or environment-specific wrappers.
  - Keep default output and parsed JSON values backward compatible.
  - Treat machine-output schema versioning as a separate compatibility decision only when a future Change modifies the parsed JSON contract.
  - Do not use this slice to change validation behavior for any unknown option other than `--compact`.

## Tasks
- [x] Refactor shared JSON emission so every supported command and structured error can select pretty or compact serialization.
- [x] Add the compact option consistently to status, show, ready, check, and doctor without changing their parsed values.
- [x] Reject `--compact` without `--json` consistently without emitting a JSON document.
- [x] Reject `--compact` on every other command before command behavior runs without changing general unknown-option handling.
- [x] Document the option and add equivalence, structured-error, line-framing, invalid-combination, help, and compatibility coverage.
- [x] Requalify the changed `dist/cli.mjs` artifact through a new immutable native-composition retained run without overwriting prior successful evidence.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 148 passed.
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm exec vitest run test/native-design-composition.test.ts -t "scores external evidence"` — observed RED for the unrecognized `运行时无关` phrase, then passed GREEN after the minimal scorer correction.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — all 15 gates passed for the new `device-discovery-boundary-compact-json-output` retained run; the earlier failed scorer attempt remains under `invalid-attempts/` and prior successful run identities remain unchanged.
  - [x] `mise exec -- pnpm run test` — 30 files and 357 tests passed.
- Manual:
  - [x] Compare pretty and compact success/existing-structured-error output for every JSON-producing inspection command, confirm deep equality after parsing, confirm compact output is one LF-terminated line, and confirm a representative non-JSON command rejects `--compact` before acting.
- Durable updates:
  - [x] Update `.rsp/specs/design.md` and `README.md` with the settled compact serialization contract if implementation confirms it.

## Blockers
- none
