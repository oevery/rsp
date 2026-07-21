---
candidate: rsp-daily-workflow-depth
date: 2026-07-21
status: qualified
recommendation: resume-release-preparation
evaluated_package_sha256: 7d64fab954b7366688db5bccf3e38db86c9ad0a671df1669d0e833495c368011
final_reviewed_package_sha256: 93a5af8667e760d402da5f8460b517b282c4b642d891c571f3fc39ff93b3b065
---

# RSP Daily Workflow Depth Terminal Evaluation

## Decision

Resume local 3.0 release preparation. All five frozen journeys passed against one exact project-local `@oevery/rsp@3.0.0` tarball. Package discovery still exposes exactly seven stable Skills. `rsp-shape` retains the progressively disclosed deep-clarification and project-design return branch; `rsp-manage` remains research-only with recommendation `revise` and is absent from the package.

This decision qualifies the tested daily-workflow boundary, not universal autonomy. Authenticated, receiver-hardware, and human acceptance remained unavailable and correctly stopped the relevant journeys. Cross-provider behavior, real parallel delegation, deployment, publication, and steady-state cost remain unqualified.

## Journey results

| Journey | Same-case result | Boundary observed | Human-facing language |
| --- | --- | --- | --- |
| J1 ambiguous intent | pass | one recommended owner decision; zero mutation; user stop | zh-CN |
| J2 domain language | pass | bounded `domain-modeling` return; zero mutation; owner decision stop | zh-CN |
| J3 module seam | pass | project design return, bounded implementation, exact verification, hardware stop | zh-CN |
| J4 ordinary correction | pass | test mutation -> RED -> production mutation -> GREEN -> read-only clean review; authenticated stop | zh-CN |
| J5 multi-session continuation | pass | external bounded continuation reread stale pointers, returned fresh evidence to the same Change, human stop | zh-CN |

Every trace is bound to host commands, filesystem mutations, Git observations, or retained human-facing output from its own isolated workspace. Canonical WorkRefs, status values, paths, and commands remain untranslated. J3 and J4 additionally fail closed on registry-style RSP calls, global Skill reads, or global memory reads; their accepted runs used `.agents/skills/` and `npx --no-install rsp` only.

## D2 paired correction metric

The retained project-design pairs were rescored with one deterministic correction request per missing field in the five-field return envelope: unresolved question, authoritative inputs, expected artifact, mutation boundary, and same returning WorkRef.

| Case | Baseline | Candidate | Result |
| --- | ---: | ---: | --- |
| Domain language | 4 | 0 | fewer deterministic correction requests |
| Module seam | 1 | 0 | fewer deterministic correction requests |

These are oracle-derived follow-up requests over preserved paired outputs, not observed natural user conversation turns. The scorer and output hashes are retained in `real-runs/d2-paired.json`.

## Package and cost evidence

- Evaluated exact tarball: `@oevery/rsp@3.0.0`, SHA-256 `7d64fab954b7366688db5bccf3e38db86c9ad0a671df1669d0e833495c368011`.
- Final reviewed tarball after the report-only README update: SHA-256 `93a5af8667e760d402da5f8460b517b282c4b642d891c571f3fc39ff93b3b065`. Its 17-file package surface and all seven Skill payload hashes match the evaluated behavior-bearing payload; only human documentation changed after the model runs.
- Stable package surface: `rsp`, `rsp-shape`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, and `rsp-address-review`.
- J1-J5 retained telemetry: 581,812 ms, 1,532,849 input tokens, 14,345 output tokens, and 38 command observations in aggregate. This is execution telemetry, not a steady-state cost qualification.
- Shape default instruction grew from 530 to 572 words (+7.92%); the 276-word deep reference is progressively disclosed.
- The controller candidate matched baseline outcomes while adding 31.12% input tokens, 27.90% elapsed time, 21.59% output tokens, and one tool call. It therefore remains `revise`, not promoted.

## Failed-attempt handling

The original cross-scenario composite traces remain under `traces/` as `excluded-composite-replay`; they test oracle structure only and never contribute to the pass result. Runs that used registry-style `npx`, global Skills or memory in isolated J3/J4, a non-exact package, or an invalid fixture are retained under `invalid-attempts/`, explicitly marked invalid, and sanitized. The accepted J3/J4 traces use project-local CLI and installed project Skills.

## Product boundary

- Stable: the seven published Skills above, including qualified Shape progressive depth.
- External/project-owned: full domain modeling, module design, and host-managed continuation.
- Research only: `rsp-manage`, recommendation `revise`.
- Not claimed: cross-host/provider compatibility, real hardware/authenticated/human acceptance, deployment/publication, parallel-agent qualification, or stable cost.

The terminal evidence supports closing `daily-workflow-depth` and resuming local release preparation. Publishing, pushing, tagging, and external release actions still require their own authority and release checks.
