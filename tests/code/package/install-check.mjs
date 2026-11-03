import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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
  const architecture = {
    schemaVersion: 1,
    nodes: [{ id: 'app', title: 'Packaged app', description: 'Installed viewer fixture' }],
    relations: [],
    views: [{ id: 'overview', title: 'Overview', node: 'app', include: ['app'] }],
    bindings: [],
  }
  writeFileSync(join(project, '.rsp', 'architecture.json'), JSON.stringify(architecture))
  if (JSON.parse(run(['architecture', '--json', '--compact'])).nodes[0].id !== 'app')
    throw new Error('Installed architecture query failed')
  try {
    const opened = run(['view', '--no-open'])
    if (!/^http:\/\/127\.0\.0\.1:\d+\/\?workspace=/u.test(opened.trim()))
      throw new Error('Installed viewer did not provide its workspace URL')
    const viewerStatus = JSON.parse(run(['view', 'status']))
    if (viewerStatus.workspaces.length !== 1 || !viewerStatus.workspaces[0].revision)
      throw new Error('Installed viewer did not retain its isolated workspace')
    // Probe the same-package browser assets without installing or compiling a frontend.
    const assets = spawnSync(process.execPath, ['--input-type=module', '-e', 'for (const file of ["app.js", "app.css"]) { const response = await fetch(new URL(file, process.argv[1])); if (!response.ok || !(await response.text()).length) process.exit(1) }', opened.trim()], { cwd: project, env, encoding: 'utf8', timeout: 10000 })
    if (assets.status !== 0)
      throw new Error('Installed frontend assets were unavailable')
    const paths = ['dist/viewer/app.js', 'dist/viewer/app.css', 'package.json']
    const originals = paths.map(path => readFileSync(join(packageRoot, path)))
    try {
      writeFileSync(join(packageRoot, paths[0]), 'replacement JS')
      writeFileSync(join(packageRoot, paths[1]), 'replacement CSS')
      writeFileSync(join(packageRoot, paths[2]), JSON.stringify({ ...JSON.parse(originals[2]), version: '999.0.0' }))
      const snapshot = spawnSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict'
        import { createHash } from 'node:crypto'
        const url = new URL(process.argv[1])
        for (const [index, file] of ['app.js', 'app.css'].entries()) {
          const content = await (await fetch(new URL(file, url))).text()
          assert.equal(createHash('sha256').update(content).digest('hex'), process.argv[index + 2])
        }
        const token = new URLSearchParams(url.hash.slice(1)).get('token')
        const response = await fetch(new URL('/api/workspaces/' + url.searchParams.get('workspace') + '/model', url), { headers: { Authorization: 'Bearer ' + token } })
        assert.equal(response.status, 200)
      `, opened.trim(), ...originals.slice(0, 2).map(value => createHash('sha256').update(value).digest('hex'))], { cwd: project, env, encoding: 'utf8', timeout: 10000 })
      if (snapshot.status !== 0)
        throw new Error(`Installed running service did not retain its startup runtime: ${snapshot.stderr}`)
    }
    finally {
      paths.forEach((path, index) => writeFileSync(join(packageRoot, path), originals[index]))
    }
  }
  finally {
    run(['view', 'stop'])
  }
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
  function installedBytes(directory) {
    return readdirSync(directory).reduce((total, entry) => {
      const path = join(directory, entry)
      const stat = lstatSync(path)
      return total + (stat.isDirectory() ? installedBytes(path) : stat.isFile() ? stat.size : 0)
    }, 0)
  }
  return {
    cleanInstall: 'passed',
    installedCli: 'passed',
    skillRefresh: 'passed',
    projectUpdate: 'passed',
    architectureViewer: 'passed',
    dependencyMode: networkAllowed ? 'network-explicitly-allowed' : 'offline-cache',
    nodeVersion: process.version,
    installedBytes: installedBytes(join(consumer, 'node_modules')),
  }
}
