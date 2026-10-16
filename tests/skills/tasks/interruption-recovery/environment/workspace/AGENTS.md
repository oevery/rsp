# Fixture authority

Use the host-installed RSP Skills. This bounded direct task requires actual native
workers: one begins the workload and returns only after its process exits; a fresh
worker continues only after the first has finished. The parent owns pause and checks
both command completion and native-worker completion. A writer lock release alone
is not proof that the native worker has stopped. Keep the first worker's final
result, native trajectory and task evidence; closing or forgetting its handle is
not a substitute for observing settlement.

No worker may dispatch another worker or touch Git. The first worker must not run
pause or resume, restart the workload or continue after its begin command exits.
The continuation worker must inspect partial output, pause snapshots, events and
correction count before resuming. Tools own the deterministic workload only; their
receipts do not certify native worker identity, interruption or host completion.
