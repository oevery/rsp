import type { ReactNode } from 'react'
import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import type { DiagramViewId } from './likec4-adapter.js'
import type { DiagramSelection } from './selection.js'
import type { DiagramController } from './use-diagram-controller.js'
import { LikeC4Model } from '@likec4/core/model'
import { LikeC4ModelProvider, ReactLikeC4 } from '@likec4/diagram'
import { useMemo } from 'react'
import { useLocale } from '../i18n.js'
import { Button, Tooltip } from '../ui/primitives.js'
import { canonicalNode } from './likec4-adapter.js'
import { localizeLayout } from './presentation.js'
import { RelationshipRow } from './relationship-row.js'

interface Props {
  active: ArchitecturePayload | null
  route: Route
  selection: DiagramSelection
  controller: Pick<DiagramController, 'canvas' | 'savedViewport' | 'initialize' | 'zoomIn' | 'zoomOut' | 'fitOverview'>
  currentError: string
  select: (node: string, relation?: string, displayName?: string) => void
  selectStep: (step: string) => void
  children: ReactNode
}

export function DiagramCanvas({ active, route, selection, controller, currentError, select, selectStep, children }: Props) {
  const { t } = useLocale()
  const { contextKey, viewId, missingView, selectedNode, selectedRelation, selectedStep, undrawn, drawnRelations, projection } = selection
  const model = useMemo(() => active ? LikeC4Model.create(localizeLayout(active.architecture, active.layout, active.focus, t)) : null, [active?.workspace, active?.graphRevision, active?.focus, t])
  return (
    <main className="canvas" tabIndex={-1} aria-label={t('architecture')} ref={controller.canvas}>
      {active && !active.architecture.nodes.length
        ? <p className="opening empty-architecture" role="status">{t('emptyArchitecture')}</p>
        : active && route.mode === 'view' && active.architecture.views.find(view => view.id === route.view)?.include.length === 0 && <p className="opening empty-architecture" role="status">{t('emptyView')}</p>}
      {active && (missingView || active.missingFocus || (route.node && !selectedNode) || (route.relation && !selectedRelation) || (route.step && !selectedStep)) && (
        <div className="fallback">
          {(missingView || active.missingFocus) && <p role="status">{t(active.missingFocus ? 'removedFocus' : 'removedView')}</p>}
          {route.node && !selectedNode && <p role="status">{t('missingObject')}</p>}
          {route.relation && !selectedRelation && <p role="status">{t('missingRelationship')}</p>}
          {route.step && !selectedStep && <p role="status">{t('missingStep')}</p>}
        </div>
      )}
      {active && model && viewId && route.mode && route.mode !== 'guide'
        ? (
            <LikeC4ModelProvider likec4model={model}>
              <ReactLikeC4
                key={contextKey}
                viewId={viewId as DiagramViewId}
                colorScheme="light"
                injectFontCss={false}
                style={{ width: '100%', height: '100%' }}
                pannable
                zoomable
                controls={false}
                fitView={false}
                initialZoom={controller.savedViewport?.zoom ?? 1}
                showNavigationButtons={false}
                enableElementDetails={false}
                enableRelationshipDetails={false}
                enableRelationshipBrowser={!route.file}
                nodesSelectable={!route.file}
                enableSearch={false}
                enableFocusMode={false}
                onInitialized={controller.initialize}
                onNodeClick={(node) => {
                  if (!route.file)
                    select(canonicalNode(active.layout, node.id), '', node.id)
                }}
                onEdgeClick={(edge) => {
                  if (route.file)
                    return
                  const step = active.layout.stepIds[viewId]?.[edge.id]
                  if (step) {
                    selectStep(step)
                    return
                  }
                  const native = active.layout.data.views[viewId]?.edges.find(candidate => candidate.id === edge.id)
                  const id = native?.relations[0] && active.layout.relationIds[native.relations[0]]
                  if (id)
                    select('', id)
                }}
              >
                <style>{`.likec4-edge-label-container > div { max-width: 260px !important; } .likec4-edge-label { width: max-content; max-width: 260px; } .likec4-edge-label__text { word-break: keep-all; overflow-wrap: anywhere; }`}</style>
              </ReactLikeC4>
            </LikeC4ModelProvider>
          )
        : <p className="opening" role="status">{t(currentError ? 'architectureUnavailable' : 'opening')}</p>}
      {active && route.mode !== 'guide' && undrawn.length > 0 && (
        <details className="undrawn">
          <summary>{t(undrawn.length === 1 ? 'undrawnOne' : 'undrawnMany', { count: undrawn.length })}</summary>
          <nav aria-label={t('undrawnRelationships')}>{undrawn.map(relation => <RelationshipRow key={relation.id} relation={relation} architecture={active.architecture} drawnRelations={drawnRelations} projection={projection} select={select} />)}</nav>
        </details>
      )}
      {active && route.mode !== 'guide' && (
        <div className="canvas-controls" aria-label={t('canvasControls')}>
          <Tooltip label={t('zoomIn')}><Button size="icon" aria-label={t('zoomIn')} onClick={controller.zoomIn}>+</Button></Tooltip>
          <Tooltip label={t('zoomOut')}><Button size="icon" aria-label={t('zoomOut')} onClick={controller.zoomOut}>−</Button></Tooltip>
          <Tooltip label={t('fitHint')}><Button onClick={controller.fitOverview}>{t('fit')}</Button></Tooltip>
        </div>
      )}
      {children}
    </main>
  )
}
