# Process-local cache contract

createCache(clock) creates an independent cache with an injected millisecond clock. Keys and values are strings. set(key, value, ttlMs) accepts nonnegative integer TTLs, replaces the key and calculates expiresAt from the current clock. Invalid TTLs throw RangeError before modifying the cache.

get(key) returns undefined for a missing or expired key. An entry is expired when the clock is equal to or later than expiresAt. A zero TTL therefore expires immediately. Reading an expired entry removes it. Entries must not become visible again if the test clock later moves backwards. No disk, network or cross-process persistence is required.
