import type { ArchitecturePayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { startRefreshing } from '../refresh.js'

interface WorkspaceError { workspace: string, message: string }

export function useArchitecture(route: Route) {
  const [payload, setPayload] = useState<ArchitecturePayload | null>(null)
  const [error, setError] = useState<WorkspaceError | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const generation = useRef(0)
  const currentRoute = useRef(route)
  currentRoute.current = route
  useEffect(() => {
    const current = ++generation.current
    const controller = new AbortController()
    const load = async () => {
      try {
        const focus = route.mode === 'focus' ? route.focus : ''
        const next: ArchitecturePayload = await (await api(`/api/workspaces/${route.workspace}/model${focus ? `?${new URLSearchParams({ focus })}` : ''}`, controller.signal)).json()
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
        if (current === generation.current)
          setRefreshing(false)
      }
    }
    const heartbeat = () => void api(`/api/workspaces/${route.workspace}/heartbeat`, controller.signal).catch(() => {})
    const stopRefreshing = startRefreshing(load)
    heartbeat()
    const beat = setInterval(heartbeat, 20_000)
    return () => {
      controller.abort()
      stopRefreshing()
      clearInterval(beat)
    }
  }, [route.workspace, route.mode === 'focus' ? route.focus : '', refresh])
  const active = payload?.workspace === route.workspace && (payload.focus ?? '') === (route.mode === 'focus' ? route.focus : '') ? payload : null
  return {
    active,
    error: error?.workspace === route.workspace ? error.message : '',
    refresh,
    refreshing,
    reload: () => {
      setRefreshing(true)
      setRefresh(value => value + 1)
    },
  }
}
