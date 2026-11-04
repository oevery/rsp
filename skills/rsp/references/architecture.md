# Architecture knowledge

Use when a task concerns a project's structure, responsibilities, dependencies or
architecture model. Follow relevant CONTEXT navigation to `.rsp/architecture.json`
when present. The model maps current structure and relationships to documents;
Specs own contracts and decisions retain rationale. An absent model does not
require creation or block work.

## Read

Read only the relevant nodes, relations and bound documents, using the selected
project CLI's `rsp architecture --node <id> --json` or the model directly.
Use the current checkout/worktree's content. Treat the model as navigation and
check decisive claims against the owning code and contracts; it does not override
them or establish a mandatory Skill execution order.

## Update

When an authorized implementation changes modeled responsibilities, boundaries,
dependencies or document bindings, update the affected model entries with the
implemented facts. Preserve stable IDs for unchanged identities and keep detailed
contracts in their documents. Proposed structure stays in the Change Design until
implemented. Read-only Shape and Review report discrepancies without editing.
If a needed model correction is outside the authorized scope, return the gap to
the owner rather than silently expanding the task.

When authorized to add a model, register one link in root CONTEXT, reusing an
existing entry or creating minimal CONTEXT if absent. Installation or upgrade
alone neither creates the model nor rewrites context.

## Check

For affected model entries, implementation self-checks and Review compare the
represented responsibilities and relations with the changed code and contracts.
After model or bound-document changes, use `rsp doctor` for structural and
document/chapter-reference checks, reusing applicable passing evidence under the
ordinary verification rules. A pass does not establish semantic agreement with
implementation. Keep this within the task's existing checks and review scope;
unrelated tasks need no whole-model read, extra review or unconditional doctor run.
