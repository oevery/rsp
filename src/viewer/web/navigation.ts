export interface Route {
  workspace: string
  mode: string
  view: string
  focus: string
  node: string
  relation: string
  file: string
  anchor: string
  step?: string
  variant?: string
}

export function parseRoute(search: string): Route {
  const query = new URLSearchParams(search)
  return { workspace: query.get('workspace') ?? '', mode: query.get('mode') ?? (query.has('focus') ? 'focus' : query.has('view') && query.get('view') ? 'view' : ''), view: query.get('view') ?? '', focus: query.get('focus') ?? '', node: query.get('node') ?? '', relation: query.get('relation') ?? '', file: query.get('file') ?? '', anchor: query.get('anchor') ?? '', step: query.get('step') ?? '', variant: query.get('variant') ?? '' }
}

export function routeUrl(route: Route) {
  return `/?${new URLSearchParams(Object.fromEntries(Object.entries(route).filter(([, value]) => value)))}`
}

export function viewRoute(route: Route, view: string): Route {
  return { ...route, mode: view ? 'view' : 'full', view, focus: '', node: '', relation: '', file: '', anchor: '', step: '', variant: '' }
}

export function workspaceRoute(workspace: string): Route {
  return { workspace, mode: '', view: '', focus: '', node: '', relation: '', file: '', anchor: '' }
}
