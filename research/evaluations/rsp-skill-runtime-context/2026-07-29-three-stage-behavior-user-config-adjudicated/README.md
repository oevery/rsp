---
evaluation: rsp-skill-runtime-context-three-stage-behavior
date: 2026-07-29
provider: user-configured
status: passed-candidate
recommendation: accept-structural-and-restrained-notation
---

# Adjudicated user-configured provider evaluation

## Result

The immutable identity reruns the same eight routing cases for `current`, `structural`, and `combined` through the user-configured provider. It corrects one oracle defect from the retained predecessor: report-only status preserves and returns the existing focused Change rather than an unknown owner.

`structural` and `combined` pass all eight strict route, mutation, input, and owner expectations. `current` passes seven; its `managed-status` row chooses `allowed_in_routed_skill` instead of `allowed_after_status_update`, while its rationale still says that the status update is reported and authorized work then continues. The candidate variants remove that categorical ambiguity and introduce no observed safety or routing regression.

| Variant | Strict score | Input tokens | Output tokens | Reasoning tokens |
| --- | ---: | ---: | ---: | ---: |
| `current` | 7/8 | 29,854 | 724 | 191 |
| `structural` | 8/8 | 29,310 | 668 | 147 |
| `combined` | 8/8 | 29,291 | 690 | 167 |

Against `current`, the provider reports 544 fewer input tokens for `structural` (1.82%) and 563 fewer for `combined` (1.89%). The notation step contributes only another 19 provider input tokens beyond structural ownership and conditional loading. These provider totals include user-configured runtime context, so the relative reduction is smaller than the exact embedded Skill-source count (`3848 → 3386 → 3371`, or 12.40% from current to combined).

## Interpretation

- Single ownership and conditional loading provide nearly all of the measurable saving and make the selected-Manage boundary more consistent.
- The local `→` rewrite remains understandable and passes every fixed candidate case, but its marginal saving is small. It should stay limited to closed local flows and should not become a glossary or general symbol language.
- This is one provider run per variant over prompt-level routing cases. It supports the fixed behavior contract but is not stochastic, latency, repository-discovery, or tool-use calibration.

Provider, model, and effort came from user configuration. Private endpoint and credential values were neither inspected nor retained.
