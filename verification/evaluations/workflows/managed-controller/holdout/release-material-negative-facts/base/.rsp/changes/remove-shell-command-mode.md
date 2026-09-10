---
kind: "feature"
---

# Change: remove-shell-command-mode

## Proposal
- Outcome: Execute commands without shell interpretation.
- Non-goals: A compatibility shim for string commands.

## Spec
### MODIFIED
- Requirement: `run` accepts an executable and argument array; string command mode is removed.

## Design
- Call the process API with shell execution disabled.

## Tasks
- [x] Replace string command execution with executable and arguments.
- [x] Cover argument-safe execution.
- [ ] Publish release guidance with the breaking, migration, and safety facts.

## Verify
### Required
- Automated:
  - [x] `npm test` — passed before release finalization; proves argument-safe execution.

## Blockers
- none
