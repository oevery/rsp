import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash } from '../evals/runner/files.mjs'

export function checkInstalledPackage(root, tarball, temporaryRoot) {
  const consumer = join(temporaryRoot, 'consumer')
  const project = join(temporaryRoot, 'project')
  const home = join(temporaryRoot, 'home')
  for (const directory of [consumer, project, home])
    mkdirSync(directory)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'rsp-install-consumer', version: '1.0.0', private: true }))
  const env = {
    PATH: process.env.PATH,
    HOME: home,
    CI: 'true',
    npm_config_userconfig: '/dev/null',
    npm_config_registry: 'https://registry.npmjs.org/',
    npm_config_cache: join(root, '.cache', 'rsp-package-install'),
  }
  const networkAllowed = process.env.RSP_INSTALL_ALLOW_NETWORK === '1'
  const install = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...(networkAllowed ? [] : ['--offline']), tarball], { cwd: consumer, env, encoding: 'utf8', timeout: 120000 })
  if (install.status !== 0)
    throw new Error(networkAllowed ? 'Clean package installation failed or timed out' : 'Offline clean install unavailable; populate the cache with RSP_INSTALL_ALLOW_NETWORK=1 explicitly')
  const packageRoot = join(consumer, 'node_modules', '@oevery', 'rsp')
  const cli = join(packageRoot, 'bin', 'rsp.mjs')
  function run(args, expectedSuccess = true) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: project, env, encoding: 'utf8', timeout: 10000 })
    if ((result.status === 0) !== expectedSuccess)
      throw new Error(`Installed CLI contract failed: ${args.join(' ')}`)
    return result.stdout
  }
  run(['init'])
  const status = JSON.parse(run(['status', '--json']))
  if (status.command !== 'status' || status.ok !== true)
    throw new Error('Installed package cannot report initialized project state')
  run(['skills', 'install', 'rsp'])
  const skill = join(project, '.agents', 'skills', 'rsp', 'SKILL.md')
  const shippedSkill = readFileSync(join(packageRoot, 'skills', 'rsp', 'SKILL.md'), 'utf8')
  if (readFileSync(skill, 'utf8') !== shippedSkill)
    throw new Error('Installed Skill does not match the tarball')
  const custom = `${shippedSkill}\nUser-owned customization.\n`
  writeFileSync(skill, custom)
  run(['skills', 'install', 'rsp'], false)
  if (readFileSync(skill, 'utf8') !== custom)
    throw new Error('Non-forced Skill refresh overwrote user customization')
  run(['skills', 'install', 'rsp', '--force'])
  if (readFileSync(skill, 'utf8') !== shippedSkill)
    throw new Error('Explicit Skill refresh did not install the packaged version')
  const agents = join(project, 'AGENTS.md')
  writeFileSync(agents, `${readFileSync(agents, 'utf8')}\n## Local policy\nPreserve this user section.\n`)
  const note = join(project, '.rsp', 'specs', 'local.md')
  writeFileSync(note, 'User-owned fact.\n')
  writeFileSync(join(project, '.rsp', 'rsp-rules.md'), 'Outdated generated fallback.\n')
  run(['update'])
  if (readFileSync(join(project, '.rsp', 'rsp-rules.md'), 'utf8') !== readFileSync(join(packageRoot, 'rules', 'rsp-rules.md'), 'utf8') || !readFileSync(agents, 'utf8').includes('Preserve this user section.') || readFileSync(note, 'utf8') !== 'User-owned fact.\n')
    throw new Error('Project update failed to refresh managed content while preserving user content')
  return {
    cleanInstall: 'passed',
    installedCli: 'passed',
    skillRefresh: 'passed',
    projectUpdate: 'passed',
    dependencyMode: networkAllowed ? 'network-explicitly-allowed' : 'offline-cache',
    packageLockHash: hash(readFileSync(join(consumer, 'package-lock.json'))),
    nodeVersion: process.version,
  }
}
