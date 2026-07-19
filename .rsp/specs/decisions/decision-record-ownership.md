# Separate current facts from lasting rationale

RSP keeps current facts in Specs and lasting rationale in Decision Records because mixing both makes the durable layer harder to update and encourages narrative accumulation. Each Host Project has exactly one authoritative Decision Record directory—defaulting to `.rsp/specs/decisions` with one optional external project-relative path—so agents can route rationale deterministically without discovery, duplicate authorities, or host-specific adapters.

## Considered Options

- Keep rationale only in Changes and archives: rejected because completed history is not an authoritative owner for decisions future work must understand.
- Store rationale alongside current facts in Specs: rejected because rationale and present truth change for different reasons and would become competing narrative.
- Discover or merge multiple ADR directories: rejected because ambiguous ownership and precedence would expand the core protocol into a resolver.

## Consequences

- Durable review decides current-fact updates and Decision Record updates independently.
- The CLI validates and reports the authoritative directory but never invents a Decision Record filename or promotes Change content automatically.
- Switching to an external directory changes authority but does not delete the default directory or migrate existing records automatically; `rsp doctor` keeps inactive Markdown records visible as a manual migration issue.
