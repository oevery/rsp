import type { TestProject } from 'vitest/node'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

function buildCli() {
  execFileSync('pnpm', ['run', 'build'], { cwd: root, stdio: 'pipe' })
}

export default function setup(project: TestProject) {
  buildCli()
  project.onTestsRerun(buildCli)
}
