import { execFile } from 'node:child_process'
import { realpath } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { promisify } from 'node:util'
import { digest } from '../architecture/model.js'

const execute = promisify(execFile)
export interface WorkspaceSummary {
  id: string
  root: string
  title: string
  git?: { repository: string, title: string, linked: boolean, branch?: string, commit?: string }
}

export async function describeWorkspace(workspace: { id: string, root: string }): Promise<WorkspaceSummary> {
  const summary: WorkspaceSummary = { ...workspace, title: basename(workspace.root) }
  const env = { ...process.env }
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_'))
      delete env[key]
  }
  const git = async (...args: string[]) => (await execute('git', ['-C', workspace.root, ...args], { env, timeout: 2000, maxBuffer: 64 * 1024 })).stdout.trim()
  try {
    const [directory, common, branch] = await Promise.all([
      git('rev-parse', '--absolute-git-dir').then(path => realpath(path)),
      git('rev-parse', '--path-format=absolute', '--git-common-dir').then(path => realpath(path)),
      git('symbolic-ref', '--quiet', '--short', 'HEAD').catch(() => undefined),
    ])
    summary.git = {
      repository: digest(common),
      title: basename(common) === '.git' ? basename(dirname(common)) : basename(common),
      linked: directory !== common,
      ...(branch ? { branch } : { commit: await git('rev-parse', '--short', 'HEAD') }),
    }
  }
  catch {
    // Repository metadata is optional; Git failures must not block reading.
  }
  return summary
}
