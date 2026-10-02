import { execFileSync } from 'node:child_process'
import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { copyDependencies } from '../core/dependencies.mjs'
import { hash, treeFiles } from '../core/files.mjs'
import { materializeProject } from '../core/projects.mjs'

export function git(workspace, args, encoding = 'utf8') {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'commit.gpgsign=false', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', '-C', workspace, ...args], {
    encoding,
    env: { PATH: process.env.PATH, HOME: workspace, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
  })
}

export function compositionIdentity(source) {
  if (!source)
    return { hash: hash({}), skills: [] }
  const files = treeFiles(source, { rejectLinks: true })
  const skills = Object.keys(files).filter(path => /^[^/]+\/SKILL\.md$/u.test(path)).map(path => path.split('/')[0])
  if (!skills.length || Object.keys(files).some(path => !skills.includes(path.split('/')[0])))
    throw new Error('Composition must contain only complete Skill packages')
  return { hash: hash(files), skills }
}

export function prepareWorkspace(entry, root, composition = null) {
  const workspace = mkdtempSync(join(tmpdir(), 'rsp-evaluation-'))
  try {
    materializeProject(root, entry, workspace)
    for (const patch of entry.manifest.patches ?? []) {
      const path = join(workspace, patch.path)
      const source = readFileSync(path, 'utf8')
      if (source.split(patch.before).length !== 2)
        throw new Error('Defect overlay does not match fixed source uniquely')
      writeFileSync(path, source.replace(patch.before, patch.after))
    }
    compositionIdentity(composition)
    if (entry.manifest.tooling === 'rsp-cli') {
      const target = join(workspace, '.tooling', 'rsp')
      mkdirSync(target, { recursive: true })
      // Explicit interpreter entrypoint survives host shells that reset PATH.
      symlinkSync(process.execPath, join(workspace, '.tooling', 'node'), 'file')
      for (const name of ['bin', 'dist', 'rules', 'package.json'])
        cpSync(join(root, name), join(target, name), { recursive: true })
      copyDependencies(root, join(target, 'node_modules'))
      if (existsSync(join(workspace, '.rsp')))
        cpSync(join(root, 'rules', 'rsp-rules.md'), join(workspace, '.rsp', 'rsp-rules.md'))
    }
    if (composition) {
      mkdirSync(join(workspace, '.agents'), { recursive: true })
      cpSync(composition, join(workspace, '.agents', 'skills'), { recursive: true })
    }
    git(workspace, ['init', '--quiet'])
    if (entry.manifest.tooling === 'rsp-cli')
      appendFileSync(join(workspace, '.git', 'info', 'exclude'), '\n/.tooling/\n')
    git(workspace, ['config', 'user.name', 'RSP Evaluation'])
    git(workspace, ['config', 'user.email', 'rsp-evaluation@example.invalid'])
    git(workspace, ['add', '--all'])
    git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'evaluation baseline'])
    for (const [path, content] of Object.entries(entry.manifest.working_tree ?? {})) {
      mkdirSync(dirname(join(workspace, path)), { recursive: true })
      writeFileSync(join(workspace, path), content)
    }
    for (const path of entry.manifest.staged_paths ?? [])
      git(workspace, ['add', '--force', '--', path])
    return workspace
  }
  catch (error) {
    rmSync(workspace, { recursive: true, force: true })
    throw error
  }
}

