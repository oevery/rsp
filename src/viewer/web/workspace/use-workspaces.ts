import type { WorkspaceSummary } from '../../workspaces.js'
import { useEffect, useState } from 'react'
import { api } from '../api.js'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
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
  return workspaces
}
