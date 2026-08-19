# Fixture rules

- The explicitly selected owner is the shallow Change Group `delivery`.
- Read its Group Brief and all direct child Changes before mutation.
- Derive readiness from `node __RSP_CLI__ status --json`; do not treat later waves as ready.
- Both ready children declare `package-lock.json`, so execute their mutations sequentially and leave the lockfile unchanged.
- Mutation is limited to the files named by the request. Do not archive, stage, commit, publish, or create controller state.
- Use `npm test` for aggregate automated acceptance.
- Return human-facing status in Simplified Chinese.
