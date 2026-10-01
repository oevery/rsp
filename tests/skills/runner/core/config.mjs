import { readFileSync } from 'node:fs'
import { parse } from 'smol-toml'
import { hash } from './files.mjs'

export const configPath = new URL('../../config.toml', import.meta.url)
export function loadConfig(path = configPath) {
  const source = readFileSync(path, 'utf8')
  const value = parse(source)
  for (const role of ['executor', 'judge']) {
    if (!value[role]?.model || !value[role]?.model_reasoning_effort || Object.keys(value[role]).length !== 2)
      throw new Error(`Invalid shared ${role} configuration`)
  }
  return { ...value, hash: hash(source) }
}
