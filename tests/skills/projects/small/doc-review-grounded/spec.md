# Snapshot contract

The command writes one record for the requested tenant to the supplied output path.

## Safe retry

When the output already exists, the command succeeds without changing it. Repeating a request is therefore an idempotent successful replay of the original result.
