import { parseConfig } from './legacy-parser.mjs'

export function loadConfig(source) {
  return parseConfig(source)
}
