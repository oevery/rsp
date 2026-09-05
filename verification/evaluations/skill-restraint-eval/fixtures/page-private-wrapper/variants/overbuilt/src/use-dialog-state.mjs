export function createDialogState(state) {
  return {
    open() {
      state.dialogOpen = true
    },
  }
}
