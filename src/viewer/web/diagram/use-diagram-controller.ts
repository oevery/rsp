import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import type { DiagramInstances } from './likec4-adapter.js'
import type { DiagramSelection } from './selection.js'
import { useEffect, useRef, useState } from 'react'
import { documentBinding, edgeGeometry, graphBoxes, hasRelationshipOverlay, nodeAliases, nodeBox, selectionElement, stepEdge } from './likec4-adapter.js'

export function useDiagramController(active: ArchitecturePayload | null, route: Route, selection: DiagramSelection) {
  const { contextKey, viewId, scenario, nativeView } = selection
  const canvas = useRef<HTMLElement>(null)
  const details = useRef<HTMLElement>(null)
  const documentTrigger = useRef<HTMLElement | null>(null)
  const diagramApi = useRef<DiagramInstances['diagram'] | null>(null)
  const xyflow = useRef<DiagramInstances['xyflow'] | null>(null)
  const [cardPosition, setCardPosition] = useState({ left: false, bottom: false })
  const viewports = useRef(new Map<string, { x: number, y: number, zoom: number }>())
  const currentRoute = useRef(route)
  currentRoute.current = route
  const saveViewport = () => {
    if (contextKey && xyflow.current && route.mode !== 'guide')
      viewports.current.set(contextKey, xyflow.current.getViewport())
  }
  const focusSelection = () => {
    const target = selectionElement(canvas.current, active?.layout, route) || documentTrigger.current || canvas.current
    if (target?.isConnected)
      target.focus({ preventScroll: true })
    else details.current?.focus({ preventScroll: true })
  }
  const placeDetails = (id: string, displayName?: string) => {
    const flow = xyflow.current
    const bounds = canvas.current?.getBoundingClientRect()
    const aliases = nodeAliases(active?.layout, id, displayName)
    const node = aliases.map(name => name && flow?.getNode(name)).find(Boolean)
    if (!flow || !bounds || !node) {
      setCardPosition({ left: false, bottom: false })
      return
    }
    let position = { ...node.position }
    let parent = node.parentId
    while (parent) {
      const container = flow.getNode(parent)!
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
    const boxes = graphBoxes(canvas.current)
    if (!boxes.length)
      return
    const start = flow.screenToFlowPosition({ x: Math.min(...boxes.map(box => box.left)), y: Math.min(...boxes.map(box => box.top)) })
    const end = flow.screenToFlowPosition({ x: Math.max(...boxes.map(box => box.right)), y: Math.max(...boxes.map(box => box.bottom)) })
    fitGraphBounds({ x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y })
  }
  const revealStep = (id: string, preserveZoom = false) => {
    const edgeId = stepEdge(active?.layout, viewId, id)
    const flow = xyflow.current
    const area = canvas.current
    const geometry = edgeGeometry(canvas.current, edgeId)
    if (!edgeId || !geometry || !flow || !area)
      return
    // Sequence rendering has different geometry from its underlying graph layout.
    const { edge, label } = geometry
    if (preserveZoom) {
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
      const box = nodeBox(canvas.current, id)
      if (box) {
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
    const edge = stepEdge(active?.layout, viewId, id)
    if (edge) {
      diagramApi.current?.select({ edges: [edge] })
      diagramApi.current?.highlightEdge(edge)
    }
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
  const initialize = ({ diagram, xyflow: flow }: DiagramInstances) => {
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
  }
  return {
    canvas,
    details,
    cardPosition,
    savedViewport: viewports.current.get(contextKey),
    saveViewport,
    focusSelection,
    fitOverview,
    initialize,
    zoomIn: () => void xyflow.current?.zoomIn(),
    zoomOut: () => void xyflow.current?.zoomOut(),
    canvasWidth: () => canvas.current?.clientWidth ?? innerWidth,
    hasOverlay: () => hasRelationshipOverlay(canvas.current),
    select: (node: string, displayName?: string) => {
      placeDetails(node, displayName)
      diagramApi.current?.unhighlightAll()
      diagramApi.current?.select()
    },
    selectStep: (id: string) => {
      highlightStep(id)
      setCardPosition({ left: false, bottom: true })
      requestAnimationFrame(() => revealStep(id))
    },
    openDocument: () => {
      documentTrigger.current = globalThis.document.activeElement as HTMLElement
      diagramApi.current?.overlays().send({ type: 'close.all' })
    },
  }
}
export type DiagramController = ReturnType<typeof useDiagramController>

export function useDiagramDocumentLinks(workspace: string, active: ArchitecturePayload | null, openDocument: (file: string, anchor: string) => void) {
  useEffect(() => {
    const openBinding = (event: MouseEvent) => {
      const binding = documentBinding(event, workspace, active?.architecture)
      if (!binding)
        return
      event.preventDefault()
      event.stopPropagation()
      openDocument(binding.file, binding.anchor)
    }
    document.addEventListener('click', openBinding, true)
    return () => document.removeEventListener('click', openBinding, true)
  }, [workspace, active, openDocument])
}
