import type { Route } from './navigation.js'
import { useEffect, useRef, useState } from 'react'
import { parseRoute, routeUrl, viewRoute, workspaceRoute } from './navigation.js'

export function useViewerRoute(beforeNavigate: () => void, afterNavigate: () => void) {
  const [route, setRoute] = useState(() => parseRoute(location.search))
  const before = useRef(beforeNavigate)
  before.current = beforeNavigate
  useEffect(() => {
    const sync = () => {
      before.current()
      setRoute(parseRoute(location.search))
    }
    addEventListener('popstate', sync)
    return () => removeEventListener('popstate', sync)
  }, [])
  const navigate = (next: Route) => {
    before.current()
    history.pushState(null, '', routeUrl(next))
    setRoute(next)
    afterNavigate()
  }
  const replace = (next: Route) => {
    history.replaceState(null, '', routeUrl(next))
    setRoute(next)
  }
  return {
    route,
    navigate,
    replace,
    openView: (view: string) => navigate(viewRoute(route, view)),
    switchWorkspace: (workspace: string) => navigate(workspaceRoute(workspace)),
    select: (node: string, relation = '') => replace({ ...route, node, relation, step: '' }),
    selectStep: (step: string) => replace({ ...route, node: '', relation: '', step }),
    openDocument: (file: string, anchor: string) => navigate({ ...route, file, anchor }),
    closeDocument: () => navigate({ ...route, file: '', anchor: '' }),
    focusNode: (node: string) => navigate({ ...route, mode: 'focus', focus: node, view: '', node, relation: '', file: '', anchor: '' }),
    setVariant: (variant: string) => navigate({ ...route, variant }),
  }
}
