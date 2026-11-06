import type { RefObject } from 'react'
import type { DocumentPayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { startRefreshing } from '../refresh.js'

interface AssetErrors { workspace: string, file: string, revision: string, messages: { file: string, message: string, stale: boolean }[] }

export function useDocumentAssets(reading: RefObject<HTMLElement | null>, currentDocument: DocumentPayload | null, route: Pick<Route, 'workspace' | 'file'>, narrow: boolean) {
  const [assetErrors, setAssetErrors] = useState<AssetErrors | null>(null)
  const currentRoute = useRef(route)
  currentRoute.current = route
  useEffect(() => {
    const article = reading.current
    if (!article || !currentDocument)
      return
    const controller = new AbortController()
    const images = Array.from(article.querySelectorAll<HTMLImageElement>('img[data-asset]')).map(image => ({ image, revision: '', blob: '' }))
    const isCurrent = () => !controller.signal.aborted && currentRoute.current.workspace === currentDocument.workspace && currentRoute.current.file === currentDocument.file
    const load = async () => {
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
    }
    setAssetErrors(null)
    const stopRefreshing = startRefreshing(load)
    return () => {
      controller.abort()
      stopRefreshing()
      images.forEach(state => state.blob && URL.revokeObjectURL(state.blob))
    }
  }, [currentDocument, narrow])
  return assetErrors?.workspace === currentDocument?.workspace && assetErrors?.file === currentDocument?.file && assetErrors?.revision === currentDocument?.revision ? assetErrors?.messages ?? [] : []
}
