# Shared work model

Read when selecting, reporting or operating a tracked RSP owner and these definitions are not already available in the current context. Direct untracked work needs no RSP identity. This file defines identities, not a requirement to execute Core.

## Identity and ownership

A WorkOwner is the selected owner of the requested work: a Change, or a Group for its coordination boundary. A direct untracked request retains its explicit scope without inventing a Change, Group or WorkRef.

A Change WorkRef is its logical name: `<change>` for an ungrouped Change, or `<group>/<change>` for a grouped child. Use that identity in commands, reports and ownership trailers. Its Markdown file is `.rsp/changes/<work-ref>.md`: a location for reading or evidence, never the WorkRef value. For example, `checkout/cache-ttl` identifies the child whose file is `.rsp/changes/checkout/cache-ttl.md`. Evidence may cite a file and line separately.

A Group reference is `<group>/brief` and resolves to `.rsp/changes/<group>/00-brief.md`; it names the Group, not an executable child Change. Identities are shallow; deeper nesting is invalid. Read its Brief for shared scope and dependencies, then select the actual child before child work. Do not substitute a Group reference, Brief path or directory for a child WorkRef. A Group-level judgment retains its Group reference and identifies the included direct child Changes.

An explicit user-selected owner wins over default focus discovery. Focus markers locate open-work candidates; multiple candidates alone are not a blocker. Resolve intent and relevant state rather than guessing ownership. Preserve existing work and its owner when changing scope.

## Authority and evidence

Identity, focus, readiness, dependency state and capability availability grant no action authority. A Group Brief supplies context, not permission to implement every child. A completed check proves only its tested boundary; neither it nor a review report grants lifecycle completion, Git delivery, publication or approval. Each capability retains its own action and stop conditions.

Use only the selected owner's relevant artifacts and authoritative project context. Installed files are shared across the suite, but separate workers do not inherit one another's loaded instructions. Reuse applicable definitions in the same context; obtain this file before depending on missing definitions. If the shared resource is unavailable, report an incomplete suite and stop identity-dependent actions rather than inventing a substitute or installing implicitly.
