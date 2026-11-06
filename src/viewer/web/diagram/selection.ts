import type { ArchitecturePayload } from '../../protocol.js'
import type { Translate } from '../i18n.js'
import type { Route } from '../navigation.js'
import { selectArchitecture } from '../../../architecture/selection.js'

export function diagramSelection(active: ArchitecturePayload | null, route: Route, t: Translate) {
  const contextKey = active ? `${active.workspace}:${active.graphRevision}:${route.mode}:${route.view}:${route.focus}:${route.variant ?? ''}` : ''
  const selectedView = active && Object.hasOwn(active.layout.viewNames, route.view) ? active.layout.viewNames[route.view] : undefined
  const missingView = !!active && route.mode === 'view' && selectedView === undefined
  const authoredView = route.mode === 'view' ? active?.architecture.views.find(view => view.id === route.view) : undefined
  const scenario = authoredView?.scenario
  const viewId = route.mode === 'focus' && !active?.missingFocus ? active?.layout.focusView : scenario && route.variant === 'diagram' ? active?.layout.collaborationViews[route.view] : selectedView ?? active?.layout.viewNames['']
  const selectedStep = scenario?.steps.find(step => step.id === route.step)
  const participant = (id: string) => scenario?.participants.find(participant => participant.id === id)
  const participantTitle = (id: string) => participant(id)?.title ?? active?.architecture.nodes.find(node => node.id === participant(id)?.node)?.title ?? id
  const selectedNode = active?.architecture.nodes.find(node => node.id === route.node)
  const selectedRelation = active?.architecture.relations.find(relation => relation.id === route.relation)
  const viewsForNode = active?.architecture.views.filter(view => view.node === selectedNode?.id || (!!selectedNode && view.include.includes(selectedNode.id)) || view.scenario?.participants.some(participant => participant.node === selectedNode?.id)) ?? []
  const bindings = selectedNode?.bindings ?? []
  const uniqueBindings = [...new Map(bindings.map(binding => [`${binding.file}:${binding.anchor ?? ''}:${binding.origin}`, binding])).values()]
  const projection = active ? selectArchitecture(active.architecture, route.mode === 'focus' && !active.missingFocus ? { kind: 'focus', id: route.focus } : route.mode === 'view' && !missingView ? { kind: 'view', id: route.view } : { kind: 'full' }) : null
  const nativeView = viewId ? active?.layout.data.views[viewId] : undefined
  const drawnRelations = new Set<string>(nativeView?.edges.flatMap(edge => edge.relations.map(id => active!.layout.relationIds[id])) ?? [])
  const undrawn = projection?.relations.filter(relation => !drawnRelations.has(relation.id)) ?? []
  const relationships = selectedNode ? active!.architecture.relations.filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id) : []
  const contextTitle = route.mode === 'focus' && !active?.missingFocus ? t('relationshipsOf', { title: active?.architecture.nodes.find(node => node.id === route.focus)?.title ?? route.focus }) : route.mode === 'view' && !missingView ? active?.architecture.views.find(view => view.id === route.view)?.title : t('allNodes')
  return { contextKey, selectedView, missingView, authoredView, scenario, viewId, selectedStep, participant, participantTitle, selectedNode, selectedRelation, viewsForNode, uniqueBindings, projection, nativeView, drawnRelations, undrawn, relationships, contextTitle }
}
export type DiagramSelection = ReturnType<typeof diagramSelection>
