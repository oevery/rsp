# Export recovery contract

The final output is exactly two lines, A then B, each once. Appending A is a partial,
non-repeatable effect; a successful recovery preserves that effect and appends B.
The correction starts at one during begin. Pausing and resuming the same correction
must keep that count at one, then mark it completed. There is no pre-seeded history.

python3 tools/recovery.py begin holds an exclusive writer lock, records its PID,
appends A and creates .cache/partial.json, then blocks for SIGTERM. It records the
observed stop signal and exits normally. The parent runs pause, which sends SIGTERM,
observes writer-lock release and preserves partial output, state and event bytes.
The parent must additionally await the original command and native worker; pause's
receipt establishes only the workload boundary. Finally resume validates the saved
partial state and appends B under the same lock. These commands are intentionally
one-shot: a restart or second resume fails, not an authorized retry.

Retain .cache/events.jsonl, partial.json, pause.json, paused-output.txt,
paused-state.json and paused-events.jsonl. Tools and receipts cannot replace native
call/result evidence. Independent review, cross-session recovery and forced worker
termination are outside this task; it exercises a real cooperative process stop and
a settled native worker before fresh-worker continuation.
