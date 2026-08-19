import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const coreDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'core')

function runtimeCoreGraph(): Map<string, string[]> {
  const files = readdirSync(coreDir).filter(file => file.endsWith('.ts')).sort()
  const graph = new Map(files.map(file => [file, [] as string[]]))
  const runtimeImport = /^import(?!\s+type\b)[^\n]*from\s+['"]\.\/([^'"]+)\.js['"]/gm

  for (const file of files) {
    const source = readFileSync(join(coreDir, file), 'utf8')
    const dependencies = graph.get(file)!
    for (const match of source.matchAll(runtimeImport)) {
      const dependency = `${match[1]}.ts`
      if (graph.has(dependency))
        dependencies.push(dependency)
    }
  }
  return graph
}

function stronglyConnectedComponents(graph: Map<string, string[]>): string[][] {
  let nextIndex = 0
  const indices = new Map<string, number>()
  const lowLinks = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const components: string[][] = []

  function visit(node: string): void {
    indices.set(node, nextIndex)
    lowLinks.set(node, nextIndex)
    nextIndex += 1
    stack.push(node)
    onStack.add(node)

    for (const dependency of graph.get(node) ?? []) {
      if (!indices.has(dependency)) {
        visit(dependency)
        lowLinks.set(node, Math.min(lowLinks.get(node)!, lowLinks.get(dependency)!))
      }
      else if (onStack.has(dependency)) {
        lowLinks.set(node, Math.min(lowLinks.get(node)!, indices.get(dependency)!))
      }
    }

    if (lowLinks.get(node) !== indices.get(node))
      return

    const component: string[] = []
    let member: string
    do {
      member = stack.pop()!
      onStack.delete(member)
      component.push(member)
    } while (member !== node)
    components.push(component.sort())
  }

  for (const node of graph.keys()) {
    if (!indices.has(node))
      visit(node)
  }
  return components
}

describe('core runtime dependency structure', () => {
  it('contains no multi-module runtime cycle', () => {
    const cycles = stronglyConnectedComponents(runtimeCoreGraph()).filter(component => component.length > 1)
    expect(cycles).toEqual([])
  })

  it('has cohesive owners instead of the former catch-all helper', () => {
    const files = readdirSync(coreDir).map(file => basename(file))
    expect(files).not.toContain('helpers.ts')
    expect(files).toEqual(expect.arrayContaining(['artifacts.ts', 'content.ts', 'filesystem.ts', 'readiness.ts']))
  })
})
