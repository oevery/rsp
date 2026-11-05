import type { ArchitectureModel, ArchitectureResult } from './model.js'

/** Focus is one object's incident relationships, never its structural subtree. */
export function selectArchitecture(model: Pick<ArchitectureModel, 'nodes' | 'relations' | 'views'>, selection: ArchitectureResult['selection'] | { kind: 'focus', id: string }) {
  const view = selection.kind === 'view' ? model.views.find(view => view.id === selection.id) : undefined
  const selected = new Set(model.nodes.map(node => node.id))
  if (selection.kind === 'focus') {
    if (!selected.has(selection.id))
      throw new Error(`Unknown architecture node: ${selection.id}`)
    selected.clear()
    selected.add(selection.id)
  }
  if (selection.kind === 'node') {
    if (!selected.has(selection.id!))
      throw new Error(`Unknown architecture node: ${selection.id}`)
    selected.clear()
    selected.add(selection.id!)
    let added = true
    while (added) {
      added = false
      for (const node of model.nodes) {
        if (node.parent && selected.has(node.parent) && !selected.has(node.id)) {
          selected.add(node.id)
          added = true
        }
      }
    }
  }
  if (selection.kind === 'view') {
    if (!view)
      throw new Error(`Unknown architecture view: ${selection.id}`)
    selected.clear()
    view.include.forEach(id => selected.add(id))
  }
  const relations = view?.scenario
    ? []
    : model.relations.filter(edge =>
        (selected.has(edge.source) || selected.has(edge.target))
        && (view?.boundary !== 'exclude' || (selected.has(edge.source) && selected.has(edge.target)))
        && (!view?.relationTypes || view.relationTypes.includes(edge.type))
        && (!view?.relationIds || view.relationIds.includes(edge.id)),
      )
  const visible = new Set([...selected, ...relations.flatMap(edge => [edge.source, edge.target])])
  return { selected, visible, relations }
}
