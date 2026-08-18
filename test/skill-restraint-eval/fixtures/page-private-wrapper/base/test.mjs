import assert from 'node:assert/strict'
import { openDialog } from './src/page.mjs'

const state = { dialogOpen: false }
openDialog(state)
assert.equal(state.dialogOpen, true)
