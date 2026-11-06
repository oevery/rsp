import type { ReactLikeC4 } from '@likec4/diagram'
import type { ComponentProps } from 'react'
import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'

export type DiagramInstances = Parameters<NonNullable<ComponentProps<typeof ReactLikeC4>['onInitialized']>>[0]
export type DiagramViewId = ComponentProps<typeof ReactLikeC4>['viewId']
type Layout = ArchitecturePayload['layout']

function* diagramElements(root: Element | ShadowRoot): Generator<HTMLElement> {
  for (const element of root.querySelectorAll<HTMLElement>('*')) {
    yield element
    if (element.shadowRoot)
      yield* diagramElements(element.shadowRoot)
  }
}

function findElement(canvas: HTMLElement | null, selector: string, attribute?: string, id?: string) {
  return canvas && Array.from(diagramElements(canvas)).find(element => element.matches(selector) && (!attribute || element.getAttribute(attribute) === id))
}

export function hasRelationshipOverlay(canvas: HTMLElement | null) {
  return !!findElement(canvas, '.relationships-browser')
}

export function canonicalNode(layout: Layout, name: string) {
  return layout.references[name] ?? Object.keys(layout.names).find(id => layout.names[id] === name) ?? ''
}

export function nodeAliases(layout: Layout | undefined, id: string, displayName?: string) {
  return [displayName, layout?.names[id], ...Object.entries(layout?.references ?? {}).filter(([, original]) => original === id).map(([name]) => name)]
}

export function stepEdge(layout: Layout | undefined, viewId: string | undefined, stepId: string) {
  return Object.entries(layout?.stepIds[viewId ?? ''] ?? {}).find(([, step]) => step === stepId)?.[0] as Parameters<DiagramInstances['diagram']['highlightEdge']>[0] | undefined
}

export function selectionElement(canvas: HTMLElement | null, layout: Layout | undefined, route: Route) {
  if (!canvas || (!route.node && !route.relation && !route.step))
    return null
  const nativeEdges = new Set<string>(Object.values(layout?.data.views ?? {}).flatMap(view => view.edges.filter(edge => edge.relations.some(relation => layout?.relationIds[relation] === route.relation)).map(edge => edge.id)))
  if (route.step) {
    const edge = stepEdge(layout, layout?.viewNames[route.view], route.step)
    if (edge)
      nativeEdges.add(edge)
  }
  for (const element of diagramElements(canvas)) {
    if (element.matches('.react-flow__node') && (element.dataset.id === layout?.names[route.node] || layout?.references[element.dataset.id ?? ''] === route.node))
      return element
    if ((route.relation || route.step) && element.matches('.react-flow__edge') && nativeEdges.has(element.dataset.id ?? ''))
      return element
  }
  return null
}

export function graphBoxes(canvas: HTMLElement | null) {
  return canvas
    ? Array.from(diagramElements(canvas)).filter(element => element.matches('.react-flow__node, .react-flow__edge .likec4-edge__path, .likec4-edge-label')).map(element => element.getBoundingClientRect()).filter(box => box.width || box.height)
    : []
}

export function nodeBox(canvas: HTMLElement | null, id: string | undefined) {
  return findElement(canvas, '.react-flow__node', 'data-id', id)?.getBoundingClientRect()
}

export function edgeGeometry(canvas: HTMLElement | null, id: string | undefined) {
  const element = findElement(canvas, '.react-flow__edge', 'data-id', id)
  return element
    ? {
        edge: (element.querySelector('.likec4-edge__path') ?? element).getBoundingClientRect(),
        label: findElement(canvas, '.likec4-edge-label', 'data-edge-id', id)?.getBoundingClientRect(),
      }
    : null
}

export function documentBinding(event: MouseEvent, workspace: string, architecture: ArchitecturePayload['architecture'] | undefined) {
  // Native details use shadow roots and target=_blank. Resolve before default navigation.
  const link = event.composedPath().find((target): target is HTMLAnchorElement => target instanceof HTMLAnchorElement)
  if (!link)
    return null
  const url = new URL(link.href)
  const file = url.searchParams.get('file')
  if (url.origin !== location.origin || url.pathname !== '/' || url.searchParams.get('workspace') !== workspace || !file)
    return null
  const headings = url.searchParams.get('headings')
  const binding = architecture?.nodes.flatMap(node => node.bindings).find(binding => binding.file === file && JSON.stringify(binding.headings) === (headings ?? undefined))
  return { file, anchor: binding?.anchor ?? '' }
}
