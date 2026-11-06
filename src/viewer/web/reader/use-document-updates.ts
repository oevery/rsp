import type { DocumentPayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { startRefreshing } from '../refresh.js'

interface DocumentError { workspace: string, file: string, message: string }

export function useDocumentUpdates(route: Pick<Route, 'workspace' | 'file'>, revision: string | undefined, refresh: number, receiveDocument: (document: DocumentPayload) => void) {
  const [documentError, setDocumentError] = useState<DocumentError | null>(null)
  const documentGeneration = useRef(0)
  const currentRoute = useRef(route)
  currentRoute.current = route
  const receive = useRef(receiveDocument)
  receive.current = receiveDocument
  useEffect(() => {
    const current = ++documentGeneration.current
    if (!route.file || !revision) {
      setDocumentError(null)
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const next: DocumentPayload = await (await api(`/api/workspaces/${route.workspace}/document?${new URLSearchParams({ file: route.file })}`, controller.signal)).json()
        if (current === documentGeneration.current && next.workspace === route.workspace && next.file === route.file && currentRoute.current.workspace === route.workspace && currentRoute.current.file === route.file) {
          receive.current(next)
          setDocumentError(null)
        }
      }
      catch (error) {
        if (!controller.signal.aborted && current === documentGeneration.current && currentRoute.current.workspace === route.workspace && currentRoute.current.file === route.file)
          setDocumentError({ workspace: route.workspace, file: route.file, message: (error as Error).message })
      }
    }
    const stopRefreshing = startRefreshing(load)
    return () => {
      controller.abort()
      stopRefreshing()
    }
  }, [route.workspace, route.file, revision, refresh])
  return documentError?.workspace === route.workspace && documentError.file === route.file ? documentError.message : ''
}
