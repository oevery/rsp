import type { ReactNode, RefObject } from 'react'
import type { DiagramSelection } from '../diagram/selection.js'
import type { Route } from '../navigation.js'
import type { NavigationPanelController } from './use-navigation-panel.js'
import { useLocale } from '../i18n.js'
import { Button, CloseButton, Sheet, SheetContent, SheetTitle } from '../ui/primitives.js'

interface Props {
  panel: NavigationPanelController
  narrow: boolean
  route: Pick<Route, 'workspace' | 'view' | 'file' | 'step'>
  selection: Pick<DiagramSelection, 'scenario' | 'participantTitle'>
  details: RefObject<HTMLElement | null>
  selectStep: (id: string) => void
  children: ReactNode
}

export function NavigationPanel({ panel, narrow, route, selection, details, selectStep, children }: Props) {
  const { t } = useLocale()
  const { scenario, participantTitle } = selection
  const { navigationOpen, setNavigationOpen, desktopPanelOpen, activePanelTab, setPanelTab, navigationTrigger, navigationPane, stepsTrigger, navigationSelection, closePanel } = panel
  const sidePanel = (
    <div className="side-panel">
      <div className="side-panel-header">
        {scenario
          ? (
              <div
                role="tablist"
                aria-label={t('sidePanel')}
                onKeyDown={(event) => {
                  if (!scenario || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                    return
                  event.preventDefault()
                  const next = event.key === 'Home' ? 'navigation' : event.key === 'End' ? 'steps' : activePanelTab === 'navigation' ? 'steps' : 'navigation'
                  setPanelTab(next)
                  event.currentTarget.querySelector<HTMLButtonElement>(`[data-panel-tab="${next}"]`)?.focus()
                }}
              >
                <Button role="tab" id="navigation-tab" data-panel-tab="navigation" aria-controls="navigation-panel" aria-selected={activePanelTab === 'navigation'} tabIndex={activePanelTab === 'navigation' ? 0 : -1} onClick={() => setPanelTab('navigation')}>{t('navigation')}</Button>
                {scenario && <Button role="tab" id="steps-tab" data-panel-tab="steps" aria-controls="steps-panel" aria-selected={activePanelTab === 'steps'} tabIndex={activePanelTab === 'steps' ? 0 : -1} onClick={() => setPanelTab('steps')}>{t('steps')}</Button>}
              </div>
            )
          : <span className="side-panel-title" id="navigation-tab">{t('navigation')}</span>}
        <CloseButton label={t('closePanel')} onClick={closePanel} />
      </div>
      <div className="side-panel-content" id="navigation-panel" role={scenario ? 'tabpanel' : 'region'} aria-labelledby="navigation-tab" hidden={activePanelTab !== 'navigation'}>{children}</div>
      {scenario && (
        <div className="side-panel-content" id="steps-panel" role="tabpanel" aria-labelledby="steps-tab" hidden={activePanelTab !== 'steps'}>
          <section className="view-context scenario-context" aria-label={t('scenarioSteps')} key={`${route.workspace}:${route.view}`}>
            <ol>
              {scenario.steps.map(step => (
                <li key={step.id}>
                  <Button className={route.step === step.id ? 'bg-accent text-accent-foreground' : ''} aria-pressed={route.step === step.id} disabled={!!route.file} onClick={() => selectStep(step.id)}>
                    <span>{step.label}</span>
                    <small>
                      {participantTitle(step.source)}
                      {' '}
                      →
                      {' '}
                      {participantTitle(step.target)}
                    </small>
                  </Button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  )
  return (narrow
    ? (
        <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
          <SheetContent
            ref={navigationPane}
            className="navigation-sheet left-0"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              if (activePanelTab === 'navigation')
                navigationPane.current?.querySelector<HTMLInputElement>('input')?.focus()
              else
                navigationPane.current?.querySelector<HTMLButtonElement>('[role=tab][aria-selected=true]')?.focus()
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              if (navigationSelection.current) {
                navigationSelection.current = false
                requestAnimationFrame(() => details.current?.focus({ preventScroll: true }))
              }
              else {
                const trigger = activePanelTab === 'steps' ? stepsTrigger : navigationTrigger
                trigger.current?.focus()
              }
            }}
            onEscapeKeyDown={(event) => {
              const input = globalThis.document.activeElement
              if (input instanceof HTMLInputElement && input.value) {
                event.preventDefault()
              }
            }}
          >
            <SheetTitle className="sr-only">{t('architectureNavigation')}</SheetTitle>
            {sidePanel}
          </SheetContent>
        </Sheet>
      )
    : <div className="desktop-side-panel" hidden={!desktopPanelOpen}>{sidePanel}</div>)
}
