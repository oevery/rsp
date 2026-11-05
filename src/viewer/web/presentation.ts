import type { ArchitectureResult } from '../../architecture/model.js'
import type { Translate } from './i18n.js'

/** Translate only adapter-authored labels; model content and layout coordinates stay intact. */
export function localizeLayout(architecture: ArchitectureResult, layout: { data: any, names: Record<string, string>, viewNames: Record<string, string>, references: Record<string, string>, focusView?: string, collaborationViews?: Record<string, string>, scenarioNames?: Record<string, Record<string, unknown>> }, focus: string | undefined, t: Translate) {
  const scenarioAliases = new Set(Object.values(layout.scenarioNames ?? {}).flatMap(roles => Object.keys(roles)))
  const originals = new Map(architecture.nodes.map(node => [node.id, node]))
  const ids = Object.fromEntries(Object.entries(layout.names).map(([id, name]) => [name, id]))
  const elements = Object.fromEntries(Object.entries(layout.data.elements).map(([name, value]) => {
    const element = value as any
    const original = scenarioAliases.has(name) ? undefined : originals.get(layout.references[name]!)
    return [name, original ? { ...element, title: `${original.title} (${t('referenceName')})`, description: { txt: t('referenceDescription', { id: original.id, description: original.description }) } } : element]
  }))
  const views = Object.fromEntries(Object.entries(layout.data.views).map(([id, value]) => {
    const view = value as any
    const authored = architecture.views.find(candidate => layout.viewNames[candidate.id] === id || layout.collaborationViews?.[candidate.id] === id)
    return [id, {
      ...view,
      title: authored?.title ?? (focus ? t('relationshipsOf', { title: originals.get(focus)?.title ?? focus }) : t('allNodes')),
      nodes: view.nodes.map((node: any) => {
        if (scenarioAliases.has(node.id))
          return node
        const reference = layout.references[node.id]
        const original = originals.get(reference ?? ids[node.id])
        if (!original)
          return node
        const base = `${original.title}${reference ? ' [reference]' : ''}`
        const boundary = node.title === `${base} [boundary]`
        return { ...node, title: `${original.title}${reference ? ` ${t('referenceMarker')}` : ''}${boundary ? ` ${t('boundaryMarker')}` : ''}` }
      }),
    }]
  }))
  return { ...layout.data, elements, views }
}
