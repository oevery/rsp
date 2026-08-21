# Machine contract kernel

Load this reference when Core receives, composes, or forwards a contract for an explicitly identified machine consumer. This kernel owns cross-Skill transport integrity only. The phase or Discipline Skill still owns its domain fields, lifecycle, validation, and acceptance semantics.

## Carry one atomic descriptor

A machine contract descriptor identifies its consumer and includes every applicable transport prefix or encoding rule, exact correlation identity constraint, required and optional field, field type, canonical value domain, and contract version. The consumer owns the descriptor; Core carries it unchanged in the selected phase handoff. Do not reconstruct a descriptor from examples or from a validator's likely expectations.

Any downstream Skill that delegates production of the machine-consumed value must place the complete applicable descriptor in that delegated Assignment. Do not summarize, translate, split across messages, replace canonical values with synonyms, or require the producer to discover a controller-only reference. Human-facing context may be localized around the descriptor, but its machine values remain exact.

## Preserve ownership and fail closed

An exact external correlation identity constrains the value but does not transfer lifecycle ownership: the receiving phase still validates uniqueness, issues or forwards the identity, and associates the result with the current invocation. A duplicate, conflicting, incomplete, or unsupported descriptor stops before the machine-consumed value is produced and returns the mismatch to its owner.

Schema validity proves transport conformance only; domain validation and acceptance remain with the owning Skill.
