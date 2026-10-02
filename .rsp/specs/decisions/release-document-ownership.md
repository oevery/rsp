# Release document ownership

Release communication is an artifact-specific writing and review method, not an independent workflow controller. Doc owns authorized drafting and document reconciliation; Review owns fixed-scope read-only judgment. Verification, Git delivery and publication retain their existing owners.

## Alternatives

- Retain a default Release Docs Skill: preserves its entry point but duplicates general writing and review responsibility.
- Make it optional: reduces default inventory but keeps an additional owner and requires a writing fallback when absent.
- Absorb the necessary methods and remove the package: selected because existing Doc and Review already own the corresponding actions and authority boundaries.

## Consequences

Each surviving package carries a standalone conditional reference; ordinary writing and review do not load release guidance. Preserve evidence, migration, identity and credential constraints without imposing universal release Changes, separate release commits or archive gates. Existing release tooling performs mechanical work; its output does not establish semantic acceptance or grant publication authority.

The removed name requires an explicit inspected installation migration, not silent deletion of customized guidance. Historical releases and evaluation records retain their original identities and verdicts.
