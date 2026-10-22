# Architecture

## Purpose

Define RSP's architecture, authoritative document owners and boundaries with the
Host Project, tools and Git.

## Current facts

RSP is **Reliable Software Practice**, a repository-native engineering workflow
for humans and AI agents. Practice is the product promise, composable Skills
supply the workflow, and Specs and Plans supply the lightweight repository artifact model.
The [identity decision](decisions/reliable-software-practice-identity.md) owns
that naming rationale.

RSP uses the smallest repository model that preserves explicit ownership,
recoverable work and evidence-based completion. It is not a project-management
platform, extensible workflow engine or replacement for Git. Cross-project
consistency takes precedence over speculative customization.

Core is the logical routing owner; explicit capability calls remain fast paths.
Direct, Change and Group describe work durability and delivery boundaries, not
agent counts. Delegation and final-delivery closure are independent policies;
closure never grants Git authority. Their detailed contracts belong to Workflow
and Work model below.

## Modules

Each current contract has one owner. Adjacent documents may summarize and link
it, but do not maintain another full definition.

| Contract | Authoritative owner |
| --- | --- |
| Work identity, artifacts, lifecycle, dependencies and closeout | [Work model](work-model.md) |
| Core routing, capability collaboration and task evidence | [Workflow](workflow.md) |
| Architecture, authority relationships and Host/Git boundaries | This Spec |
| Deterministic commands, configuration and public projections | [CLI](cli.md) |
| Interactive presentation and terminal lifecycle | [TUI](tui.md) |
| Packaging, installation and release boundaries | [Distribution](distribution.md) |
| Cross-cutting writing and content-review requirements | [Writing quality](writing-quality.md) |

Nearest project instructions own scoped operating rules and constrain the
current request. Specs own stable product contracts; Skills supply executable
methods with the necessary local safeguards. CONTEXT owns vocabulary,
relationships and navigation. Decision Records own lasting rationale, and
research and archives remain evidence rather than current authority. The
[Work model artifact contract](work-model.md#boundaries) defines their placement.

Specs are authoritative for adopted contracts. Code, tests and execution
observations provide evidence of implemented behavior, not authority to change
those contracts. A disagreement requires determining whether implementation is
defective, the contract needs an authorized update, or a change lacks authority;
neither the Spec nor observed behavior is silently treated as infallible.

## Dependency direction

- Configuration and filesystem safety support artifact interpretation and commands.
- Syntax readers own Markdown/YAML structure and original source spans. Domain
  interpretation owns RSP grammar and constraints; consumers reuse parsed views
  instead of maintaining competing document parsers.
- Core domain interpretation supports work, status, history and Spec queries.
- CLI and TUI consume presentation-neutral domain projections; domains do not
  depend on presenters.
- Maintainer tools and research may inspect product artifacts; the distributed
  product never depends on a source checkout, research corpus or upstream cache.
- Self-hosting applies the same artifact contracts to RSP's own maintenance;
  repository-specific methods do not become consumer runtime requirements.

## Agent and tool boundary

The owning capability interprets evidence and retains its workflow responsibility.
CLI commands and scripts supply deterministic operations and observations, not
semantic acceptance, authority or human approval. Focus and archive mutations
use their owning commands; changing tools cannot bypass managed-path safety or
create a second workflow controller.

A permitted method change preserves goal, scope, authority, baseline and required
evidence. Named mandatory checks, immutable provenance and required independence
remain binding. Diagnose tool-only obstacles and observe actual effects before
continuing read-only or proven repeat-safe work. Missing decisive evidence,
unsafe facts, unknown mutation or a changed boundary requires a stop or owner
decision; uncertain effects permit observation, not blind replay. Commit retains
its one-attempt boundary under the [Workflow contract](workflow.md#capability-ownership).

The Host owns execution locations, workers, isolation, cancellation and resource
lifecycle. Git owns staging, history, branches, remotes, signing and integration.
RSP may prepare exact reviewed inputs but does not infer delivery authority.

## Constraints

- Keep current contracts, planned work, rationale and execution evidence in their
  own artifacts; resolve a Spec/implementation disagreement instead of promoting
  observed code automatically.
- Add a module, persistent artifact or extension only for a demonstrated consumer
  and material responsibility, not speculative capability.
- Introduce no hidden runtime, persisted controller or second authority store.
- Published Skills remain usable without repository Specs or another installed
  package; source-level ownership does not create a runtime reference dependency.
