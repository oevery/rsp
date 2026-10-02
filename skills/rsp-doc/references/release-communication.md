# Release communication

Load only for changelog, release-note or migration writing, including authorized reconciliation of release documents. Doc owns writing and self-checks, not release execution or independent acceptance.

## Establish the release boundary

Resolve the released unit, audience, evidence range, target surfaces and allowed edits. Follow nearest instructions, existing release artifacts, relevant release-tool configuration and prior published conventions. Preserve Doc's artifact-language precedence; prior releases may inform style but do not override it. Inspect only relevant non-secret settings; do not create configuration or persist preferences without authority.

Confirm a version only from explicit user instruction or authoritative repository release configuration. Until confirmed, keep authorized drafts or fragments version-neutral; do not invent versioned headings, paths, exact-version commands or tag comparisons. A missing range or delivered behavior prevents factual release claims, not a bounded explanation of what evidence is needed.

Use established project tools for inventories or generated drafts when useful. Inspect their effects before invoking them: generation may also commit, tag, push or publish. Tool availability and release-writing authority permit none of those actions.

## Explain the net result

Inspect the smallest sufficient net diff, direct public consumers, accepted fragments or work records and verification evidence. Git history and generated notes locate evidence; they are not proof of delivered behavior. Reconcile material disagreements and label historical results with their revision or date.

Group commits into final user or operator outcomes. Omit additions reverted within the range, fold prerelease corrections into final behavior, and exclude internal housekeeping unless it affects compatibility, packaging, security or operations. Do not recount rejected session-only proposals as release exclusions. Keep material removals, deprecations and known limits visible. Each claim needs evidence; inspect coverage for meaningful omissions without forcing a permanent ledger or per-commit transcript.

Project only the requested or existing surfaces:

- **Changelog:** concise cumulative notable outcomes in the project's categories; use Added, Changed, Deprecated, Removed, Fixed and Security only as a fallback, omitting empty categories.
- **Release notes:** lead with audience-relevant outcomes, required action, compatibility and validation limits. Use a stable public range link when available; do not invent links or duplicate the whole changelog.
- **Migration guidance:** state affected users, old and new behavior, ordered actions, applicable compatibility window, success checks, and known rollback or support paths. Unknown operational decisions remain explicit. Keep a short note inline and use a separate guide only when needed and authorized.

Breaking changes and required actions come first. Follow established formats; writing alone requires no Release Change, manifest edit, separate release commit or archive.

## Check surfaces and handoff

Compare claims, version, date, terminology, links and required actions across the selected surfaces and their authoritative sources. A draft may be unfinished when labelled as such; final shipped prose must remain true before and after publication. Keep pending publication, authentication, command progress and unverified live availability in the transient handoff, not shipped documents. Final comparisons use the target tag or immutable ref, not moving HEAD.

When preparing final documents, name the observed candidate and fresh relevant evidence or gaps. Document consistency is not a release-ready verdict; package checks, implementation closeout and independent acceptance follow the project's declared gates and actual authority.

For Core-routed work, release checks without a WorkOwner stay with Core and the project's declared checks; WorkOwner-declared verification uses Verify. These are caller responsibilities, not installed dependencies or permission for Doc to create a Change or execute a release workflow.

For post-publication reconciliation, use observed tag, hosted release or registry facts only as needed. Modify only authorized mutable document surfaces; immutable shipped discrepancies need a corrective version or owner. Never move tags or rewrite published packages.

Never retain passwords, tokens, device codes or authentication URLs in artifacts, command output or responses. Stop before a credential-emitting interactive step; authorized human authentication occurs in a trusted terminal and returns credential-free status.

Return the range, confirmed identity or draft state, changed surfaces, checks, material omissions and decisions. State required user/operator actions and their consequences directly; links alone are insufficient. Preserve explicitly required safe command, API and version tokens exactly in the handoff. Report evidence limits and external-action status without claiming publication or approval.
