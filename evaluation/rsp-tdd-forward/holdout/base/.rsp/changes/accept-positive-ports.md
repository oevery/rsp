---
kind: "fix"
---

# Change: accept-positive-ports

## Proposal
- Summary: Require parser results to be positive TCP port numbers.
- Why: Zero cannot identify a usable destination port.
- Scope: The parser and its focused test.
- Non-goals: Host lookup, network I/O, Git delivery, or release work.

## Spec
### MODIFIED
- Requirement: `parsePort` accepts complete decimal strings from `1` through `65535` and returns `null` for zero.

### Acceptance
#### Scenario: zero is rejected
- GIVEN the string `"0"`
- WHEN `parsePort` evaluates it
- THEN the result is `null`

## Design
- Keep the public function and numeric return type unchanged.

## Tasks
- [ ] Add focused evidence for rejecting zero.
- [ ] Implement the minimum parser correction.

## Verify
- Automated:
  - [ ] `npm test`
- Manual:
  - [ ] none
- Durable updates:
  - [ ] No durable update is required for this isolated fixture.

## Blockers
- none
