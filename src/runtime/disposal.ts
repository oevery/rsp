import type { BrokerHostEnvironment } from '../broker/host.js'
import type { RuntimeDisposalScope } from './store.js'
import { resolveBrokerPaths } from '../broker/host.js'
import {
  brokerProjectNamespace,
  discoverBrokerProject,
} from '../broker/project.js'

export interface RuntimeDisposalTargetOptions {
  cwd?: string
  env?: BrokerHostEnvironment
  homeDir?: string
  platform?: NodeJS.Platform
  cacheRoot?: string
}

export interface RuntimeDisposalTarget extends RuntimeDisposalScope {
  projectId: string
}

/**
 * Resolve only the current canonical Git checkout's runtime namespace. This
 * does not start Broker, mint a token, inspect another namespace, or delete.
 */
export async function resolveRuntimeDisposalTarget(
  options: RuntimeDisposalTargetOptions = {},
): Promise<RuntimeDisposalTarget> {
  const project = await discoverBrokerProject(options.cwd)
  const paths = resolveBrokerPaths({
    env: options.env,
    homeDir: options.homeDir,
    platform: options.platform,
    root: options.cacheRoot,
  })
  return {
    projectId: project.projectId,
    cacheRoot: paths.root,
    projectsRoot: paths.projects,
    namespacePath: brokerProjectNamespace(paths.projects, project.projectId),
  }
}
