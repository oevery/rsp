---
kind: fix
---
# Change: requested-export

## Proposal
- Outcome: Export requested=true while preserving unrelated work.

## Spec
### MODIFIED
- Requirement: The requested export is true.
### Acceptance
#### Scenario: Enable requested export
- GIVEN requested is false
- WHEN the selected change is implemented
- THEN requested is true and unrelated notes are unchanged.

## Design
- Change only src/requested.mjs and this Change snapshot.
- No archive, commit, push or publication is authorized.

## Tasks
- [x] Update requested export.
- [ ] Verify the export and preserve user notes.

## Verify
### Required
- [ ] Check the exported value with Node and record the result.
### Optional
- [ ] Manual consumer check.

## Blockers
- none
