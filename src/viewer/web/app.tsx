import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { rspIcon } from './branding.js'
import { DiagramCanvas } from './diagram/diagram-canvas.js'
import { SelectionDetails } from './diagram/selection-details.js'
import { diagramSelection } from './diagram/selection.js'
import { useArchitecture } from './diagram/use-architecture.js'
import { useDiagramController, useDiagramDocumentLinks } from './diagram/use-diagram-controller.js'
import { ViewToolbar } from './diagram/view-toolbar.js'
import { LocaleProvider, useLocale } from './i18n.js'
import { DocumentReader } from './reader/document-reader.js'
import { TooltipProvider } from './ui/primitives.js'
import { useViewerRoute } from './use-viewer-route.js'
import { NavigationPanel } from './workspace/navigation-panel.js'
import { useNavigationPanel } from './workspace/use-navigation-panel.js'
import { useWorkspaces } from './workspace/use-workspaces.js'
import { WorkspaceSidebar } from './workspace/workspace-sidebar.js'

function App() {
  const { t } = useLocale()
  const router = useViewerRoute(beforeNavigate, afterNavigate)
  const { route } = router
  const workspaces = useWorkspaces()
  const { active, error, refresh, refreshing, reload } = useArchitecture(route)
  const selection = diagramSelection(active, route, t)
  const { scenario, authoredView, contextTitle } = selection
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 760px)').matches)
  const panel = useNavigationPanel(!!scenario, narrow)
  const diagram = useDiagramController(active, route, selection)
  function beforeNavigate() {
    diagram.saveViewport()
  }
  function afterNavigate() {
    panel.dismiss()
  }
  const select = (node: string, relation = '', displayName?: string) => {
    if (route.file)
      return
    diagram.select(node, displayName)
    router.select(node, relation)
  }
  const selectStep = (id: string) => {
    if (route.file)
      return
    router.selectStep(id)
    if (narrow && panel.navigationOpen)
      panel.selected()
    diagram.selectStep(id)
  }
  const closeDocument = () => {
    router.closeDocument()
    if (!narrow)
      requestAnimationFrame(diagram.focusSelection)
  }
  const openDocument = (file: string, anchor: string) => {
    diagram.openDocument()
    router.openDocument(file, anchor)
  }
  const openView = router.openView
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)')
    const update = () => {
      setNarrow(media.matches)
      if (!media.matches)
        panel.dismiss()
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      // Radix and native LikeC4 overlays handle their topmost layer first.
      if (event.key !== 'Escape' || event.defaultPrevented || (narrow && (route.file || panel.navigationOpen)) || event.composedPath().some(target => target instanceof HTMLInputElement))
        return
      const hasNativeOverlay = diagram.hasOverlay()
      if (hasNativeOverlay)
        return
      if (route.file) {
        event.preventDefault()
        closeDocument()
      }
      else if (route.node || route.relation || route.step) {
        event.preventDefault()
        select('')
        requestAnimationFrame(diagram.focusSelection)
      }
    }
    globalThis.document.addEventListener('keydown', escape)
    return () => globalThis.document.removeEventListener('keydown', escape)
  }, [route, narrow, panel.navigationOpen, active])
  useEffect(() => {
    if (active && (!route.mode || route.mode === 'guide')) {
      const view = active.architecture.views[0]
      const next = { ...route, mode: view ? 'view' : 'full', view: view?.id ?? '' }
      router.replace(next)
    }
  }, [active, route.mode])
  useDiagramDocumentLinks(route.workspace, active, openDocument)
  useEffect(() => {
    globalThis.document.title = [contextTitle, workspaces.find(workspace => workspace.id === route.workspace)?.title, 'RSP'].filter(Boolean).join(' · ')
    let icon = globalThis.document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) {
      icon = globalThis.document.createElement('link')
      icon.rel = 'icon'
      globalThis.document.head.append(icon)
    }
    icon.href = rspIcon
  }, [contextTitle, workspaces, route.workspace])
  const sidebar = (
    <WorkspaceSidebar
      key={route.workspace}
      workspace={route.workspace}
      workspaces={workspaces}
      architecture={active?.architecture}
      mode={route.mode}
      view={route.view}
      root={active?.root}
      revision={active?.revision}
      selectionDisabled={!!route.file}
      onWorkspace={(workspace) => {
        router.switchWorkspace(workspace)
        // Workspace changes remount the sidebar and replace the Select trigger.
        requestAnimationFrame(() => globalThis.document.querySelector<HTMLButtonElement>('.workspace-picker [role="combobox"]')?.focus())
      }}
      onView={openView}
      onSelect={(node) => {
        if (route.file)
          return
        select(node)
        panel.selected()
        requestAnimationFrame(() => diagram.details.current?.focus({ preventScroll: true }))
      }}
    />
  )
  return (
    <div className="app">
      <NavigationPanel panel={panel} narrow={narrow} route={route} selection={selection} details={diagram.details} selectStep={selectStep}>
        {sidebar}
      </NavigationPanel>
      <section className="workbench">
        <ViewToolbar active={active} route={route} selection={selection} panel={panel} error={error} refreshing={refreshing} reload={reload} openView={openView} selectStep={selectStep} setVariant={router.setVariant} />
        <div className="workspace">
          {authoredView && !scenario && (
            <details className="view-context">
              <summary>{t('viewSelection')}</summary>
              <p>
                {t('relationTypes')}
                :
                {authoredView.relationTypes?.join(', ') ?? '*'}
                <br />
                {t('relationIds')}
                :
                {authoredView.relationIds?.join(', ') ?? '*'}
                <br />
                {t('boundaries')}
                :
                {t(authoredView.boundary === 'exclude' ? 'excluded' : 'included')}
              </p>
            </details>
          )}
          <DiagramCanvas active={active} route={route} selection={selection} controller={diagram} currentError={error} select={select} selectStep={selectStep}>
            {active && <SelectionDetails active={active} route={route} selection={selection} controller={diagram} select={select} selectStep={selectStep} openView={openView} openDocument={openDocument} focusNode={router.focusNode} />}
          </DiagramCanvas>
          <DocumentReader route={route} root={active?.root} revision={active?.revision} refresh={refresh} narrow={narrow} canvasWidth={diagram.canvasWidth} navigate={router.openDocument} closeDocument={closeDocument} focusSelection={diagram.focusSelection} />
        </div>
      </section>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<LocaleProvider><TooltipProvider delayDuration={450}><App /></TooltipProvider></LocaleProvider>)
