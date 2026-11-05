# Shared work model

Read when selecting, reporting or operating a tracked RSP owner, or writing/reviewing its records, and the relevant definitions are not already available in context. Direct untracked work needs no RSP identity. These shared definitions require no Core execution.

## Work shapes

Direct work is a clear bounded request without durable continuity needs. Change retains one acceptance/delivery boundary for sustained work or recovery. Group coordinates independently acceptable/deliverable child Changes with dependencies or integration obligations. Complexity, file count and worker count alone select neither Group nor delegation. Agent topology is a separate execution choice.

Ordinary completion and checkpoint commits leave a Change open. Final delivery or an explicit close request uses the closeout policy; reopen is exceptional recovery, not the normal iteration path.

## Identity and ownership

A WorkOwner is the selected owner of the requested work: a Change, or a Group for its coordination boundary. A direct untracked request retains its explicit scope without inventing a Change, Group or WorkRef.

A Change WorkRef is its logical name: `<change>` for an ungrouped Change, or `<group>/<change>` for a grouped child. Use that identity in commands, reports and ownership trailers. Its Markdown file is `.rsp/changes/<work-ref>.md`: a location for reading or evidence, never the WorkRef value. For example, `checkout/cache-ttl` identifies the child whose file is `.rsp/changes/checkout/cache-ttl.md`. Evidence may cite a file and line separately.

A Group reference is `<group>/brief` and resolves to `.rsp/changes/<group>/00-brief.md`; it names the Group, not an executable child Change. Identities are shallow; deeper nesting is invalid. Read its Brief for shared scope and dependencies, then select the actual child before child work. Do not substitute a Group reference, Brief path or directory for a child WorkRef. A Group-level judgment retains its Group reference and identifies the included direct child Changes.

An explicit user-selected owner wins over default focus discovery. Focus markers locate open-work candidates; multiple candidates alone are not a blocker. Resolve intent and relevant state rather than guessing ownership. Preserve existing work and its owner when changing scope.

## Authority and evidence

Identity, focus, readiness, dependency state and capability availability grant no action authority. A Group Brief supplies context, not permission to implement every child. A completed check proves only its tested boundary; neither it nor a review report grants lifecycle completion, Git delivery, publication or approval. Each capability retains its own action and stop conditions.

In a Change's Blockers, record only unresolved dependencies or decisions preventing required work. Write standalone `None` when none remain; keep non-blocking verification limits in Verify. Exact prerequisites use ``- requires `<work-ref>`: <reason>``. Other prose, including an explanation after `None`, remains an external blocker declaration.

Use only the selected owner's relevant artifacts and authoritative project context. Installed files are shared across the suite, but separate workers do not inherit one another's loaded instructions. Reuse applicable definitions in the same context; obtain this file before depending on missing definitions. If the shared resource is unavailable, report an incomplete suite and stop dependent actions rather than inventing a substitute or installing implicitly.

## Current work records

A Change retains six sections: Proposal, Spec, Design, Tasks, Verify and Blockers. During work it states the current authorized intent, approach and actual progress; at closeout it records the delivered outcome. Update affected content as facts change instead of appending rounds, dates or session summaries. Keep a date only when it matters to provenance or applicability. Record cleanup never authorizes dropping unmet scope or acceptance obligations.

- **Tasks:** keep current checkable work and completion. Replace, split or merge tasks within authorized scope; reopen or rewrite invalidated results. Routine attempts, fixes, retries and individual check runs are not new tasks. Completion proves neither verification nor independent or human acceptance.
- **Verify:** default to Required/Optional checklists only. Admit supplementary text only for an unresolved acceptance limit, a condition or reference necessary to reuse evidence, or an explicitly required audit fact; delete text meeting none of these conditions. Remove repeated results, test counts, execution narration and diagnosis/fix stories. An audit-required resolved failure retains only the failure and final disposition. Preserve applicable evidence scope and distinguish full review, correction-only re-review and human acceptance; mark invalidated coverage incomplete. Keep shared evidence once and detailed records with their existing owner.
- **Focus:** keep only additional context needed to resume safely or avoid costly repeated discovery; refer to Change state without maintaining a second task, verification or blocker list. The conditional [Focus method](focus-continuation.md) owns replacement and cleanup. Ordinary progress needs no snapshot.

Keep decision rationale and useful outcome comparisons in their owning sections; they do not exempt Verify text from the admission rule above. Do not relocate discarded narration into another section, Focus, an appendix or a new report. Prose cleanup does not remove tests, raw evidence, reports, conversation or Git history.
