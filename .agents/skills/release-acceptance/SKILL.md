---
name: release-acceptance
description: Plan, execute, and interpret this repository's serial pre-release acceptance campaign, including dynamic project scenarios and generated reports. Use before selecting or validating an exact RSP release candidate; do not use it to publish, tag, push, or approve a release.
---

# Release Acceptance

Choose the narrowest mode that matches the release decision. Run modes serially: they share build, package, provider, or terminal resources. Scripts own mechanics and report generation; this Skill owns sequencing, evidence interpretation, and authority stops.

Across provider-backed modes, keep unavailable final-response, resource-event, first-fix, model-invocation, and similar host observations as explicit omissions. Never infer an observation from a successful result or neighboring events. A missing observation fails closed when it leaves a declared hard dimension or required structured evidence unevaluable; otherwise it remains diagnostic and cannot strengthen the verdict.

## Select one mode before loading

- Read [deterministic acceptance](references/deterministic-acceptance.md) before judging general release readiness.
- Read [provider behavior acceptance](references/provider-behavior-acceptance.md) when release-relevant Skill behavior changed and provider cost is authorized. This is the default provider-backed release gate.
- Read [provider routing comparison](references/provider-routing-comparison.md) only when an explicit release evaluation requires baseline-versus-candidate routing, worker-composition, correctness, or efficiency evidence and provider cost is authorized.
- Read [exact candidate](references/exact-candidate.md) only after version identity and release surfaces are final and the intended release commit has a clean worktree.

Load only the selected mode reference. A mode may invoke or require evidence from another mode through its declared command, but do not preload another procedure.

## Failure handling

- Diagnose the first failed step from its retained log and current source; do not skip it or continue later shared-resource steps.
- A provider arm failure must still produce a sanitized aggregate report naming the failed arm and bounded failure category. Absence of that report is a runner defect, not an unavailable pass.
- Correct only the selected Change scope, then create a fresh run rather than editing or merging an old report.
- If project coverage is missing, add or repair a realistic isolated fixture; do not lower required coverage or assert a fixed total.
- If a real project would require network access, credentials, or mutation of its source checkout, report it as unavailable until an isolated authorized fixture or checkout exists.

A passing plan, report, comparison, or candidate check grants no archive, commit, push, tag, npm publication, hosted release, deployment, approval, or human-acceptance authority. Stop at the next action not explicitly authorized.
