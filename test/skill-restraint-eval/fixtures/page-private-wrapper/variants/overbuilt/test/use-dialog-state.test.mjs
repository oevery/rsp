import assert from 'node:assert/strict'
import { createDialogState } from '../src/use-dialog-state.mjs'

const state = { dialogOpen: false }
createDialogState(state).open()
assert.equal(state.dialogOpen, true)
