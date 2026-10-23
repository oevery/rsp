import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkSkillPackage } from '../../../scripts/skill-package-check.mjs'

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
    npm_config_cache: process.env.npm_config_cache || process.env.NPM_CONFIG_CACHE || join(root, '.cache', 'rsp-package-install'),
  }
  const networkAllowed = process.env.RSP_INSTALL_ALLOW_NETWORK === '1'
  const install = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...(networkAllowed ? [] : ['--offline']), tarball], { cwd: consumer, env, encoding: 'utf8', timeout: 120000 })
  if (install.status !== 0)
    throw new Error(networkAllowed ? 'Clean package installation failed or timed out' : 'Offline clean install unavailable; populate the cache with RSP_INSTALL_ALLOW_NETWORK=1 explicitly')
  const packageRoot = join(consumer, 'node_modules', '@oevery', 'rsp')
  const cli = join(packageRoot, 'bin', 'rsp.mjs')
  function run(args, expectedSuccess = true) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: project, env, encoding: 'utf8', timeout: 10000 })
    if (result.status === null || (result.status === 0) !== expectedSuccess)
      throw new Error(`Installed CLI contract failed: ${args.join(' ')}`)
    return result.stdout
  }
  run(['init'])
  const status = JSON.parse(run(['status', '--json']))
  if (status.command !== 'status' || status.ok !== true)
    throw new Error('Installed package cannot report initialized project state')
  run(['skills', 'install', 'rsp-review'], false)
  for (const name of ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-doc', 'rsp-review', 'rsp-verify', 'rsp-commit']) {
    if (checkSkillPackage(join(project, '.agents', 'skills', name), { suiteRoot: join(project, '.agents', 'skills') }).status !== 'passed')
      throw new Error(`Installed suite has invalid or missing resources: ${name}`)
  }
  const skill = join(project, '.agents', 'skills', 'rsp', 'SKILL.md')
  const shippedSkill = readFileSync(join(packageRoot, 'skills', 'rsp', 'SKILL.md'), 'utf8')
  if (readFileSync(skill, 'utf8') !== shippedSkill)
    throw new Error('Installed Skill does not match the tarball')
  const custom = `${shippedSkill}\nUser-owned customization.\n`
  writeFileSync(skill, custom)
  run(['update', '--dry-run'])
  if (readFileSync(skill, 'utf8') !== custom)
    throw new Error('Update preview modified managed content')
  run(['update'])
  if (readFileSync(skill, 'utf8') !== shippedSkill)
    throw new Error('Complete update did not install the packaged Skill')
  const agents = join(project, 'AGENTS.md')
  writeFileSync(agents, `${readFileSync(agents, 'utf8')}\n## Local policy\nPreserve this user section.\n`)
  const note = join(project, '.rsp', 'specs', 'local.md')
  writeFileSync(note, 'User-owned fact.\n')
  if (existsSync(join(project, '.rsp', 'rsp-rules.md')))
    throw new Error('Init generated a retired Rules fallback')
  run(['update'])
  if (readFileSync(join(project, '.rsp', 'version'), 'utf8').trim() !== JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version || !readFileSync(agents, 'utf8').includes('Preserve this user section.') || readFileSync(note, 'utf8') !== 'User-owned fact.\n')
    throw new Error('Project update failed to refresh managed content while preserving user content')
  return {
    cleanInstall: 'passed',
    installedCli: 'passed',
    skillRefresh: 'passed',
    projectUpdate: 'passed',
    dependencyMode: networkAllowed ? 'network-explicitly-allowed' : 'offline-cache',
    nodeVersion: process.version,
  }
}
