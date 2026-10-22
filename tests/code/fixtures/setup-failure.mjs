import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { relative } from 'node:path'

const { rename, link, unlink, writeFile, readFile, readdir } = fs
const { lstatSync } = fsSync
const scenario = process.env.RSP_TEST_FAILURE
let injected = false
let archiveReads = 0
function fail() {
  injected = true
  process.stderr.write(`failure-injected:${scenario}\n`)
  throw new Error(`injected ${scenario} failure`)
}
function denyAccess(path) {
  if (!injected)
    process.stderr.write(`failure-injected:${scenario}\n`)
  injected = true
  throw Object.assign(new Error(`EACCES: permission denied, ${path}`), { code: 'EACCES' })
}
function beforePublication(from, to) {
  if (injected)
    return
  const path = relative(process.cwd(), String(to)).replaceAll('\\', '/')
  if (scenario === 'skill' && String(from).includes('.rsp-skills-') && path === '.agents/skills/rsp-review')
    fail()
  if ((scenario === 'agents' && path === 'AGENTS.md') || (scenario === 'pin' && path === '.rsp/version'))
    fail()
}
fs.rename = async (from, to) => {
  beforePublication(from, to)
  return rename(from, to)
}
fs.link = async (from, to) => {
  beforePublication(from, to)
  return link(from, to)
}
fs.unlink = async (path) => {
  if (!injected && scenario === 'index' && String(path).replaceAll('\\', '/').endsWith('.rsp/specs/INDEX.md'))
    fail()
  return unlink(path)
}
fs.writeFile = async (path, ...args) => {
  const result = await writeFile(path, ...args)
  if (!injected && scenario === 'prepare' && String(path).includes('.rsp-write-'))
    fail()
  return result
}
fs.readFile = async (path, ...args) => {
  if (scenario === 'agents-permissions' && String(path) === 'AGENTS.md')
    denyAccess(path)
  if (String(path).replaceAll('\\', '/').endsWith('.rsp/archives/INDEX.md')) {
    archiveReads += 1
    if (!injected && (scenario === 'archive-read' || (scenario === 'archive-recheck' && archiveReads === 2)))
      fail()
  }
  return readFile(path, ...args)
}
fs.readdir = async (path, ...args) => {
  if (scenario === 'decision-permissions' && String(path).replaceAll('\\', '/').endsWith('.rsp/specs/decisions'))
    denyAccess(path)
  return readdir(path, ...args)
}
fsSync.lstatSync = (path, ...args) => {
  if (scenario === 'design-permissions' && String(path).replaceAll('\\', '/').endsWith('.rsp/specs/design.md'))
    denyAccess(path)
  return lstatSync(path, ...args)
}
syncBuiltinESMExports()
