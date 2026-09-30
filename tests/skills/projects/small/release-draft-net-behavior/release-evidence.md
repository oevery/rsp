# Confirmed release evidence

Audience: CLI users. Version 1.1.0 is confirmed; the release is not published. Scope is the final local export change since 1.0.0.

The command now uses exclusive file creation. Existing output exits 3 and is not overwritten; previously it overwrote output. Missing output exits 2. Success prints Wrote snapshot. Node 22 remains required. Users must choose a new output path or explicitly remove an unwanted old snapshot themselves; the CLI does not remove it.

An early automatic-retry proposal was never implemented and is not a released capability. Test fixtures cover ordinary success and existing-file preservation; Windows execution is not validated. No hosted release or upstream issue links are supplied; do not invent them.
