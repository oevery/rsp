---
kind: sanitized-derived-evidence
derived_from_run: long-goal-product-Z2JNSi
---

# Long-goal composition boundary derivation

This artifact corrects retained-evidence completeness without changing or rerunning the original host execution. It projects the four ordered composition hashes already present in the immutable raw metadata: source-before, installed-before, source-after, and installed-after.

The source raw metadata is identified by SHA-256, and the existing sanitized hardened evidence remains unchanged. The derivation retains the ordered Skill names and individual tree hashes so replay can reconstruct the composition hash from the current authored sources and independently compare all four run boundaries. It contains no disposable workspace path, raw event content, or additional behavioral claim.
