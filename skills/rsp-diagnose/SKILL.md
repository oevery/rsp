---
name: rsp-diagnose
description: Diagnose one selected RSP Change when a reproducible or materially evidenced failure has an unexplained cause or owning layer. Use for conflicting, intermittent, or multi-layer symptoms before production correction.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22.1"
---

# RSP Diagnose

Establish a confirmed cause before correction. Keep the selected Change as owner and return investigation evidence to it.

Follow Core's response-versus-artifact language boundary.

## Establish bounds

Resolve exactly one executable open Change from an explicit work reference or unambiguous focus. Read the user request, nearest project instructions, relevant context, RSP rules, the sibling Group Brief when present, the selected Change, and only the code, tests, logs, configuration, and worktree evidence needed to investigate.

A diagnosis request grants read-only investigation and safe diagnostic command execution. Editing tests, instrumentation, fixtures, or the Change requires explicit mutation authority. Production correction is outside this Skill even when separate fix authority exists.

Stop with one evidence request when the target, expected behavior, investigation scope, or safe reproduction conditions are unclear.

## Diagnose

1. **REPRODUCE.** Capture the smallest command or observation that exposes the symptom, its expected and actual result, and relevant conditions. When reproduction is unsafe or unavailable, label the supplied evidence and its limits. Continue only with a stable symptom or material evidence.
2. **LOCATE.** Trace the live path to the first boundary where actual behavior diverges from expected behavior. Identify the affected layer and owner; verify that any suspected adapter, validator, cache, or wrapper is reached by the production consumer.
3. **HYPOTHESIZE.** State the smallest set of live competing causes and the distinct observation each predicts. A single hypothesis is sufficient only when existing evidence already excludes credible alternatives.
4. **DISCRIMINATE.** Run the smallest safe check that separates the leading hypotheses. Record the exact command or observation and decisive result. Prefer one discriminating check over broad speculative changes.
5. **CONFIRM.** Confirm a cause only when observed evidence selects it over the remaining live alternatives and explains the reproduced symptom. Otherwise return `unresolved` with the missing evidence and one bounded next check.

## Return evidence

Return:

- selected Change;
- result: `confirmed` or `unresolved`;
- reproduction or supplied-evidence limit;
- cause and affected owner, or remaining hypotheses;
- decisive evidence and impact boundary;
- investigation mutations, if explicitly authorized;
- exactly one next action.

For `confirmed`, name one correction entrypoint owned by the same Change; do not apply it. For `unresolved`, name the next discriminating check or blocker. Update that Change's Tasks, Verify, or Blockers only with authority and observed facts. Preserve unrelated work and never infer Git, delivery, publication, or approval authority.

When correction, further discrimination, or other work remains, use Core's compact continuation fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. Put the result, reproduction limit, cause or hypotheses, decisive evidence, and impact boundary in `Current state`; put authorized investigation mutations in `Changed artifacts`. Reopen authority pointers, inspect drift, and refresh decisive evidence before resuming. This response is not durable truth or a second state store; persist it only with explicit path authority.
