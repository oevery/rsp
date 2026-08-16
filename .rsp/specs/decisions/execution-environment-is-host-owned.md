---
title: Execution Environment Is Host Owned
summary: Keep checkout, worktree, container, and cloud environment selection outside RSP Core and Manage.
kind: decision
status: accepted
---

# Execution Environment Is Host Owned

## Context

After the v3.2.0 release boundary, RSP trialed a first-class Workspace subsystem for isolated managed execution. The trial added project activation policy, a Core-owned WorkspaceSelection handoff, Manage integration, a registry under Git common state, process and resource tracking, exact landing, disposal, pruning, status projections, a published Skill pair, documentation, and extensive deterministic tests.

Repository dogfooding showed that the capability was mechanically safe but operationally disproportionate. Ordinary single-owner work could be routed into isolation unnecessarily, late preparation could not migrate product changes already started in the source checkout, landing and cleanup created another delivery lifecycle, and recovery state remained visible after the useful work was already patch-equivalent on the target. Several follow-up Changes narrowed selection, aligned recovery semantics, and added safer pruning, but each correction expanded the amount of Core, Manage, CLI, configuration, documentation, and test surface devoted to a low-frequency environment concern.

The trial was never published: the npm latest version and Git v3.2.0 tag predate the Workspace implementation. The maintainer checkout also had no active Workspace records when removal was selected. This made pre-release removal safer than preserving compatibility for an unproven contract.

## Decision

RSP does not own execution-environment isolation. Core and Manage operate against the checkout actually provided and observed by the host. Local Git worktrees, alternate branches, containers, remote sandboxes, and cloud VMs are selected and managed by the user, host, or Git tooling rather than by RSP policy or workflow state.

Manage remains responsible for goal coordination, worker assignments, resource conflicts, evidence acceptance, lifecycle closeout, and commit eligibility. An observed execution location may appear transiently in its ExecutionFrame, but no WorkspaceSelection, registry, activation policy, prepared branch, landing lifecycle, or cleanup state enters the RSP domain model.

Commit owns one exact local Git delivery boundary in the current checkout: authorized paths, staged diff, compatible Git state, one stored message, one resulting commit, and a truthful receipt. Commit does not cherry-pick into another branch, clean another checkout, or infer remote delivery. If work occurs in a host-selected worktree or branch, the host or user owns any later handoff or integration.

Historical Change archives and upstream research remain unchanged. They are evidence that the Workspace approach was implemented, tested, corrected, and ultimately rejected before release; they are not current product truth.

## Alternatives Considered

- Keep Workspace explicit-only: reduces accidental selection but leaves every Core, Manage, configuration, package, CLI, documentation, registry, landing, and recovery seam in the product for rare use.
- Keep Workspace as an optional compatibility layer: avoids immediate deletion but creates a deprecation and migration obligation despite no published compatible version or active maintainer record.
- Keep only prepare or only recovery commands: produces an incomplete lifecycle in which RSP can create state it cannot safely deliver or remove, or retains recovery complexity without a current producer.
- Merge Land's cherry-pick behavior into Commit: collapses local commit creation and cross-branch integration into one authority surface and makes conflicts, cleanup, and target mutation implicit.
- Continue observation through another release: would intentionally publish an already unsatisfactory contract and make later removal materially more expensive.

## Consequences

- Workspace activation, selection, registry, status, CLI, Skills, Land, activity tracking, disposal, and pruning are removed from the current product.
- Manage automatic activation remains available and defaults to the observed current checkout.
- Parallel workers do not imply isolated filesystems. Shared writer or generated-state boundaries remain sequential unless the host independently provides and proves isolation.
- Host-native worktrees and cloud environments require no RSP compatibility contract; RSP consumes only observed paths, Git state, changed paths, and verification evidence.
- Exact local commit behavior remains an RSP capability, while cross-branch integration, push, publication, deployment, and approval remain explicit external actions.
- Reintroducing execution-environment ownership requires new evidence of a recurring RSP-specific gap that host or Git tooling cannot satisfy, plus a normal Change that explicitly revisits this decision.
