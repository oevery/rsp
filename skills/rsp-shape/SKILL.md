---
name: rsp-shape
description: Shape or rigorously challenge unclear non-trivial work into one executable RSP Change or a justified shallow Change Group without implementing it.
license: MIT
metadata:
  author: oevery
  version: "2026.07.28.1"
---

# RSP Shape

Do not implement the shaped work.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Establish the boundary

Read the request, authority, Core or fallback, Change and Brief, then only decisive evidence.

A request to shape, create, or refine a Change grants artifact authority unless no-edit; advice does not. If creation focuses it, preserve the exact prior focus and restore it immediately unless selection was requested. Shaping grants no other authority; preserve unrelated work.

Return the request directly to implementation when it is tiny and concrete or the selected Change is already ready. Do not rewrite settled work for style or completeness.

During an explicit managed goal, its original planning-artifact authority remains valid for clear in-scope discovery. Keep a cohesive correction in the current Change; create one Change for an independently closable result, or one shallow Group for at least two such results sharing the goal. Return the ready WorkRef to Core for fresh qualification without another authorization round. Stop on changed behavior, acceptance, public interfaces, goal scope, mutation authority, or external action.

## Resolve material ambiguity

Inspect the repository before asking. Ask only for an owner decision changing behavior, data, interfaces, compatibility, safety, ownership, migration, or acceptance. Write only authorized answers.

Shape owns two transient questioning modes. Ordinary clarification asks one to three related material questions, while explicit deep clarification asks exactly one owner decision per turn. A Core or Manage `StopDisposition: return-to-shape` may enter either mode, but Shape resumes execution only by returning a ready owner to Core for fresh route derivation; it never resumes Manage directly.

Read [deep clarification](references/deep-clarification.md) when the user explicitly asks for rigorous challenge, a high-risk decision remains, or one design question returns. Prefer the installed `rsp-design` capability; otherwise use its fallback.

Read [external issue input](references/external-issue-input.md) only when a Change declares an issue relationship or the request asks to shape from an issue URL.

Never invent a product decision. When a material choice or mutation authority remains unresolved, leave the work open and report the single highest-impact blocker.

## Choose the owner

Read [complex shaping](references/complex-shaping.md) when clarification needs multiple rounds, slices share one completion contract, or independently closable owners converge on terminal delivery.

Prefer one ordinary Change only for one observable outcome sharing a consistency, focused-verification, review, archive, and rollback boundary. Change granularity does not prescribe Git commit count; never split or merge Changes merely to enforce a Change-to-commit mapping. Use a shallow Group for independent outcomes under one goal; an integration gate never merges them. A shared completion contract gates Group closure, not child archive unless declared there. Keep Brief `Slices`, child `Blockers`, and derived readiness. Add no hierarchy.

Keep one observable outcome per Change:

- `Proposal`: outcome, scope, non-goals;
- `Spec`: requirements and acceptance;
- `Design`: boundaries and choices;
- `Tasks`: executable steps;
- `Verify`: decisive evidence;
- `Blockers`: dependencies and decisions, or `none`.

Plan a test only when it protects observable behavior or a real boundary, adds distinct future confidence, avoids duplicate or implementation-detail coverage, and costs proportionately. Otherwise prefer smallest sufficient evidence and keep probes temporary.

A Change is a convergent current-plan/final-evidence snapshot, not an append-only execution log. Replace superseded evidence; keep process in the response. Before archive, retain final decisive verification, gaps, and risks.

Use domain language. Mention agents only as real product actors or constraints, not authors or execution narrators.

## Apply the Shape Ready gate

A Change is ready only when:

- outcome, non-goals, and acceptance are concrete;
- product and mutation authority are settled;
- affected boundaries and material constraints are known;
- no hidden assumption can change implementation or acceptance;
- Tasks are executable without performing them;
- Verify proves the result without process chronology; Blockers are truthful;
- one Change or a justified shallow Group is the smallest sufficient owner.

After mutation, run the focused RSP check. Return WorkRef, artifacts, validation, and next action or blocker.

When the gate passes, return a `ControlOutcome` for phase Shape with `OwnershipDisposition: ready`, the WorkRef, decisive readiness evidence, next owner `Core`, and a resume rule that Core freshly derives the route.

When a material owner question prevents readiness, return a non-ready `ControlOutcome` for phase Shape with `StopDisposition: ask-owner`, the decisive evidence, next owner `owner`, the required answer, and a resume rule that reruns Shape from fresh evidence after the answer.

For any other blocker, return a non-ready Shape `ControlOutcome` with the applicable canonical `StopDisposition`, decisive evidence, next owner, required input, and resume rule. Do not relabel unresolved fog as ready work.
