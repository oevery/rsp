# Make a local snapshot

Export the demo Job’s one record to a new local JSON file. Nothing is sent to a server.

## Before you start

Use Node.js 22 or newer and a POSIX-compatible shell. No dependencies need installing. Pick an output path that does not already exist.

## Try it

From this repository directory, run:

```sh
EXPORT_TENANT=demo node export.mjs snapshot.json
```

Success prints `Wrote 1 record.` and creates snapshot.json containing the tenant, daily Job name, and one record. A missing tenant or output argument exits with code 2. An existing file exits with code 3 and remains unchanged; choose a fresh path for a new snapshot. There is no automatic retry.

See [domain terms](CONTEXT.md) and the [export contract](spec.md).
