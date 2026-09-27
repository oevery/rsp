import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, vi } from 'vitest'

it.skipIf(process.platform === 'win32')('watch builds before the first CLI test and rebuilds on unimported product source changes', async () => {
  const root = process.cwd()
  const directory = mkdtempSync(join(tmpdir(), 'rsp-watch-contract-'))
  for (const path of ['src', 'tests/support'])
    mkdirSync(join(directory, path), { recursive: true })
  for (const path of ['vitest.config.ts', 'vitest.watch.config.ts', 'tests/support/watch-build-setup.ts'])
    copyFileSync(join(root, path), join(directory, path))
  symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module', scripts: { build: `${JSON.stringify(process.execPath)} build.mjs` } }))
  writeFileSync(join(directory, 'build.mjs'), `import { mkdirSync, copyFileSync } from 'node:fs'; mkdirSync('dist', {recursive:true}); copyFileSync('src/value.mjs', 'dist/value.mjs');`)
  writeFileSync(join(directory, 'src/value.mjs'), `console.log('first')`)
  writeFileSync(join(directory, 'tests/cli.test.js'), `
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { it } from 'vitest'
it('executes the built artifact', () => {
  const actual = execFileSync(process.execPath, ['dist/value.mjs'], { encoding: 'utf8' }).trim()
  writeFileSync('.watch-result.json', JSON.stringify({ actual }))
})
`)
  const child = spawn(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), '--watch', '--config', 'vitest.watch.config.ts', '--pool=threads'], { cwd: directory, env: { ...process.env, CI: 'false', NO_COLOR: '1' }, stdio: ['pipe', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => output += chunk)
  child.stderr.on('data', chunk => output += chunk)
  const waitFor = async (actual: string) => {
    await vi.waitFor(() => {
      expect(child.exitCode, output).toBeNull()
      expect(JSON.parse(readFileSync(join(directory, '.watch-result.json'), 'utf8')), output).toEqual({ actual })
    }, { timeout: 15000, interval: 100 })
  }
  try {
    await waitFor('first')
    writeFileSync(join(directory, 'src/value.mjs'), `console.log('second')`)
    await waitFor('second')
  }
  finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
    rmSync(directory, { recursive: true, force: true })
  }
}, 40000)