export function workspaceObservation(workspace, baseline, priorityPaths = []) {
  const files = treeFiles(workspace, { excludeGit: true })
  const changedPaths = baseline
    ? [...new Set([...Object.keys(baseline.files), ...Object.keys(files)])].filter(path => baseline.files[path] !== files[path]).sort()
    : []
  const artifacts = Object.create(null)
  const omittedArtifacts = []
  let bytes = 0
  const fileModes = Object.create(null)
  const artifactPaths = [...new Set([...changedPaths, ...priorityPaths, 'package.json', ...Object.keys(files)])].filter(path => Object.hasOwn(files, path))
  for (const path of artifactPaths) {
    if (path.startsWith('.agents/skills/') || path.startsWith('.tooling/') || path.startsWith('node_modules/') || path.startsWith('dist/') || !existsSync(join(workspace, path)))
      continue
    const stat = lstatSync(join(workspace, path))
    fileModes[path] = stat.mode & 0o111
    if (!stat.isFile() || stat.size > 65536 || bytes + stat.size > 262144) {
      omittedArtifacts.push(path)
      continue
    }
    const content = readFileSync(join(workspace, path))
    if (content.includes(0)) {
      omittedArtifacts.push(path)
      continue
    }
    artifacts[path] = content.toString('utf8')
    bytes += content.length
  }
  const head = git(workspace, ['rev-parse', 'HEAD']).trim()
  const indexSource = git(workspace, ['ls-files', '--stage', '-z'])
  const index = Object.create(null)
  for (const entry of indexSource.split('\0').filter(Boolean)) {
    const tab = entry.indexOf('\t')
    const path = entry.slice(tab + 1)
    ;(index[path] ??= []).push(entry.slice(0, tab))
  }
  const unchangedHead = baseline?.head === head && baseline.git
  const tree = unchangedHead ? baseline.git.tree : Object.create(null)
  if (!unchangedHead) {
    for (const entry of git(workspace, ['ls-tree', '-r', '-z', head]).split('\0').filter(Boolean)) {
      const tab = entry.indexOf('\t')
      const [mode, , oid] = entry.slice(0, tab).split(' ')
      tree[entry.slice(tab + 1)] = `${mode} ${oid}`
    }
  }
  const committedContentHashes = Object.create(null)
  const committedFilesMatchWorktree = Object.create(null)
  if (baseline?.git) {
    for (const path of Object.keys(tree)) {
      if (tree[path] !== baseline.git.tree[path] && tree[path].startsWith('100644 ')) {
        committedContentHashes[path] = hash(git(workspace, ['cat-file', 'blob', tree[path].split(' ')[1]], null))
        // Compare original bytes here, never persisted/scrubbed artifact text.
        committedFilesMatchWorktree[path] = Object.hasOwn(artifacts, path) ? hash(readFileSync(join(workspace, path))) === committedContentHashes[path] : null
      }
    }
  }
  const commit = unchangedHead ? null : git(workspace, ['show', '-s', '--format=%P%x00%B', head])
  const separator = commit?.indexOf('\0')
  const gitEvidence = {
    tree,
    index,
    committedContentHashes,
    parents: unchangedHead ? baseline.git.parents : commit.slice(0, separator).trim().split(' ').filter(Boolean),
    headLog: git(workspace, ['reflog', 'show', '--format=%H', 'HEAD']).trim().split('\n').filter(Boolean),
    message: unchangedHead ? baseline.git.message : commit.slice(separator + 1).replace(/\n$/u, ''),
  }
  return {
    head,
    workspaceRoot: workspace,
    git: gitEvidence,
    baselineGit: baseline?.git,
    status: git(workspace, ['status', '--porcelain=v1', '--untracked-files=all']),
    files,
    changedPaths,
    artifacts,
    committedFilesMatchWorktree,
    omittedArtifacts,
    fileModes,
    baseline: baseline?.files,
    baselineHead: baseline?.head,
    indexHash: hash(indexSource),
    baselineIndexHash: baseline?.indexHash,
    diff: git(workspace, ['diff', '--no-ext-diff', '--no-textconv', baseline?.head ?? 'HEAD', '--', '.']),
    skillTreeHash: existsSync(join(workspace, '.agents', 'skills')) ? hash(treeFiles(join(workspace, '.agents', 'skills'))) : hash({}),
  }
}

// Retain task text and installed guidance before the disposable workspace is
// removed. Never follow links or copy Git/dependency/provider state. The normal
// snapshot budget bounds this pass; omissions remain explicit review evidence.
export function retainWorkspace(workspace, destination, redact, priorityPaths = []) {
  const files = treeFiles(workspace, { excludeGit: true })
  const retained = []
  const omitted = []
  for (const path of Object.keys(files)) {
    const source = join(workspace, path)
    const stat = lstatSync(source)
    const parts = path.split('/')
    let reason
    if (parts.some(part => ['.git', '.codex', '.tooling', 'node_modules'].includes(part))
      || (parts.includes('dist') && !priorityPaths.includes(path))) {
      reason = 'runtime-or-dependency'
    }
    else if (parts.some(part => /^\.env(?:\.|$)|^(?:auth|credentials|secrets)(?:\.|$)|\.(?:pem|key)$/iu.test(part))) {
      reason = 'sensitive-file'
    }
    else if (!stat.isFile()) {
      reason = 'link-or-special-file'
    }
    if (reason) {
      omitted.push({ path, reason })
      continue
    }
    try {
      const bytes = readFileSync(source)
      if (bytes.includes(0)) {
        omitted.push({ path, reason: 'binary' })
        continue
      }
      const content = redact(bytes.toString('utf8'))
      const target = join(destination, path)
      mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
      writeFileSync(target, content, { mode: 0o600 })
      retained.push(path)
    }
    catch { omitted.push({ path, reason: 'unreadable' }) }
  }
  return { retained, omitted, textSemantics: 'Sanitized UTF-8 text; not original-byte or executable evidence.' }
}
