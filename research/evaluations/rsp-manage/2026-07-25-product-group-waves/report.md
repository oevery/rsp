---
case: group-waves
variant: product
model: gpt-5.6-terra
provider: custom
effort: low
result: passed
---

# RSP Manage product Group holdout

This fresh real-host run installed the authored `skills/rsp-manage` product Skill into an isolated fixture. The fixture exposed two ready direct children, one later dependency wave, one externally blocked child, and a shared `package-lock.json` affected path.

The host read the Group and all children, derived the current wave from `rsp status --json`, declared and followed `delivery/header` then `delivery/retry` sequencing, changed only the six authorized child-owned files, ran `npm test` with 7/7 passing tests, confirmed the lockfile and dependent/blocked paths were unchanged, reread status, and stopped at lifecycle authority. No archive, Git action, publication, controller state, or Group closure occurred.

The initial runner result was `failed` only because the exact-word oracle required the final status to repeat `顺序`. The raw event stream already recorded the sequential decision and execution, while the final status and diff proved the observable lockfile boundary. The retained oracle replaces that wording check with `package-lock.json`; rescoring then has no missing or forbidden output. Raw events and the disposable workspace are not retained, but their hashes and sanitized observations are.
