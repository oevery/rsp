import type { ArchitectureResult } from '../../architecture/model.js'
import type { WorkspaceSummary } from '../workspaces.js'
import { LikeC4Model } from '@likec4/core/model'
import { LikeC4ModelProvider, ReactLikeC4 } from '@likec4/diagram'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { selectArchitecture } from '../../architecture/selection.js'
import { rspIcon } from './branding.js'
import { renderDiagrams } from './document-diagrams.js'
import { LocaleProvider, useLocale } from './i18n.js'
import { localizeLayout } from './presentation.js'
import { StatusMessage } from './status-message.js'
import { Button, Chevron, CloseButton, NavigationItem, Select, Sheet, SheetContent, SheetTitle, Tooltip, TooltipProvider } from './ui/primitives.js'
import { WorkspaceSidebar } from './workspace-sidebar.js'

interface Route { workspace: string, mode: string, view: string, focus: string, node: string, relation: string, file: string, anchor: string, step?: string, variant?: string }
interface Payload { workspace: string, root: string, revision: string, graphRevision: string, focus?: string, missingFocus?: string, architecture: ArchitectureResult, layout: { data: any, names: Record<string, string>, viewNames: Record<string, string>, references: Record<string, string>, relationIds: Record<string, string>, focusView?: string, collaborationViews: Record<string, string>, stepIds: Record<string, Record<string, string>> } }
interface DocumentPayload { workspace: string, file: string, revision: string, html: string, headings: { anchor: string, title: string, depth: number }[] }
interface WorkspaceError { workspace: string, message: string }
interface DocumentError extends WorkspaceError { file: string }
interface AssetErrors { workspace: string, file: string, revision: string, messages: { file: string, message: string, stale: boolean }[] }
const tokenFromUrl = new URLSearchParams(location.hash.slice(1)).get('token')
if (tokenFromUrl) {
  sessionStorage.setItem('rsp-reading-token', tokenFromUrl)
  history.replaceState(null, '', location.pathname + location.search)
}
const token = sessionStorage.getItem('rsp-reading-token') ?? ''
function locationRoute(): Route {
  const query = new URLSearchParams(location.search)
  return { workspace: query.get('workspace') ?? '', mode: query.get('mode') ?? (query.has('focus') ? 'focus' : query.has('view') && query.get('view') ? 'view' : ''), view: query.get('view') ?? '', focus: query.get('focus') ?? '', node: query.get('node') ?? '', relation: query.get('relation') ?? '', file: query.get('file') ?? '', anchor: query.get('anchor') ?? '', step: query.get('step') ?? '', variant: query.get('variant') ?? '' }
}
async function api(path: string, signal?: AbortSignal) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store' })
  if (!response.ok)
    throw new Error(await response.text())
  return response
}
function App() {
  const { t } = useLocale()
  const [route, setRoute] = useState(locationRoute)
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [payload, setPayload] = useState<Payload | null>(null)
  const [document, setDocument] = useState<DocumentPayload | null>(null)
  const [error, setError] = useState<WorkspaceError | null>(null)
  const [documentError, setDocumentError] = useState<DocumentError | null>(null)
  const [assetErrors, setAssetErrors] = useState<AssetErrors | null>(null)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [panelPinned, setPanelPinned] = useState<boolean | null>(() => {
    const value = sessionStorage.getItem('rsp-panel-open')
    return value === null ? null : value === 'true'
  })
  const [panelTab, setPanelTab] = useState<'navigation' | 'steps'>('navigation')
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 760px)').matches)
  const [cardPosition, setCardPosition] = useState({ left: false, bottom: false })
  const [documentWidth, setDocumentWidth] = useState(580)
  const [documentExpanded, setDocumentExpanded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const reading = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLElement>(null)
  const diagramApi = useRef<any>(null)
  const xyflow = useRef<any>(null)
  const navigationTrigger = useRef<HTMLButtonElement>(null)
  const navigationPane = useRef<HTMLDivElement>(null)
  const stepsTrigger = useRef<HTMLButtonElement>(null)
  const navigationSelection = useRef(false)
  const details = useRef<HTMLElement>(null)
  const documentPane = useRef<HTMLElement>(null)
  const documentTrigger = useRef<HTMLElement | null>(null)
  const viewports = useRef(new Map<string, { x: number, y: number, zoom: number }>())
  const generation = useRef(0)
  const documentGeneration = useRef(0)
  const currentRoute = useRef(route)
  currentRoute.current = route
  const readingPosition = useRef<{ workspace: string, file: string, anchor?: string, offset: number, scrollTop: number } | null>(null)
  const lastReadingPosition = useRef<typeof readingPosition.current>(null)
  const active = payload?.workspace === route.workspace && (payload.focus ?? '') === (route.mode === 'focus' ? route.focus : '') ? payload : null
  const contextKey = active ? `${active.workspace}:${active.graphRevision}:${route.mode}:${route.view}:${route.focus}:${route.variant ?? ''}` : ''
  const saveViewport = () => {
    if (contextKey && xyflow.current && route.mode !== 'guide')
      viewports.current.set(contextKey, xyflow.current.getViewport())
  }
  const currentDocument = document?.workspace === route.workspace && document.file === route.file ? document : null
  const currentError = error?.workspace === route.workspace ? error.message : ''
  const currentDocumentError = documentError?.workspace === route.workspace && documentError.file === route.file ? documentError.message : ''
  const currentAssetErrors = assetErrors?.workspace === currentDocument?.workspace && assetErrors?.file === currentDocument?.file && assetErrors?.revision === currentDocument?.revision ? assetErrors?.messages ?? [] : []
  const captureReadingPosition = () => {
    const article = reading.current
    if (!article)
      return null
    // A queued scroll can arrive after breakpoint CSS reflows the old reader,
    // before React remounts it. Its geometry no longer describes the saved layout.
    if (matchMedia('(max-width: 760px)').matches !== narrow)
      return lastReadingPosition.current
    const top = article.getBoundingClientRect().top
    const heading = Array.from(article.querySelectorAll<HTMLElement>('[id]')).filter(element => element.getBoundingClientRect().top <= top + 40).at(-1)
    return { workspace: currentRoute.current.workspace, file: currentRoute.current.file, anchor: heading?.id, offset: heading ? top - heading.getBoundingClientRect().top : 0, scrollTop: article.scrollTop }
  }
  const bindReading = (element: HTMLElement | null) => {
    reading.current = element
    // Translate only renderer-owned annotations, without replacing the article,
    // resetting reading position or losing independently loaded image blobs.
    element?.querySelectorAll<HTMLElement>('[data-rsp-reading-status]').forEach((status) => {
      const key = status.dataset.rspReadingStatus
      if (key === 'unavailableLink' || key === 'unsupportedImage' || key === 'copySource' || key === 'diagramSource' || key === 'diagramError')
        status.textContent = t(key)
    })
    // Narrow readers mount in a portal, possibly after the parent's layout effects.
    const position = readingPosition.current
    if (element && position && position.workspace === currentDocument?.workspace && position.file === currentDocument?.file) {
      const heading = Array.from(element.querySelectorAll<HTMLElement>('[id]')).find(element => element.id === position.anchor)
      element.scrollTop = heading ? element.scrollTop + heading.getBoundingClientRect().top - element.getBoundingClientRect().top + position.offset : position.scrollTop
      readingPosition.current = null
    }
    if (element)
      lastReadingPosition.current = captureReadingPosition()
    if (element)
      renderDiagrams(element, t)
  }
  const navigate = (next: Route) => {
    saveViewport()
    history.pushState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
    setRoute(next)
    setNavigationOpen(false)
  }
  const focusSelection = () => {
    const nativeEdges = new Set(Object.values(active?.layout.data.views ?? {}).flatMap((view: any) => view.edges.filter((edge: any) => edge.relations.some((relation: string) => active?.layout.relationIds[relation] === route.relation)).map((edge: any) => edge.id)))
    if (route.step) {
      for (const [edge, step] of Object.entries(active?.layout.stepIds[active?.layout.viewNames[route.view] ?? ''] ?? {})) {
        if (step === route.step)
          nativeEdges.add(edge)
      }
    }
    const find = (root: Element | ShadowRoot): HTMLElement | null => {
      for (const element of root.querySelectorAll<HTMLElement>('*')) {
        if (element.matches('.react-flow__node') && (element.dataset.id === active?.layout.names[route.node] || active?.layout.references[element.dataset.id ?? ''] === route.node))
          return element
        if ((route.relation || route.step) && element.matches('.react-flow__edge') && nativeEdges.has(element.dataset.id))
          return element
        const nested = element.shadowRoot && find(element.shadowRoot)
        if (nested)
          return nested
      }
      return null
    }
    const target = ((route.node || route.relation || route.step) && canvas.current && find(canvas.current)) || documentTrigger.current || canvas.current
    if (target?.isConnected)
      target.focus({ preventScroll: true })
    else details.current?.focus({ preventScroll: true })
  }
  const closeDocument = () => {
    navigate({ ...route, file: '', anchor: '' })
    if (!narrow)
      requestAnimationFrame(focusSelection)
  }
  const openDocument = (file: string, anchor: string) => {
    documentTrigger.current = globalThis.document.activeElement as HTMLElement
    diagramApi.current?.overlays().send({ type: 'close.all' })
    navigate({ ...route, file, anchor })
  }
  const placeDetails = (id: string, displayName?: string) => {
    const flow = xyflow.current
    const bounds = canvas.current?.getBoundingClientRect()
    const aliases = [displayName, active?.layout.names[id], ...Object.entries(active?.layout.references ?? {}).filter(([, original]) => original === id).map(([name]) => name)]
    const node = aliases.map(name => name && flow?.getNode(name)).find(Boolean)
    if (!bounds || !node) {
      setCardPosition({ left: false, bottom: false })
      return
    }
    let position = { ...node.position }
    let parent = node.parentId
    while (parent) {
      const container = flow.getNode(parent)
      position = { x: position.x + container.position.x, y: position.y + container.position.y }
      parent = container.parentId
    }
    const origin = flow.flowToScreenPosition(position)
    const zoom = flow.getZoom()
    const target = { left: origin.x - bounds.left, top: origin.y - bounds.top, width: (node.measured?.width ?? node.width ?? 200) * zoom, height: (node.measured?.height ?? node.height ?? 100) * zoom }
    const width = Math.min(360, bounds.width - 32)
    const height = Math.min(560, bounds.height - 32)
    const positions = [{ left: false, bottom: false }, { left: true, bottom: false }, { left: false, bottom: true }, { left: true, bottom: true }]
    const overlap = (candidate: typeof cardPosition) => {
      const x = candidate.left ? 16 : bounds.width - width - 16
      const y = candidate.bottom ? bounds.height - height - 16 : 16
      return Math.max(0, Math.min(x + width, target.left + target.width) - Math.max(x, target.left)) * Math.max(0, Math.min(y + height, target.top + target.height) - Math.max(y, target.top))
    }
    setCardPosition(positions.sort((a, b) => overlap(a) - overlap(b))[0]!)
  }
  const select = (node: string, relation = '', displayName?: string) => {
    if (route.file)
      return
    placeDetails(node, displayName)
    diagramApi.current?.unhighlightAll()
    diagramApi.current?.select()
    const next = { ...route, node, relation, step: '' }
    history.replaceState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
    setRoute(next)
  }
  const openView = (view: string) => navigate({ ...route, mode: view ? 'view' : 'full', view, focus: '', node: '', relation: '', file: '', anchor: '', step: '', variant: '' })
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)')
    const update = () => {
      // Media styles have already reflowed the old reader; use its last scroll position.
      readingPosition.current = lastReadingPosition.current
      setNarrow(media.matches)
      if (!media.matches)
        setNavigationOpen(false)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (route.file && !narrow)
      documentPane.current?.focus({ preventScroll: true })
  }, [!!route.file, narrow])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      // Radix and native LikeC4 overlays handle their topmost layer first.
      if (event.key !== 'Escape' || event.defaultPrevented || (narrow && (route.file || navigationOpen)) || event.composedPath().some(target => target instanceof HTMLInputElement))
        return
      const hasNativeOverlay = canvas.current && Array.from(canvas.current.querySelectorAll('*')).some(element => element.shadowRoot?.querySelector('.relationships-browser'))
      if (hasNativeOverlay)
        return
      if (route.file) {
        event.preventDefault()
        closeDocument()
      }
      else if (route.node || route.relation || route.step) {
        event.preventDefault()
        select('')
        requestAnimationFrame(focusSelection)
      }
    }
    globalThis.document.addEventListener('keydown', escape)
    return () => globalThis.document.removeEventListener('keydown', escape)
  }, [route, narrow, navigationOpen, active])
  useEffect(() => {
    if (active && (!route.mode || route.mode === 'guide')) {
      const view = active.architecture.views[0]
      const next = { ...route, mode: view ? 'view' : 'full', view: view?.id ?? '' }
      history.replaceState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
      setRoute(next)
    }
  }, [active, route.mode])
  const resizeDocument = (event: React.PointerEvent<HTMLElement>) => {
    const initial = event.currentTarget.parentElement!.getBoundingClientRect().width
    const start = event.clientX
    const resize = (move: PointerEvent) => setDocumentWidth(Math.min(canvas.current?.clientWidth ?? innerWidth, Math.max(340, initial + start - move.clientX)))
    const stop = () => {
      removeEventListener('pointermove', resize)
      removeEventListener('pointerup', stop)
      removeEventListener('pointercancel', stop)
    }
    event.preventDefault()
    setDocumentExpanded(false)
    addEventListener('pointermove', resize)
    addEventListener('pointerup', stop, { once: true })
    addEventListener('pointercancel', stop, { once: true })
  }
  useEffect(() => {
    if (active) {
      for (const key of viewports.current.keys()) {
        if (key.startsWith(`${active.workspace}:`) && !key.startsWith(`${active.workspace}:${active.graphRevision}:`))
          viewports.current.delete(key)
      }
    }
  }, [active?.workspace, active?.graphRevision])
  useEffect(() => {
    const sync = () => {
      saveViewport()
      setRoute(locationRoute())
    }
    addEventListener('popstate', sync)
    return () => removeEventListener('popstate', sync)
  }, [contextKey])
  useEffect(() => {
    // Native details use a shadow root and target=_blank links. Inspect the
    // composed path before that default action, keeping the reading credential local.
    const openBinding = (event: MouseEvent) => {
      const link = event.composedPath().find((target): target is HTMLAnchorElement => target instanceof HTMLAnchorElement)
      if (!link)
        return
      const url = new URL(link.href)
      const file = url.searchParams.get('file')
      if (url.origin !== location.origin || url.pathname !== '/' || url.searchParams.get('workspace') !== route.workspace || !file)
        return
      event.preventDefault()
      event.stopPropagation()
      const headings = url.searchParams.get('headings')
      const binding = active?.architecture.nodes.flatMap(node => node.bindings).find(binding => binding.file === file && JSON.stringify(binding.headings) === (headings ?? undefined))
      openDocument(file, binding?.anchor ?? '')
    }
    globalThis.document.addEventListener('click', openBinding, true)
    return () => globalThis.document.removeEventListener('click', openBinding, true)
  }, [route, active])
  useEffect(() => {
    const controller = new AbortController()
    const load = () => api('/api/workspaces', controller.signal).then(response => response.json()).then(setWorkspaces).catch(() => {})
    void load()
    const timer = setInterval(load, 10_000)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    const current = ++generation.current
    const controller = new AbortController()
    let running = false
    const load = async () => {
      if (running)
        return
      running = true
      try {
        const focus = route.mode === 'focus' ? route.focus : ''
        const next: Payload = await (await api(`/api/workspaces/${route.workspace}/model${focus ? `?${new URLSearchParams({ focus })}` : ''}`, controller.signal)).json()
        if (current !== generation.current || next.workspace !== route.workspace || currentRoute.current.workspace !== route.workspace || (currentRoute.current.mode === 'focus' ? currentRoute.current.focus : '') !== focus)
          return
        setPayload(previous => previous?.workspace === next.workspace && previous.revision === next.revision && previous.focus === next.focus && previous.missingFocus === next.missingFocus ? previous : next)
        setError(null)
      }
      catch (error) {
        if (!controller.signal.aborted && current === generation.current && currentRoute.current.workspace === route.workspace)
          setError({ workspace: route.workspace, message: (error as Error).message })
      }
      finally {
        running = false
        if (current === generation.current)
          setRefreshing(false)
      }
    }
    const heartbeat = () => void api(`/api/workspaces/${route.workspace}/heartbeat`, controller.signal).catch(() => {})
    const reactivate = () => {
      if (globalThis.document.visibilityState === 'visible')
        void load()
    }
    void load()
    heartbeat()
    const poll = setInterval(load, 5000)
    const beat = setInterval(heartbeat, 20_000)
    globalThis.document.addEventListener('visibilitychange', reactivate)
    addEventListener('focus', reactivate)
    return () => {
      controller.abort()
      clearInterval(poll)
      clearInterval(beat)
      globalThis.document.removeEventListener('visibilitychange', reactivate)
      removeEventListener('focus', reactivate)
    }
  }, [route.workspace, route.mode === 'focus' ? route.focus : '', refresh])
  useEffect(() => {
    const current = ++documentGeneration.current
    if (!route.file || !active) {
      setDocumentError(null)
      return
    }
    const controller = new AbortController()
    let running = false
    const load = async () => {
      if (running)
        return
      running = true
      try {
        const next: DocumentPayload = await (await api(`/api/workspaces/${route.workspace}/document?${new URLSearchParams({ file: route.file })}`, controller.signal)).json()
        if (current === documentGeneration.current && next.workspace === route.workspace && next.file === route.file && currentRoute.current.workspace === route.workspace && currentRoute.current.file === route.file) {
          setDocument((previous) => {
            if (previous?.workspace === next.workspace && previous.file === next.file && previous.revision === next.revision)
              return previous
            if (previous?.workspace === next.workspace && previous.file === next.file)
              readingPosition.current = captureReadingPosition()
            return next
          })
          setDocumentError(null)
        }
      }
      catch (error) {
        if (!controller.signal.aborted && current === documentGeneration.current && currentRoute.current.workspace === route.workspace && currentRoute.current.file === route.file)
          setDocumentError({ workspace: route.workspace, file: route.file, message: (error as Error).message })
      }
      finally {
        running = false
      }
    }
    const reactivate = () => {
      if (globalThis.document.visibilityState === 'visible')
        void load()
    }
    void load()
    const poll = setInterval(load, 5000)
    globalThis.document.addEventListener('visibilitychange', reactivate)
    addEventListener('focus', reactivate)
    return () => {
      controller.abort()
      clearInterval(poll)
      globalThis.document.removeEventListener('visibilitychange', reactivate)
      removeEventListener('focus', reactivate)
    }
  }, [route.workspace, route.file, active?.revision, refresh])
  useEffect(() => {
    const article = reading.current
    if (!article || !currentDocument)
      return
    const controller = new AbortController()
    const images = Array.from(article.querySelectorAll<HTMLImageElement>('img[data-asset]')).map(image => ({ image, revision: '', blob: '' }))
    const isCurrent = () => !controller.signal.aborted && currentRoute.current.workspace === currentDocument.workspace && currentRoute.current.file === currentDocument.file
    let running = false
    const load = async () => {
      if (running)
        return
      running = true
      const errors = await Promise.all(images.map(async (state) => {
        try {
          const response = await api(`/api/workspaces/${route.workspace}/asset?${new URLSearchParams({ file: state.image.dataset.asset! })}`, controller.signal)
          const revision = response.headers.get('ETag') ?? ''
          const blob = await response.blob()
          if (isCurrent() && (!state.blob || state.revision !== revision)) {
            const previous = state.blob
            state.blob = URL.createObjectURL(blob)
            state.revision = revision
            state.image.src = state.blob
            if (previous)
              URL.revokeObjectURL(previous)
          }
          return null
        }
        catch (error) {
          return { file: state.image.dataset.asset!, stale: !!state.blob, message: (error as Error).message }
        }
      }))
      if (isCurrent())
        setAssetErrors({ workspace: currentDocument.workspace, file: currentDocument.file, revision: currentDocument.revision, messages: errors.filter(error => error !== null) })
      running = false
    }
    const reactivate = () => {
      if (globalThis.document.visibilityState === 'visible')
        void load()
    }
    setAssetErrors(null)
    void load()
    const poll = setInterval(load, 5000)
    globalThis.document.addEventListener('visibilitychange', reactivate)
    addEventListener('focus', reactivate)
    return () => {
      controller.abort()
      clearInterval(poll)
      globalThis.document.removeEventListener('visibilitychange', reactivate)
      removeEventListener('focus', reactivate)
      images.forEach(state => state.blob && URL.revokeObjectURL(state.blob))
    }
  }, [currentDocument, narrow])
  useEffect(() => {
    if (!reading.current || !currentDocument)
      return
    if (route.anchor)
      Array.from(reading.current.querySelectorAll('[id]')).find(element => element.id === route.anchor)?.scrollIntoView()
    else reading.current.scrollTop = 0
  }, [route.workspace, route.file, route.anchor, !!currentDocument])
  const model = useMemo(() => active ? LikeC4Model.create(localizeLayout(active.architecture, active.layout, active.focus, t)) : null, [active?.workspace, active?.graphRevision, active?.focus, t])
  const selectedView = active && Object.hasOwn(active.layout.viewNames, route.view) ? active.layout.viewNames[route.view] : undefined
  const missingView = !!active && route.mode === 'view' && selectedView === undefined
  const authoredView = route.mode === 'view' ? active?.architecture.views.find(view => view.id === route.view) : undefined
  const scenario = authoredView?.scenario
  const viewId = route.mode === 'focus' && !active?.missingFocus ? active?.layout.focusView : scenario && route.variant === 'diagram' ? active?.layout.collaborationViews[route.view] : selectedView ?? active?.layout.viewNames['']
  const desktopPanelOpen = panelPinned ?? !scenario
  const activePanelTab = scenario ? panelTab : 'navigation'
  const panelVisible = narrow ? navigationOpen : desktopPanelOpen
  const openPanel = (tab: 'navigation' | 'steps') => {
    setPanelTab(tab)
    navigationSelection.current = false
    if (narrow) {
      setNavigationOpen(true)
    }
    else {
      setPanelPinned(true)
      sessionStorage.setItem('rsp-panel-open', 'true')
    }
  }
  const closePanel = () => {
    if (narrow) {
      setNavigationOpen(false)
    }
    else {
      setPanelPinned(false)
      sessionStorage.setItem('rsp-panel-open', 'false')
      requestAnimationFrame(() => (activePanelTab === 'steps' ? stepsTrigger : navigationTrigger).current?.focus())
    }
  }
  const selectedStep = scenario?.steps.find(step => step.id === route.step)
  const participant = (id: string) => scenario?.participants.find(participant => participant.id === id)
  const participantTitle = (id: string) => participant(id)?.title ?? active?.architecture.nodes.find(node => node.id === participant(id)?.node)?.title ?? id
  const diagramElements = (selector: string): Element[] => {
    const collect = (root: Element | ShadowRoot): Element[] => [
      ...root.querySelectorAll(selector),
      ...Array.from(root.querySelectorAll('*')).flatMap(element => element.shadowRoot ? collect(element.shadowRoot) : []),
    ]
    return canvas.current ? collect(canvas.current) : []
  }
  const fitGraphBounds = (bounds: { x: number, y: number, width: number, height: number }) => {
    const area = canvas.current?.getBoundingClientRect()
    if (!area || !xyflow.current)
      return
    const zoom = Math.min(1, Math.max(1, area.width - 48) / Math.max(1, bounds.width), Math.max(1, area.height - 48) / Math.max(1, bounds.height))
    void xyflow.current.setViewport({ x: Math.round(area.width / 2 - (bounds.x + bounds.width / 2) * zoom), y: Math.round(area.height / 2 - (bounds.y + bounds.height / 2) * zoom), zoom }, { duration: 0 })
  }
  const fitOverview = () => {
    const flow = xyflow.current
    if (!flow)
      return
    const boxes = diagramElements('.react-flow__node, .react-flow__edge .likec4-edge__path, .likec4-edge-label').map(element => element.getBoundingClientRect()).filter(box => box.width || box.height)
    if (!boxes.length)
      return
    const start = flow.screenToFlowPosition({ x: Math.min(...boxes.map(box => box.left)), y: Math.min(...boxes.map(box => box.top)) })
    const end = flow.screenToFlowPosition({ x: Math.max(...boxes.map(box => box.right)), y: Math.max(...boxes.map(box => box.bottom)) })
    fitGraphBounds({ x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y })
  }
  const revealStep = (id: string, preserveZoom = false) => {
    const edgeId = Object.entries(active?.layout.stepIds[viewId ?? ''] ?? {}).find(([, step]) => step === id)?.[0]
    const flow = xyflow.current
    const area = canvas.current
    const element = diagramElements('.react-flow__edge').find(element => element.getAttribute('data-id') === edgeId)
    if (!element || !flow || !area)
      return
    // Sequence rendering has different geometry from its underlying graph layout.
    const edge = (element.querySelector('.likec4-edge__path') ?? element).getBoundingClientRect()
    if (preserveZoom) {
      const label = diagramElements('.likec4-edge-label').find(label => label.getAttribute('data-edge-id') === edgeId)?.getBoundingClientRect()
      const bounds = area.getBoundingClientRect()
      const card = details.current?.getBoundingClientRect()
      const left = Math.min(edge.left, label?.left ?? edge.left)
      const right = Math.max(edge.right, label?.right ?? edge.right)
      const top = Math.min(edge.top, label?.top ?? edge.top)
      const bottom = Math.max(edge.bottom, label?.bottom ?? edge.bottom)
      const overlapsCard = card && right > card.left && left < card.right && bottom > card.top && top < card.bottom
      const visibleBottom = overlapsCard ? card.top - 16 : bounds.bottom - 16
      const shift = (start: number, end: number, low: number, high: number) => end - start > high - low ? (low + high - start - end) / 2 : start < low ? low - start : end > high ? high - end : 0
      const dx = shift(left, right, bounds.left + 16, bounds.right - 16)
      const dy = shift(top, bottom, bounds.top + 16, visibleBottom)
      if (dx || dy) {
        const viewport = flow.getViewport()
        void flow.setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }, { duration: 0 })
      }
      return
    }
    const from = flow.screenToFlowPosition({ x: edge.left, y: edge.top })
    const to = flow.screenToFlowPosition({ x: edge.right, y: edge.bottom })
    const xs = [from.x, to.x]
    const ys = [from.y, to.y]
    const message = flow.getEdge(edgeId)
    for (const id of [message?.source, message?.target]) {
      const node = diagramElements('.react-flow__node').find(node => node.getAttribute('data-id') === id)
      if (node) {
        const box = node.getBoundingClientRect()
        const left = flow.screenToFlowPosition({ x: box.left, y: box.top })
        const right = flow.screenToFlowPosition({ x: box.right, y: box.top })
        xs.push(left.x, right.x)
        ys.push(left.y)
      }
    }
    const bounds = area.getBoundingClientRect()
    // Keep the selected message above the details card, including on narrow screens.
    const card = details.current?.getBoundingClientRect()
    const height = Math.max(100, card ? card.top - bounds.top - 24 : bounds.height * 0.45)
    const width = Math.max(100, bounds.width - 64)
    const zoom = Math.min(1, width / Math.max(1, Math.max(...xs) - Math.min(...xs) + 80), height / Math.max(80, Math.max(...ys) - Math.min(...ys) + 80))
    void flow.setViewport({ x: Math.round(bounds.width / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 * zoom), y: Math.round(height / 2 - (Math.min(...ys) + Math.max(...ys)) / 2 * zoom), zoom }, { duration: 0 })
  }
  const highlightStep = (id: string) => {
    const edge = Object.entries(active?.layout.stepIds[viewId ?? ''] ?? {}).find(([, step]) => step === id)?.[0]
    if (edge) {
      diagramApi.current?.select({ edges: [edge] })
      diagramApi.current?.highlightEdge(edge)
    }
  }
  const selectStep = (id: string) => {
    if (route.file)
      return
    const next = { ...route, node: '', relation: '', step: id }
    history.replaceState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
    setRoute(next)
    if (narrow && navigationOpen) {
      navigationSelection.current = true
      setNavigationOpen(false)
    }
    highlightStep(id)
    setCardPosition({ left: false, bottom: true })
    requestAnimationFrame(() => revealStep(id))
  }
  const selectedNode = active?.architecture.nodes.find(node => node.id === route.node)
  const selectedRelation = active?.architecture.relations.find(relation => relation.id === route.relation)
  const viewsForNode = active?.architecture.views.filter(view => view.node === selectedNode?.id || (!!selectedNode && view.include.includes(selectedNode.id)) || view.scenario?.participants.some(participant => participant.node === selectedNode?.id)) ?? []
  const bindings = selectedNode?.bindings ?? []
  const uniqueBindings = [...new Map(bindings.map(binding => [`${binding.file}:${binding.anchor ?? ''}:${binding.origin}`, binding])).values()]
  const projection = active ? selectArchitecture(active.architecture, route.mode === 'focus' && !active.missingFocus ? { kind: 'focus', id: route.focus } : route.mode === 'view' && !missingView ? { kind: 'view', id: route.view } : { kind: 'full' }) : null
  const nativeView = viewId && active?.layout.data.views[viewId]
  const drawnRelations = new Set<string>(nativeView?.edges.flatMap((edge: any) => edge.relations.map((id: string) => active!.layout.relationIds[id])) ?? [])
  const undrawn = projection?.relations.filter(relation => !drawnRelations.has(relation.id)) ?? []
  const relationships = selectedNode ? active!.architecture.relations.filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id) : []
  const originalNode = (name: string) => active?.layout.references[name] ?? Object.keys(active?.layout.names ?? {}).find(id => active?.layout.names[id] === name) ?? ''
  const contextTitle = route.mode === 'focus' && !active?.missingFocus ? t('relationshipsOf', { title: active?.architecture.nodes.find(node => node.id === route.focus)?.title ?? route.focus }) : route.mode === 'view' && !missingView ? active?.architecture.views.find(view => view.id === route.view)?.title : t('allNodes')
  // LikeC4 fixes the viewport if fitView is false without an initialZoom.
  const savedViewport = viewports.current.get(contextKey)
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
  useEffect(() => {
    const area = canvas.current
    if (!area)
      return
    let previous = area.getBoundingClientRect()
    let windowWidth = innerWidth
    let windowHeight = innerHeight
    const observer = new ResizeObserver(() => {
      const bounds = area.getBoundingClientRect()
      const before = previous
      const windowResized = windowWidth !== innerWidth || windowHeight !== innerHeight
      previous = bounds
      windowWidth = innerWidth
      windowHeight = innerHeight
      if (route.file || !xyflow.current || (bounds.width === before.width && bounds.height === before.height && bounds.left === before.left && bounds.top === before.top))
        return
      const viewport = xyflow.current.getViewport()
      // Window resizing preserves the reading center; panel changes preserve screen position.
      void xyflow.current.setViewport({
        ...viewport,
        x: viewport.x + (windowResized ? (bounds.width - before.width) / 2 : before.left - bounds.left),
        y: viewport.y + (windowResized ? (bounds.height - before.height) / 2 : before.top - bounds.top),
      }, { duration: 0 })
      const step = currentRoute.current.step
      if (step)
        requestAnimationFrame(() => revealStep(step, true))
    })
    observer.observe(area)
    return () => observer.disconnect()
  }, [contextKey, route.file])
  const detailOpen = !!selectedNode || !!selectedRelation || !!selectedStep
  const relationDetails = (relation: ArchitectureResult['relations'][number]) => (
    <Button className="relationship-row" key={relation.id} onClick={() => select('', relation.id)}>
      <span>
        {active?.architecture.nodes.find(node => node.id === relation.source)?.title}
        {' '}
        →
        {' '}
        {active?.architecture.nodes.find(node => node.id === relation.target)?.title}
      </span>
      <small>
        {relation.label ?? relation.type}
        {' '}
        ·
        {' '}
        {relation.description}
        {!drawnRelations.has(relation.id) && projection?.relations.includes(relation) ? ` · ${t('notDrawn')}` : ''}
      </small>
    </Button>
  )
  const clickDocument = (event: React.MouseEvent<HTMLElement>) => {
    const source = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-source-locator]')
    if (source && reading.current?.contains(source)) {
      const locator = source.dataset.sourceLocator!
      void navigator.clipboard.writeText(`${active!.root}/${locator}`).then(() => {
        source.querySelector('span')!.textContent = t('copiedSource')
      }).catch(() => {
        const selection = globalThis.getSelection()
        const range = globalThis.document.createRange()
        range.selectNodeContents(source.querySelector('code')!)
        selection?.removeAllRanges()
        selection?.addRange(range)
      })
      return
    }
    const link = (event.target as HTMLElement).closest('a')
    if (!link || !reading.current?.contains(link))
      return
    const url = new URL(link.href)
    if (url.origin !== location.origin)
      return
    event.preventDefault()
    if (url.hash) {
      navigate({ ...route, anchor: decodeURIComponent(url.hash.slice(1)) })
      return
    }
    navigate({ ...route, file: url.searchParams.get('file') ?? route.file, anchor: url.searchParams.get('anchor') ?? '' })
  }
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
        navigate({ workspace, mode: '', view: '', focus: '', node: '', relation: '', file: '', anchor: '' })
        // Workspace changes remount the sidebar and replace the Select trigger.
        requestAnimationFrame(() => globalThis.document.querySelector<HTMLButtonElement>('.workspace-picker [role="combobox"]')?.focus())
      }}
      onView={openView}
      onSelect={(node) => {
        if (route.file)
          return
        navigationSelection.current = true
        select(node)
        setNavigationOpen(false)
        requestAnimationFrame(() => details.current?.focus({ preventScroll: true }))
      }}
    />
  )
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
      <div className="side-panel-content" id="navigation-panel" role={scenario ? 'tabpanel' : 'region'} aria-labelledby="navigation-tab" hidden={activePanelTab !== 'navigation'}>{sidebar}</div>
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
  const reader = (
    <section ref={documentPane} aria-busy={!currentDocument} tabIndex={-1} className={`document-pane ${documentExpanded ? 'document-expanded' : ''}`} style={{ width: documentExpanded ? '100%' : `${documentWidth}px` }} aria-label={t('completeDocument')}>
      <div
        className="document-resize"
        role="separator"
        aria-label={t('resizeDocument')}
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={resizeDocument}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            setDocumentExpanded(false)
            setDocumentWidth(width => Math.min(canvas.current?.clientWidth ?? innerWidth, Math.max(340, width + (event.key === 'ArrowLeft' ? 40 : -40))))
          }
        }}
      />
      <div className="document-toolbar">
        <Tooltip label={route.file}><strong tabIndex={0}>{route.file}</strong></Tooltip>
        <div className="document-toolbar-actions">
          <Button className="reading-expand" onClick={() => setDocumentExpanded(value => !value)}>{t(documentExpanded ? 'reduceReading' : 'expandReading')}</Button>
          <Button onClick={closeDocument}>{t('returnToGraph')}</Button>
        </div>
      </div>
      {currentDocumentError && <StatusMessage kind="document" stale={!!currentDocument} message={currentDocumentError} />}
      {currentAssetErrors.map(error => <StatusMessage kind="image" stale={error.stale} file={error.file} message={error.message} key={error.file} />)}
      {route.anchor && currentDocument && !currentDocument.headings.some(heading => heading.anchor === route.anchor) && <p className="reading-status" role="status">{t('missingChapter')}</p>}
      {currentDocument
        ? (
            <div className="reading-layout">
              <details className="document-toc" open>
                <summary>{t('onThisPage')}</summary>
                <nav aria-label={t('tableOfContents')}>{currentDocument.headings.map(heading => <Button key={heading.anchor} style={{ paddingLeft: `${(heading.depth - 1) * 8 + 8}px` }} onClick={() => navigate({ ...route, anchor: heading.anchor })}>{heading.title}</Button>)}</nav>
              </details>
              <article ref={bindReading} onScroll={() => { lastReadingPosition.current = captureReadingPosition() }} onClick={clickDocument} dangerouslySetInnerHTML={{ __html: currentDocument.html }} />
            </div>
          )
        : <p className="opening" role="status">{t('openingDocument')}</p>}
    </section>
  )
  return (
    <div className="app">
      {narrow
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
        : <div className="desktop-side-panel" hidden={!desktopPanelOpen}>{sidePanel}</div>}
      <section className="workbench">
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
              onClick={() => {
                setRefreshing(true)
                setRefresh(value => value + 1)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></svg>
            </Button>
          </Tooltip>
        </header>
        {currentError && <StatusMessage kind="architecture" stale={!!active} message={currentError} />}
        {scenario && (
          <div className="scenario-toolbar">
            <Button
              ref={stepsTrigger}
              aria-expanded={panelVisible && activePanelTab === 'steps'}
              onClick={() => openPanel('steps')}
            >
              {`${t('scenarioSteps')} · ${scenario.steps.length}`}
            </Button>
            <Button aria-pressed={route.variant !== 'diagram'} onClick={() => navigate({ ...route, variant: '' })}>{t('sequence')}</Button>
            <Button aria-pressed={route.variant === 'diagram'} onClick={() => navigate({ ...route, variant: 'diagram' })}>{t('collaboration')}</Button>
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
          <main className="canvas" tabIndex={-1} aria-label={t('architecture')} ref={canvas}>
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
                      viewId={viewId as any}
                      colorScheme="light"
                      injectFontCss={false}
                      style={{ width: '100%', height: '100%' }}
                      pannable
                      zoomable
                      controls={false}
                      fitView={false}
                      initialZoom={savedViewport?.zoom ?? 1}
                      showNavigationButtons={false}
                      enableElementDetails={false}
                      enableRelationshipDetails={false}
                      enableRelationshipBrowser={!route.file}
                      nodesSelectable={!route.file}
                      enableSearch={false}
                      enableFocusMode={false}
                      onInitialized={({ diagram, xyflow: flow }) => {
                        diagramApi.current = diagram
                        xyflow.current = flow
                        const saved = viewports.current.get(contextKey)
                        if (saved) {
                          requestAnimationFrame(() => void flow.setViewport(saved))
                        }
                        else if (scenario) {
                          requestAnimationFrame(fitOverview)
                        }
                        else if (nativeView) {
                          fitGraphBounds(nativeView.bounds)
                        }
                        requestAnimationFrame(() => placeDetails(route.node))
                        if (route.step) {
                          requestAnimationFrame(() => {
                            highlightStep(route.step!)
                            setCardPosition({ left: false, bottom: true })
                            requestAnimationFrame(() => revealStep(route.step!))
                          })
                        }
                      }}
                      onNodeClick={(node) => {
                        if (!route.file)
                          select(originalNode(node.id), '', node.id)
                      }}
                      onEdgeClick={(edge) => {
                        if (route.file)
                          return
                        const step = active.layout.stepIds[viewId]?.[edge.id]
                        if (step) {
                          selectStep(step)
                          return
                        }
                        const native = active.layout.data.views[viewId]?.edges.find((candidate: any) => candidate.id === edge.id)
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
                <nav aria-label={t('undrawnRelationships')}>{undrawn.map(relationDetails)}</nav>
              </details>
            )}
            {active && route.mode !== 'guide' && (
              <div className="canvas-controls" aria-label={t('canvasControls')}>
                <Tooltip label={t('zoomIn')}><Button size="icon" aria-label={t('zoomIn')} onClick={() => void xyflow.current?.zoomIn()}>+</Button></Tooltip>
                <Tooltip label={t('zoomOut')}><Button size="icon" aria-label={t('zoomOut')} onClick={() => void xyflow.current?.zoomOut()}>−</Button></Tooltip>
                <Tooltip label={t('fitHint')}><Button onClick={() => fitOverview()}>{t('fit')}</Button></Tooltip>
              </div>
            )}
            {active && detailOpen && !route.file && (
              <aside ref={details} tabIndex={-1} className={`detail-panel ${cardPosition.left ? 'card-left' : ''} ${cardPosition.bottom ? 'card-bottom' : ''}`} aria-label={t('details')}>
                <div className="detail-heading">
                  <span>{t(selectedStep ? 'scenarioStep' : selectedRelation ? 'relationship' : 'object')}</span>
                  <CloseButton
                    label={t('closeDetails')}
                    onClick={() => {
                      select('')
                      requestAnimationFrame(focusSelection)
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
                      <Button className="focus-action" onClick={() => navigate({ ...route, mode: 'focus', focus: selectedNode.id, view: '', node: selectedNode.id, relation: '', file: '', anchor: '' })}>
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
                        <nav aria-label={t('objectRelationships')}>{relationships.map(relationDetails)}</nav>
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
            )}
          </main>
          {route.file && (narrow
            ? (
                <Sheet open onOpenChange={open => !open && closeDocument()}>
                  <SheetContent
                    className="reading-sheet right-0 w-full"
                    onOpenAutoFocus={(event) => {
                      event.preventDefault()
                      documentPane.current?.focus({ preventScroll: true })
                    }}
                    onCloseAutoFocus={(event) => {
                      event.preventDefault()
                      requestAnimationFrame(focusSelection)
                    }}
                  >
                    <SheetTitle className="sr-only">{t('readCompleteDocument')}</SheetTitle>
                    {reader}
                  </SheetContent>
                </Sheet>
              )
            : reader)}
        </div>
      </section>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<LocaleProvider><TooltipProvider delayDuration={450}><App /></TooltipProvider></LocaleProvider>)
