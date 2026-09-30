import * as path from 'node:path'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

// Bounded subprocess and import allowlist; no project tools or filesystem APIs.
async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  const checks = []
  try {
    const sources = JSON.parse(input)
    const context = createContext({ URL }, { codeGeneration: { strings: false, wasm: false } })
    const modules = {}
    for (const [name, source] of Object.entries(sources)) {
      const module = new SourceTextModule(source, { context })
      await module.link((specifier) => {
        let values
        if (specifier === 'node:path') {
          values = { isAbsolute: path.isAbsolute, relative: path.relative, resolve: path.resolve, sep: path.sep }
        }
        else if (specifier === 'node:fs/promises') {
          const denied = () => {
            throw new Error('fs-disabled')
          }
          values = { lstat: denied, realpath: denied }
        }
        else {
          throw new Error('import-not-allowed')
        }
        return new SyntheticModule(Object.keys(values), function () {
          for (const [key, value] of Object.entries(values)) this.setExport(key, value)
        }, { context })
      })
      await module.evaluate({ timeout: 200 })
      modules[name] = module.namespace
    }
    const issue = modules['src/core/issue-relationship.ts']
    const valid = issue.parseIssueRelationships({ issues: [{ url: 'https://example.invalid/42', relation: 'closes' }] })
    checks.push(valid.length === 1 && valid[0].relation === 'closes')
    const fails = (issues, code) => {
      try {
        issue.parseIssueRelationships({ issues })
        return false
      }
      catch (e) { return e.code === code }
    }
    checks.push(fails([{ url: 'https://EXAMPLE.invalid', relation: 'relates' }, { url: 'https://example.invalid/', relation: 'closes' }], 'duplicate_issue_url'))
    checks.push(fails([{ url: 'https://user:pass@example.invalid/', relation: 'relates' }], 'unsafe_issue_url'))
    checks.push(fails([{ url: 'https://example.invalid/#fragment', relation: 'relates' }], 'unsafe_issue_url'))
    const containment = modules['src/core/path-identity.ts']
    if (containment) {
      const contains = containment.isPathContained
      checks.push(contains('/project', '/project'), contains('/project', '/project/file'), !contains('/project/child', '/project'), !contains('/project', '/project-elsewhere'))
    }
    process.stdout.write(JSON.stringify({ status: checks.every(Boolean) ? 'passed' : 'failed', checks }))
  }
  catch { process.stdout.write(JSON.stringify({ status: 'inconclusive', reason: 'probe-unavailable' })) }
}
void main()
