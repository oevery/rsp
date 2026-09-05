# Fixture instructions

- Review observable state ownership and cancellation contracts.
- Workspace changes must clear workspace-local transient state.
- All provider-specific abort forms normalize to `OperationCancelled`.
- Persistence ports accept an `AbortSignal` and must reject atomically before commit when cancellation wins.
- Separate automated evidence from authenticated external acceptance.
