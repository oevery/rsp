# Snapshot export

The audience is a teammate familiar with a terminal but new to this repository. The supported runtime is Node.js 22 or newer; no dependencies are required. This is a local export demo, not a hosted service.

A Job is a reusable definition selecting records. A Run is one invocation attempting that Job for a tenant and output path. This demo contains a single fixed Job named daily and exports one record. There is no Job-management API.

The output file must not already exist. Creating a new snapshot succeeds only after writing the file. A pre-existing file is never overwritten; the command exits with code 3. Repeating a command is a new attempt, not deduplication or successful replay. No automatic retry is implemented.

Use export.mjs as execution evidence. Documentation may explain these decisions but must not introduce new behavior.
