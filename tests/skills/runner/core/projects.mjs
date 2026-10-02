import { execFileSync } from 'node:child_process'
import { closeSync, cpSync, existsSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { copyDependencies } from './dependencies.mjs'
import { hash, treeFiles } from './files.mjs'

function directory(root, id) {
  if (!/^(?:small|real|complex)\/[a-z0-9-]+$/u.test(id))
    throw new Error('Unsafe project ID')
  const path = join(root, 'tests/skills/projects', id)
  treeFiles(path, { rejectLinks: true })
  return path
}

export function projectIdentity(root, id) {
  if (!id)
    return null
  const path = directory(root, id)
  const descriptor = join(path, 'project.json')
  const files = treeFiles(path, { rejectLinks: true })
  if (!existsSync(descriptor))
    return { id, hash: hash(files), kind: 'fixture' }
  const spec = JSON.parse(readFileSync(descriptor, 'utf8'))
  if (spec.kind !== 'git-snapshot' || !/^[a-f0-9]{40}$/u.test(spec.commit) || !Array.isArray(spec.paths) || !spec.paths.length
    || spec.paths.some(p => typeof p !== 'string' || !/^[\w.-]+$/u.test(p) || ['.git', '.agents', '.codex', '..', '.'].includes(p))) {
    throw new Error('Invalid fixed project snapshot')
  }
  const tree = execFileSync('git', ['ls-tree', '-r', spec.commit, '--', ...spec.paths], { cwd: root, encoding: 'utf8', maxBuffer: Infinity })
  if (!tree.trim() || tree.split('\n').filter(Boolean).some(line => !line.startsWith('100644 ') && !line.startsWith('100755 ')))
    throw new Error('Snapshot contains unsupported links or submodules')
  return { id, kind: spec.kind, commit: spec.commit, paths: spec.paths, treeHash: hash(tree), hash: hash({ files, tree }) }
}

export function materializeProject(root, entry, workspace) {
  const id = entry.manifest.project
  if (!id)
    return
  const identity = projectIdentity(root, id)
  if (entry.project && entry.project.hash !== identity.hash)
    throw new Error('Project changed after selection')
  const path = directory(root, id)
  if (identity.kind === 'git-snapshot') {
    const temporary = mkdtempSync(join(tmpdir(), 'rsp-project-archive-'))
    const archive = join(temporary, 'source.tar')
    try {
      const fd = openSync(archive, 'w', 0o600)
      try {
        execFileSync('git', ['archive', '--format=tar', identity.commit, '--', ...identity.paths], { cwd: root, stdio: ['ignore', fd, 'pipe'], maxBuffer: Infinity })
      }
      finally { closeSync(fd) }
      execFileSync('tar', ['-xf', archive, '-C', workspace], { maxBuffer: Infinity })
    }
    finally { rmSync(temporary, { recursive: true, force: true }) }
    copyDependencies(root, join(workspace, 'node_modules'), { build: true, lockSource: readFileSync(join(workspace, 'pnpm-lock.yaml'), 'utf8') })
    execFileSync(process.execPath, [join(workspace, 'node_modules/tsup/dist/cli-default.js')], { cwd: workspace, timeout: 60000, stdio: 'pipe', maxBuffer: Infinity })
    if (!existsSync(join(workspace, 'dist/cli.mjs')))
      throw new Error('Fixed real project did not build')
  }
  else {
    const files = treeFiles(path, { rejectLinks: true })
    if (Object.keys(files).some(p => p.split('/').some(s => ['.git', '.agents', '.codex', 'node_modules'].includes(s))))
      throw new Error('Project contains reserved host metadata')
    cpSync(path, workspace, { recursive: true })
  }
}
