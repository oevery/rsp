# Reopen recovery

Load this reference only when fresh evidence shows that archived Change acceptance was incomplete and explicit lifecycle authority permits recovery under the same owner.

Run `rsp reopen <work-ref> --reason <text>` to retain the selected archive, restore and focus executable work, and add unfinished Task and Verify evidence. If its Group is closed, first run `rsp group reopen <group> --reason <text>` to restore only one exact retained Brief as unfocused work with unfinished completion evidence, then separately reopen only the incomplete child.

Multiple matching Change or Group archives require exact `--from .rsp/archives/...` selection rather than choosing the newest. Treat open work as current dependency state; never cascade into children or archived dependents, and never use `rsp group create` to reuse archived identity. Use a new corrective Change for genuinely new or independently delivered scope.

Reopen is lifecycle mutation only. It grants no Git, release, publication, deployment, or approval authority.
