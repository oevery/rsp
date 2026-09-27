import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { hash, treeFiles } from '../runner/files.mjs'

export function git(workspace, args) {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'commit.gpgsign=false', '-C', workspace, ...args], {
    encoding: 'utf8',
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
    if (entry.manifest.fixture) {
      const fixture = join(entry.directory, entry.manifest.fixture)
      const files = treeFiles(fixture, { rejectLinks: true })
      if (['.git', '.agents', '.codex'].some(name => existsSync(join(fixture, name))))
        throw new Error('Fixture contains reserved host metadata')
      if (Object.keys(files).some(path => path.split('/').includes('.git') || path.startsWith('.agents/') || path.startsWith('.codex/')))
        throw new Error('Fixtures must not install Git metadata or host Skills/config')
      cpSync(fixture, workspace, { recursive: true })
    }
    compositionIdentity(composition)
    if (entry.manifest.tooling === 'rsp-cli') {
      const target = join(workspace, '.tooling', 'rsp')
      mkdirSync(target, { recursive: true })
      // Explicit interpreter entrypoint survives host shells that reset PATH.
      symlinkSync(process.execPath, join(workspace, '.tooling', 'node'), 'file')
      for (const name of ['bin', 'dist', 'rules', 'package.json'])
        cpSync(join(root, name), join(target, name), { recursive: true })
      // CLI dependency resolution uses the installed dependency cache, not repo
      // source or Skills. Keep it outside the agent's observable fixture tree.
      symlinkSync(join(root, 'node_modules'), join(target, 'node_modules'), 'dir')
      if (existsSync(join(workspace, '.rsp')))
        cpSync(join(root, 'rules', 'rsp-rules.md'), join(workspace, '.rsp', 'rsp-rules.md'))
    }
    if (composition) {
      mkdirSync(join(workspace, '.agents'), { recursive: true })
      cpSync(composition, join(workspace, '.agents', 'skills'), { recursive: true })
    }
    git(workspace, ['init', '--quiet'])
    git(workspace, ['config', 'user.name', 'RSP Evaluation'])
    git(workspace, ['config', 'user.email', 'rsp-evaluation@example.invalid'])
    git(workspace, ['add', '--all', '--force'])
    git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'evaluation baseline'])
    for (const [path, content] of Object.entries(entry.manifest.working_tree ?? {})) {
      mkdirSync(dirname(join(workspace, path)), { recursive: true })
      writeFileSync(join(workspace, path), content)
    }
    for (const path of entry.manifest.staged_paths ?? [])
      git(workspace, ['add', '--', path])
    return workspace
  }
  catch (error) {
    rmSync(workspace, { recursive: true, force: true })
    throw error
  }
}

export function workspaceObservation(workspace, baseline) {
  const files = treeFiles(workspace, { excludeGit: true })
  const changedPaths = baseline
    ? [...new Set([...Object.keys(baseline.files), ...Object.keys(files)])].filter(path => baseline.files[path] !== files[path]).sort()
    : []
  const artifacts = Object.create(null)
  const omittedArtifacts = []
  let bytes = 0
  const fileModes = Object.create(null)
  for (const path of Object.keys(files)) {
    if (path.startsWith('.agents/skills/') || path.startsWith('.tooling/') || !existsSync(join(workspace, path)))
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
  return {
    head: git(workspace, ['rev-parse', 'HEAD']).trim(),
    status: git(workspace, ['status', '--porcelain=v1', '--untracked-files=all']),
    files,
    changedPaths,
    artifacts,
    omittedArtifacts,
    fileModes,
    baseline: baseline?.files,
    baselineHead: baseline?.head,
    indexHash: hash(git(workspace, ['ls-files', '--stage', '-z'])),
    baselineIndexHash: baseline?.indexHash,
    diff: baseline ? git(workspace, ['diff', '--no-ext-diff', '--no-textconv', baseline.head, '--', '.']) : '',
    skillTreeHash: existsSync(join(workspace, '.agents', 'skills')) ? hash(treeFiles(join(workspace, '.agents', 'skills'))) : hash({}),
  }
}
