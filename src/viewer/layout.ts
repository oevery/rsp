import type { ArchitectureResult } from '../architecture/model.js'
import { Builder } from '@likec4/core/builder'
import { layoutLikeC4Model } from '@likec4/layouts'
import { selectArchitecture } from '../architecture/model.js'

/** Library identifiers are derived aliases; project identities never encode ancestry. */
export function diagramAliases(architecture: ArchitectureResult) {
  const aliases = new Map(architecture.nodes.map((node, index) => [node.id, `n${index}`]))
  const fqn = (id: string): string => {
    const node = architecture.nodes.find(node => node.id === id)!
    return node.parent ? `${fqn(node.parent)}.${aliases.get(id)}` : aliases.get(id)!
  }
  return Object.fromEntries(architecture.nodes.map(node => [node.id, fqn(node.id)]))
}
export async function layoutArchitecture(architecture: ArchitectureResult, workspace: string, focus?: string) {
  // Focus is an incident graph, not a structural view. Flatten only its display
  // model so LikeC4 cannot insert unselected ancestor containers.
  const diagramNodes: ArchitectureResult['nodes'] = focus ? architecture.nodes.map(({ parent: _parent, ...node }) => node) : architecture.nodes
  const names = diagramAliases({ ...architecture, nodes: diagramNodes })
  const nodeById = new Map(architecture.nodes.map(node => [node.id, node]))
  // LikeC4 forbids ancestor/descendant and self edges. Root-level references keep
  // these edges native. Expanded containers also need endpoint references:
  // LikeC4 otherwise suppresses their own edges in favor of descendant edges.
  const needsReference = (edge: ArchitectureResult['relations'][number]) => names[edge.source] === names[edge.target] || names[edge.source]!.startsWith(`${names[edge.target]}.`) || names[edge.target]!.startsWith(`${names[edge.source]}.`)
  const containers = new Set(diagramNodes.flatMap(node => node.parent ? [node.parent] : []))
  const referencedTargets = new Set([...architecture.relations.filter(needsReference).map(edge => edge.target), ...architecture.relations.flatMap(edge => [edge.source, edge.target].filter(id => containers.has(id)))])
  const primaryReferences = Object.fromEntries([...referencedTargets].map((id, index) => [`r${index}`, id]))
  const referenceNames = Object.fromEntries(Object.entries(primaryReferences).map(([alias, id]) => [id, alias]))
  // A container's self-relation needs distinct source and target references.
  const selfReferences = Object.fromEntries([...new Set(architecture.relations.filter(edge => edge.source === edge.target && containers.has(edge.source)).map(edge => edge.source))].map((id, index) => [`s${index}`, id]))
  const selfNames = Object.fromEntries(Object.entries(selfReferences).map(([alias, id]) => [id, alias]))
  const references = { ...primaryReferences, ...selfReferences }
  const sourceName = (edge: ArchitectureResult['relations'][number]) => containers.has(edge.source) ? referenceNames[edge.source]! : names[edge.source]!
  const targetName = (edge: ArchitectureResult['relations'][number]) => edge.source === edge.target && containers.has(edge.source) ? selfNames[edge.target]! : needsReference(edge) || containers.has(edge.target) ? referenceNames[edge.target]! : names[edge.target]!
  const views = focus
    ? [{ id: '', title: `${nodeById.get(focus)?.title ?? focus} relationships`, node: '', include: [focus] }]
    : [{ id: '', title: 'All registered nodes', node: '', include: architecture.nodes.map(node => node.id) }, ...architecture.views]
  const viewNames = Object.fromEntries(views.map((view, index) => [view.id, `v${index}`]))
  viewNames[''] = 'v0'
  const focusView = focus ? `v${views.length - 1}` : undefined
  const relationTags = new Map(architecture.relations.map((edge, index) => [edge.id, `e${index}`]))
  const builder = Builder.specification({ elements: { component: {} }, relationships: { relation: { multiple: true } }, tags: Object.fromEntries([...relationTags.values()].map(tag => [tag, {}])) })
    .model((helpers, compose) => {
      // Builder's type grammar accepts literal DSL names; these validated aliases are dynamic.
      const h = helpers as any
      const pipe = compose as any
      const properties = (node: ArchitectureResult['nodes'][number]) => ({
        title: node.title,
        color: 'green',
        description: { txt: node.description },
        links: node.bindings.map(binding => ({ title: binding.file, url: `/?${new URLSearchParams({ workspace, file: binding.file, ...(binding.headings ? { headings: JSON.stringify(binding.headings) } : {}) })}` })),
      })
      const element = (node: ArchitectureResult['nodes'][number]): any => h.component(names[node.id]!.split('.').at(-1)!, properties(node)).with(...diagramNodes.filter(child => child.parent === node.id).map(element))
      return pipe(...diagramNodes.filter(node => !node.parent).map(element), ...Object.entries(references).map(([alias, id]) => {
        const node = nodeById.get(id)!
        return h.component(alias, { ...properties(node), title: `${node.title} (relationship reference)`, description: { txt: `Reference to ${node.id}. ${node.description}` } })
      }), ...architecture.relations.map(edge => h.rel(sourceName(edge), targetName(edge), { kind: 'relation', title: edge.type, tags: [relationTags.get(edge.id)!], description: { txt: edge.description } })))
    })
    .views((helpers, compose) => {
      const h = helpers as any
      const pipe = compose as any
      return pipe(...views.map((view, index) => {
        const isFocus = !!focus && index === views.length - 1
        const projection = selectArchitecture(architecture, isFocus ? { kind: 'focus', id: focus } : view.id ? { kind: 'view', id: view.id } : { kind: 'full' })
        const include = [...projection.visible].map(id => names[id]!)
        include.push(...projection.relations.flatMap(edge => [sourceName(edge), targetName(edge)].filter(name => name in references)))
        const rules = [...new Set(include)].map((name) => {
          const id = references[name] ?? architecture.nodes.find(node => names[node.id] === name)!.id
          const targets = architecture.views.filter(candidate => candidate.node === id)
          const node = nodeById.get(id)!
          const title = `${node.title}${references[name] ? ' [reference]' : ''}${projection.selected.has(id) ? '' : ' [boundary]'}`
          return h.$include(name, { with: { title, description: { txt: '' }, size: 'sm', padding: 'xs', textSize: 'sm', ...(targets.length === 1 && targets[0]!.id !== view.id && viewNames[targets[0]!.id] ? { navigateTo: viewNames[targets[0]!.id] as any } : {}) } })
        })
        // Including boundary nodes must not introduce their unrelated relationships.
        rules.push(...architecture.relations.filter(edge => !projection.relations.includes(edge)).map(edge => h.$exclude('* -> *', { where: `tag is #${relationTags.get(edge.id)}` })))
        const options = { title: view.title }
        const alias = isFocus ? focusView! : viewNames[view.id]!
        return include.length && view.node && nodeById.has(view.node)
          ? h.viewOf(alias, names[view.node]!, options, h.$rules(...rules, h.$autoLayout('LR', { rank: 70, node: 32 })))
          : h.view(alias, options, h.$rules(...rules, h.$autoLayout('LR', { rank: 70, node: 32 })))
      }))
    })
  const data = (await layoutLikeC4Model(builder.toLikeC4Model({ id: workspace }))).$data
  const relationIds = Object.fromEntries(Object.values(data.relations).map(edge => [edge.id, architecture.relations.find(item => relationTags.get(item.id) === edge.tags?.[0])!.id]))
  return { data, names, viewNames, references, relationIds, focusView }
}
