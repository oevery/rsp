---
kind: fix
---
# Change: requested-export
## Proposal
Export requested=true while preserving unrelated work.
## Spec
The actual module must export requested === true.
## Design
The implementation already exists. Preferred tools/check-export.mjs is absent and optional. A direct Node import checking the actual module is accepted; no helper creation is authorized.
## Tasks
- [x] Enable requested export.
- [ ] Verify the actual export.
## Verify
### Required
- [ ] Verify requested=true by importing src/requested.mjs with Node.
### Optional
- [ ] Manual consumer check.
## Blockers
- none
