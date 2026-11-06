import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import type { NavigationPanelController } from '../workspace/use-navigation-panel.js'
import type { DiagramSelection } from './selection.js'
import { useLocale } from '../i18n.js'
import { StatusMessage } from '../status-message.js'
import { Button, Select, Tooltip } from '../ui/primitives.js'

interface Props {
  active: ArchitecturePayload | null
  route: Route
  selection: DiagramSelection
  panel: Pick<NavigationPanelController, 'navigationTrigger' | 'stepsTrigger' | 'panelVisible' | 'activePanelTab' | 'openPanel'>
  error: string
  refreshing: boolean
  reload: () => void
  openView: (view: string) => void
  selectStep: (step: string) => void
  setVariant: (variant: string) => void
}

export function ViewToolbar({ active, route, selection, panel, error, refreshing, reload, openView, selectStep, setVariant }: Props) {
  const { t } = useLocale()
  const { contextTitle, scenario, selectedStep } = selection
  const { navigationTrigger, stepsTrigger, panelVisible, activePanelTab, openPanel } = panel
  return (
    <>
      <header className="view-toolbar">
        <Tooltip label={t('openNavigation')}>
          <Button
            ref={navigationTrigger}
            className="navigation-toggle toolbar-icon"
            aria-label={t('navigation')}
            aria-expanded={panelVisible && activePanelTab === 'navigation'}
            onClick={() => openPanel('navigation')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16M5.5 8h1M5.5 12h1" />
            </svg>
          </Button>
        </Tooltip>
        <h1 aria-label={contextTitle}>
          {active
            ? (
                <Select
                  id="view-picker"
                  label={t('views')}
                  value={route.mode === 'view' ? `view:${route.view}` : route.mode === 'focus' ? 'focus' : 'full'}
                  onValueChange={(value) => {
                    if (value !== 'focus')
                      openView(value === 'full' ? '' : value.slice(5))
                  }}
                  options={[
                    ...(route.mode === 'focus' ? [{ value: 'focus', label: contextTitle ?? t('allNodes') }] : []),
                    { value: 'full', label: t('allNodes'), description: t('allNodesHint') },
                    ...active.architecture.views.map(view => ({ value: `view:${view.id}`, label: view.title })),
                  ]}
                />
              )
            : contextTitle}
        </h1>
        {route.mode === 'focus' && !active?.missingFocus && <span className="context-label">{t('directRelationships')}</span>}
        {scenario && <Tooltip label={t('scenarioLegend')}><Button aria-label={t('scenarioLegend')}>?</Button></Tooltip>}
        <Tooltip label={t('refresh')}>
          <Button
            className="refresh toolbar-icon"
            aria-label={t('refresh')}
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={reload}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></svg>
          </Button>
        </Tooltip>
      </header>
      {error && <StatusMessage kind="architecture" stale={!!active} message={error} />}
      {scenario && (
        <div className="scenario-toolbar">
          <Button
            ref={stepsTrigger}
            aria-expanded={panelVisible && activePanelTab === 'steps'}
            onClick={() => openPanel('steps')}
          >
            {`${t('scenarioSteps')} · ${scenario.steps.length}`}
          </Button>
          <Button aria-pressed={route.variant !== 'diagram'} onClick={() => setVariant('')}>{t('sequence')}</Button>
          <Button aria-pressed={route.variant === 'diagram'} onClick={() => setVariant('diagram')}>{t('collaboration')}</Button>
          <div className="step-pagination">
            <Button aria-label={t('previousStep')} disabled={!selectedStep || scenario.steps.indexOf(selectedStep) === 0 || !!route.file} onClick={() => selectStep(scenario.steps[scenario.steps.indexOf(selectedStep!) - 1]!.id)}>←</Button>
            <span aria-live="polite">
              {selectedStep ? scenario.steps.indexOf(selectedStep) + 1 : 0}
              {' '}
              /
              {' '}
              {scenario.steps.length}
            </span>
            <Button aria-label={t('nextStep')} disabled={scenario.steps.indexOf(selectedStep!) === scenario.steps.length - 1 || !!route.file} onClick={() => selectStep(scenario.steps[scenario.steps.indexOf(selectedStep!) + 1]!.id)}>→</Button>
          </div>
        </div>
      )}
    </>
  )
}
