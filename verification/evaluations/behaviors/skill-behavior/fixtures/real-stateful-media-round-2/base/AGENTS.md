# Fixture instructions

- Review observable state ownership and cancellation contracts.
- Workspace changes must clear workspace-local transient state.
- All provider-specific abort forms normalize to `OperationCancelled`.
- Do not report already-correct behavior merely because it was defective in an earlier revision.
