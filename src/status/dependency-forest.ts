import type { ChangeDependencyEdgeOutput, ChangeDependencyNodeOutput, ChangeDependencyPlanOutput } from '../types.js'

export interface DependencyForestNode extends ChangeDependencyNodeOutput {
  reason?: string
  edgeState?: ChangeDependencyEdgeOutput['state']
  shared: boolean
  children: DependencyForestNode[]
}

function defaultRoots(plan: ChangeDependencyPlanOutput): string[] {
  const selected = new Set(plan.nodes.filter(node => node.selection === 'selected').map(node => node.name))
  const nested = new Set(plan.edges.filter(edge => selected.has(edge.change) && selected.has(edge.requires)).map(edge => edge.requires))
  const roots = [...selected].filter(name => !nested.has(name)).sort()
  return roots.length > 0 ? roots : [...selected].sort()
}

export function projectDependencyForest(plan: ChangeDependencyPlanOutput, requestedRoots = defaultRoots(plan)): DependencyForestNode[] {
  const nodes = new Map(plan.nodes.map(node => [node.name, node]))
  const edges = new Map<string, ChangeDependencyEdgeOutput[]>()
  for (const edge of plan.edges) {
    const children = edges.get(edge.change) ?? []
    children.push(edge)
    edges.set(edge.change, children)
  }
  for (const children of edges.values())
    children.sort((left, right) => left.requires.localeCompare(right.requires))

  const expanded = new Set<string>()
  const visit = (name: string, edge?: ChangeDependencyEdgeOutput): DependencyForestNode | null => {
    const node = nodes.get(name)
    if (!node)
      return null
    const shared = expanded.has(name)
    if (!shared)
      expanded.add(name)
    return {
      ...node,
      ...(edge ? { reason: edge.reason, edgeState: edge.state } : {}),
      shared,
      children: shared
        ? []
        : (edges.get(name) ?? []).map(child => visit(child.requires, child)).filter((child): child is DependencyForestNode => child !== null),
    }
  }

  return requestedRoots.map(name => visit(name)).filter((node): node is DependencyForestNode => node !== null)
}
