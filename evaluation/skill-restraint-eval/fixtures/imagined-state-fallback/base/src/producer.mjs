import { saveReady } from './save.mjs'

export function persistCompleted(value) {
  return saveReady({ status: 'ready', value })
}
