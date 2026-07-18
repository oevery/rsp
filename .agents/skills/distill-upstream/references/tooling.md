# Tooling strategy

Use for source synchronization, generation, installation, packaging, or distribution implementations.

## Examine

- Inputs, outputs, persistent state, failure modes, and trust boundaries.
- Deterministic mechanisms that should remain in scripts rather than skill prose.
- Cross-agent portability and repository-versus-published-package behavior.
- Repository-level and target-path licenses before recommending code reuse.

## Report

- Distinguish interface compatibility from code reuse.
- Complete `License and Reuse`, including target-path licensing rather than assuming the repository root applies.
- Prefer behavior tests and small adapters over copying a complete toolchain.
- Record security, network, timeout, cache, and update semantics.
- Recommend direct reuse only when the license and maintenance burden are explicit; otherwise recommend independent implementation from observed behavior.
