import type { ArchitectureResult } from '../../architecture/model.js'
import type { WorkspaceSummary } from '../workspaces.js'
import { LikeC4Model } from '@likec4/core/model'
import { LikeC4ModelProvider, ReactLikeC4 } from '@likec4/diagram'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { selectArchitecture } from '../../architecture/selection.js'
import { rspIcon } from './branding.js'
import { LocaleProvider, useLocale } from './i18n.js'
import { localizeLayout } from './presentation.js'
import { StatusMessage } from './status-message.js'
import { Button, Chevron, CloseButton, NavigationItem, Sheet, SheetContent, SheetTitle, Tooltip, TooltipProvider } from './ui/primitives.js'
import { WorkspaceSidebar } from './workspace-sidebar.js'

interface Route { workspace: string, mode: string, view: string, focus: string, node: string, relation: string, file: string, anchor: string }
interface Payload { workspace: string, root: string, revision: string, graphRevision: string, focus?: string, missingFocus?: string, architecture: ArchitectureResult, layout: { data: any, names: Record<string, string>, viewNames: Record<string, string>, references: Record<string, string>, relationIds: Record<string, string>, focusView?: string } }
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
  return { workspace: query.get('workspace') ?? '', mode: query.get('mode') ?? (query.has('focus') ? 'focus' : query.has('view') && query.get('view') ? 'view' : ''), view: query.get('view') ?? '', focus: query.get('focus') ?? '', node: query.get('node') ?? '', relation: query.get('relation') ?? '', file: query.get('file') ?? '', anchor: query.get('anchor') ?? '' }
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
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 760px)').matches)
  const [cardPosition, setCardPosition] = useState({ left: false, bottom: false })
  const [documentWidth, setDocumentWidth] = useState(580)
  const [documentExpanded, setDocumentExpanded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const reading = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLElement>(null)
  const diagramApi = useRef<any>(null)
  const xyflow = useRef<any>(null)
  const navigationTrigger = useRef<HTMLButtonElement>(null)
  const navigationPane = useRef<HTMLDivElement>(null)
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
  const contextKey = active ? `${active.workspace}:${active.graphRevision}:${route.mode}:${route.view}:${route.focus}` : ''
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
      if (key === 'unavailableLink' || key === 'unsupportedImage')
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
  }
  const navigate = (next: Route) => {
    saveViewport()
    history.pushState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
    setRoute(next)
    setNavigationOpen(false)
  }
  const focusSelection = () => {
    const nativeEdges = new Set(Object.values(active?.layout.data.views ?? {}).flatMap((view: any) => view.edges.filter((edge: any) => edge.relations.some((relation: string) => active?.layout.relationIds[relation] === route.relation)).map((edge: any) => edge.id)))
    const find = (root: Element | ShadowRoot): HTMLElement | null => {
      for (const element of root.querySelectorAll<HTMLElement>('*')) {
        if (element.matches('.react-flow__node') && (element.dataset.id === active?.layout.names[route.node] || active?.layout.references[element.dataset.id ?? ''] === route.node))
          return element
        if (route.relation && element.matches('.react-flow__edge') && nativeEdges.has(element.dataset.id))
          return element
        const nested = element.shadowRoot && find(element.shadowRoot)
        if (nested)
          return nested
      }
      return null
    }
    const target = ((route.node || route.relation) && canvas.current && find(canvas.current)) || documentTrigger.current || canvas.current
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
    const next = { ...route, node, relation }
    history.replaceState(null, '', `/?${new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))}`)
    setRoute(next)
  }
  const openView = (view: string) => navigate({ ...route, mode: view ? 'view' : 'full', view, focus: '', node: '', relation: '', file: '', anchor: '' })
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
      else if (route.node || route.relation) {
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
  const viewId = route.mode === 'focus' && !active?.missingFocus ? active?.layout.focusView : selectedView ?? active?.layout.viewNames['']
  const selectedNode = active?.architecture.nodes.find(node => node.id === route.node)
  const selectedRelation = active?.architecture.relations.find(relation => relation.id === route.relation)
  const viewsForNode = active?.architecture.views.filter(view => view.node === selectedNode?.id) ?? []
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
  const detailOpen = !!selectedNode || !!selectedRelation
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
        {relation.type}
        {' '}
        ·
        {' '}
        {relation.description}
        {!drawnRelations.has(relation.id) && projection?.relations.includes(relation) ? ` · ${t('notDrawn')}` : ''}
      </small>
    </Button>
  )
  const clickDocument = (event: React.MouseEvent<HTMLElement>) => {
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
      mobile={narrow}
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
      onClose={() => setNavigationOpen(false)}
    />
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
                  navigationPane.current?.querySelector<HTMLInputElement>('input')?.focus()
                }}
                onCloseAutoFocus={(event) => {
                  event.preventDefault()
                  if (navigationSelection.current) {
                    navigationSelection.current = false
                    requestAnimationFrame(() => details.current?.focus({ preventScroll: true }))
                  }
                  else {
                    navigationTrigger.current?.focus()
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
                {sidebar}
              </SheetContent>
            </Sheet>
          )
        : sidebar}
      <section className="workbench">
        <header className="view-toolbar">
          <Button
            ref={navigationTrigger}
            className="navigation-toggle"
            aria-expanded={navigationOpen}
            onClick={() => {
              navigationSelection.current = false
              setNavigationOpen(value => !value)
            }}
          >
            {t('navigation')}
          </Button>
          <h1>{contextTitle}</h1>
          {route.mode === 'focus' && !active?.missingFocus && <span className="context-label">{t('directRelationships')}</span>}
          <Button className="refresh" onClick={() => setRefresh(value => value + 1)}>{t('refresh')}</Button>
        </header>
        {currentError && <StatusMessage kind="architecture" stale={!!active} message={currentError} />}
        <div className="workspace">
          <main className="canvas" tabIndex={-1} aria-label={t('architecture')} ref={canvas}>
            {active && !active.architecture.nodes.length
              ? <p className="opening empty-architecture" role="status">{t('emptyArchitecture')}</p>
              : active && route.mode === 'view' && active.architecture.views.find(view => view.id === route.view)?.include.length === 0 && <p className="opening empty-architecture" role="status">{t('emptyView')}</p>}
            {active && (missingView || active.missingFocus || (route.node && !selectedNode) || (route.relation && !selectedRelation)) && (
              <div className="fallback">
                {(missingView || active.missingFocus) && <p role="status">{t(active.missingFocus ? 'removedFocus' : 'removedView')}</p>}
                {route.node && !selectedNode && <p role="status">{t('missingObject')}</p>}
                {route.relation && !selectedRelation && <p role="status">{t('missingRelationship')}</p>}
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
                      fitView={!savedViewport}
                      initialZoom={savedViewport?.zoom}
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
                        if (saved)
                          requestAnimationFrame(() => void flow.setViewport(saved))
                        requestAnimationFrame(() => placeDetails(route.node))
                      }}
                      onNodeClick={(node) => {
                        if (!route.file)
                          select(originalNode(node.id), '', node.id)
                      }}
                      onEdgeClick={(edge) => {
                        if (route.file)
                          return
                        const native = active.layout.data.views[viewId]?.edges.find((candidate: any) => candidate.id === edge.id)
                        const id = native?.relations[0] && active.layout.relationIds[native.relations[0]]
                        if (id)
                          select('', id)
                      }}
                    />
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
                <Tooltip label={t('fitHint')}><Button onClick={() => diagramApi.current?.fitDiagram(0)}>{t('fit')}</Button></Tooltip>
              </div>
            )}
          </main>
          {active && detailOpen && !route.file && (
            <aside ref={details} tabIndex={-1} className={`detail-panel ${cardPosition.left ? 'card-left' : ''} ${cardPosition.bottom ? 'card-bottom' : ''}`} aria-label={t('details')}>
              <div className="detail-heading">
                <span>{t(selectedRelation ? 'relationship' : 'object')}</span>
                <CloseButton
                  label={t('closeDetails')}
                  onClick={() => {
                    select('')
                    requestAnimationFrame(focusSelection)
                  }}
                />
              </div>
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
                      <h3>{t('viewInside')}</h3>
                      <nav aria-label={t('nodeViews')}>
                        {viewsForNode.map(view => (
                          <NavigationItem key={view.id} onClick={() => openView(view.id)}>
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
                  <h2>{selectedRelation.type}</h2>
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
