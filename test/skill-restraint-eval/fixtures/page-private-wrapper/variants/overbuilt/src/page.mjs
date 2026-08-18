import { createDialogState } from './use-dialog-state.mjs'

export function updateDialog(state, value) {
  state.dialogOpen = value
}

export function openDialog(state) {
  createDialogState(state).open()
}
