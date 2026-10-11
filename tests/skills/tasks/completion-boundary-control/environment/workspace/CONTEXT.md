# Cache workspace

The process-local cache owns independent string entries with expiry in injected-clock milliseconds. The stable behavior is defined in .rsp/specs/cache.md; the selected implementation outcome is .rsp/changes/cache-ttl.md. src/cache.mjs implements it and tools/check.mjs is the declared smoke check.
