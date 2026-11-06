import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import type { DiagramSelection } from './selection.js'
import type { DiagramController } from './use-diagram-controller.js'
import { useLocale } from '../i18n.js'
import { Button, Chevron, CloseButton, NavigationItem } from '../ui/primitives.js'
import { RelationshipRow } from './relationship-row.js'

interface Props {
  active: ArchitecturePayload
  route: Route
  selection: DiagramSelection
  controller: Pick<DiagramController, 'details' | 'cardPosition' | 'focusSelection'>
  select: (node: string, relation?: string) => void
  selectStep: (step: string) => void
  openView: (view: string) => void
  openDocument: (file: string, anchor: string) => void
  focusNode: (node: string) => void
}

export function SelectionDetails({ active, route, selection, controller, select, selectStep, openView, openDocument, focusNode }: Props) {
  const { t } = useLocale()
  const { selectedNode, selectedRelation, selectedStep, participant, participantTitle, scenario, projection, viewsForNode, uniqueBindings, relationships, drawnRelations } = selection
  if ((!selectedNode && !selectedRelation && !selectedStep) || route.file)
    return null
  return (
    <aside ref={controller.details} tabIndex={-1} className={`detail-panel ${controller.cardPosition.left ? 'card-left' : ''} ${controller.cardPosition.bottom ? 'card-bottom' : ''}`} aria-label={t('details')}>
      <div className="detail-heading">
        <span>{t(selectedStep ? 'scenarioStep' : selectedRelation ? 'relationship' : 'object')}</span>
        <CloseButton
          label={t('closeDetails')}
          onClick={() => {
            select('')
            requestAnimationFrame(controller.focusSelection)
          }}
        />
      </div>
      {selectedStep && (
        <>
          <h2>{selectedStep.label}</h2>
          <p>{t(selectedStep.type)}</p>
          {selectedStep.description && <p>{selectedStep.description}</p>}
          <dl>
            <dt>{t('from')}</dt>
            <dd><Button onClick={() => select(participant(selectedStep.source)!.node)}>{participantTitle(selectedStep.source)}</Button></dd>
            <dt>{t('to')}</dt>
            <dd><Button onClick={() => select(participant(selectedStep.target)!.node)}>{participantTitle(selectedStep.target)}</Button></dd>
          </dl>
          {selectedStep.replyTo && (
            <Button onClick={() => selectStep(selectedStep.replyTo!)}>
              {t('replyTo')}
              :
              {' '}
              {scenario!.steps.find(step => step.id === selectedStep.replyTo)!.label}
            </Button>
          )}
          <details>
            <summary>{t('identity')}</summary>
            <code>{selectedStep.id}</code>
          </details>
        </>
      )}
      {selectedNode && (
        <>
          <h2>{selectedNode.title}</h2>
          {projection && route.mode !== 'guide' && !projection.selected.has(selectedNode.id) && <p className="boundary-label">{t('externalBoundary')}</p>}
          <p>{selectedNode.description}</p>
          {selectedNode.parent && (
            <p className="structural-parent">
              {t('partOf')}
              {' '}
              <Button className="text-button" onClick={() => select(selectedNode.parent!)}>{active.architecture.nodes.find(node => node.id === selectedNode.parent)?.title}</Button>
            </p>
          )}
          {viewsForNode.length > 0 && (
            <section>
              <h3>{t('nodeViews')}</h3>
              <nav aria-label={t('nodeViews')}>
                {viewsForNode.map(view => (
                  <NavigationItem key={view.id} aria-current={route.mode === 'view' && route.view === view.id ? 'page' : undefined} onClick={() => openView(view.id)}>
                    {view.title}
                  </NavigationItem>
                ))}
              </nav>
            </section>
          )}
          {!(route.mode === 'focus' && route.focus === selectedNode.id) && (
            <Button className="focus-action" onClick={() => focusNode(selectedNode.id)}>
              {t('focusRelationships')}
              <Chevron />
            </Button>
          )}
          {uniqueBindings.length > 0 && (
            <section>
              <h3>{t('documents')}</h3>
              <nav aria-label={t('documents')}>
                {uniqueBindings.map(binding => (
                  <NavigationItem document key={`${binding.file}:${binding.anchor ?? ''}:${binding.origin}`} onClick={() => openDocument(binding.file, binding.anchor ?? '')}>
                    <span className="navigation-title">{binding.file.split('/').pop()}</span>
                    <small>{binding.file}</small>
                    {binding.headings && <small>{binding.headings.join(' › ')}</small>}
                    {binding.inherited && (
                      <small>
                        {t('inheritedFrom')}
                        {' '}
                        {binding.origin}
                      </small>
                    )}
                  </NavigationItem>
                ))}
              </nav>
            </section>
          )}
          {relationships.length > 0 && (
            <details className="object-relationships">
              <summary>
                {t('relationships')}
                <span>{relationships.length}</span>
              </summary>
              <nav aria-label={t('objectRelationships')}>{relationships.map(relation => <RelationshipRow key={relation.id} relation={relation} architecture={active.architecture} drawnRelations={drawnRelations} projection={projection} select={select} />)}</nav>
            </details>
          )}
          <details>
            <summary>{t('identity')}</summary>
            <code>{selectedNode.id}</code>
          </details>
        </>
      )}
      {selectedRelation && (
        <>
          <h2>{selectedRelation.label ?? selectedRelation.type}</h2>
          {selectedRelation.label && <p>{selectedRelation.type}</p>}
          <p>{selectedRelation.description}</p>
          <dl>
            <dt>{t('from')}</dt>
            <dd>
              <Button className="text-button" onClick={() => select(selectedRelation.source)}>{active.architecture.nodes.find(node => node.id === selectedRelation.source)?.title}</Button>
              <code>{selectedRelation.source}</code>
            </dd>
            <dt>{t('to')}</dt>
            <dd>
              <Button className="text-button" onClick={() => select(selectedRelation.target)}>{active.architecture.nodes.find(node => node.id === selectedRelation.target)?.title}</Button>
              <code>{selectedRelation.target}</code>
            </dd>
          </dl>
          {projection?.relations.includes(selectedRelation) && !drawnRelations.has(selectedRelation.id) && <p className="boundary-label">{t('notDrawnDetails')}</p>}
          <details>
            <summary>{t('identity')}</summary>
            <code>{selectedRelation.id}</code>
          </details>
        </>
      )}
    </aside>
  )
}
