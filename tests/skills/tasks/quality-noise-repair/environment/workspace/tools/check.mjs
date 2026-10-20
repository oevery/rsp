import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
const tests = readdirSync('test').filter(name => name.endsWith('.test.mjs')).map(name => 'test/' + name)
const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' })
process.exitCode = result.status ?? 1
