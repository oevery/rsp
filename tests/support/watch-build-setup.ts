import type { TestProject } from 'vitest/node'
import { execFileSync } from 'node:child_process'

export default function setup(project: TestProject) {
  const build = () => {
    execFileSync('pnpm', ['run', 'build'], { cwd: project.config.root, stdio: 'pipe' })
  }
  build()
  project.onTestsRerun(build)
}
