import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import { BrokerError } from './protocol.js'

export interface BrokerHostEnvironment {
  RSP_BROKER_CACHE_HOME?: string
  XDG_CACHE_HOME?: string
  LOCALAPPDATA?: string
}

export interface BrokerPaths {
  root: string
  discovery: string
  startLock: string
  projects: string
}

export interface ParsedLoopbackEndpoint {
  endpoint: string
  hostHeader: string
  port: number
}

export function resolveBrokerCacheRoot(options: {
  env?: BrokerHostEnvironment
  homeDir?: string
  platform?: NodeJS.Platform
} = {}): string {
  const env = options.env ?? process.env
  const home = options.homeDir ?? homedir()
  const platform = options.platform ?? process.platform
  if (env.RSP_BROKER_CACHE_HOME)
    return resolve(env.RSP_BROKER_CACHE_HOME)
  if (env.XDG_CACHE_HOME)
    return resolve(env.XDG_CACHE_HOME, 'rsp', 'broker')
  if (platform === 'win32' && env.LOCALAPPDATA)
    return resolve(env.LOCALAPPDATA, 'rsp', 'broker')
  if (platform === 'darwin')
    return resolve(home, 'Library', 'Caches', 'rsp', 'broker')
  return resolve(home, '.cache', 'rsp', 'broker')
}

export function resolveBrokerPaths(options: {
  env?: BrokerHostEnvironment
  homeDir?: string
  platform?: NodeJS.Platform
  root?: string
} = {}): BrokerPaths {
  const root = options.root
    ? resolve(options.root)
    : resolveBrokerCacheRoot(options)
  return {
    root,
    discovery: join(root, 'discovery.json'),
    startLock: join(root, 'start.lock'),
    projects: join(root, 'projects'),
  }
}

export function parseLoopbackEndpoint(value: string): ParsedLoopbackEndpoint {
  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    throw new BrokerError('broker_endpoint_invalid', `Broker endpoint is not a valid URL: ${value}`)
  }
  const port = Number(url.port)
  if (url.protocol !== 'http:'
    || url.hostname !== '127.0.0.1'
    || !Number.isSafeInteger(port)
    || port <= 0
    || port > 65_535
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash) {
    throw new BrokerError('broker_endpoint_invalid', `Broker endpoint must be an exact loopback HTTP origin: ${value}`)
  }
  return {
    endpoint: url.origin,
    hostHeader: `127.0.0.1:${port}`,
    port,
  }
}

export function isLoopbackPeer(address: string | undefined): boolean {
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1'
}
