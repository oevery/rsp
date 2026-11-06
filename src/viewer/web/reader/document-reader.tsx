import type { DocumentPayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../i18n.js'
import { StatusMessage } from '../status-message.js'
import { Button, Sheet, SheetContent, SheetTitle, Tooltip } from '../ui/primitives.js'
import { renderDiagrams } from './document-diagrams.js'
import { useDocumentAssets } from './use-document-assets.js'
import { useDocumentUpdates } from './use-document-updates.js'
import { useReadingPosition } from './use-reading-position.js'

interface Props {
  route: Pick<Route, 'workspace' | 'file' | 'anchor'>
  root?: string
  revision?: string
  refresh: number
  narrow: boolean
  canvasWidth: () => number
  navigate: (file: string, anchor: string) => void
  closeDocument: () => void
  focusSelection: () => void
}

export function DocumentReader({ route, root, revision, refresh, narrow, canvasWidth, navigate, closeDocument, focusSelection }: Props) {
  const { t } = useLocale()
  const documentPane = useRef<HTMLElement>(null)
  const [documentWidth, setDocumentWidth] = useState(580)
  const [documentExpanded, setDocumentExpanded] = useState(false)
  const [document, setDocument] = useState<DocumentPayload | null>(null)
  const currentDocument = document?.workspace === route.workspace && document.file === route.file ? document : null
  const position = useReadingPosition(route, currentDocument, narrow)
  const currentDocumentError = useDocumentUpdates(route, revision, refresh, (next) => {
    const sameDocument = document?.workspace === next.workspace && document.file === next.file
    if (sameDocument && document.revision === next.revision)
      return
    if (sameDocument)
      position.capture()
    setDocument(next)
  })
  const bindReading = (element: HTMLElement | null) => {
    // Translate renderer-owned annotations without replacing content or image blobs.
    element?.querySelectorAll<HTMLElement>('[data-rsp-reading-status]').forEach((status) => {
      const key = status.dataset.rspReadingStatus
      if (key === 'unavailableLink' || key === 'unsupportedImage' || key === 'copySource' || key === 'diagramSource' || key === 'diagramError')
        status.textContent = t(key)
    })
    position.bindReading(element)
    if (element)
      renderDiagrams(element, t)
  }
  const currentAssetErrors = useDocumentAssets(position.reading, currentDocument, route, narrow)
  useEffect(() => {
    if (route.file && !narrow)
      documentPane.current?.focus({ preventScroll: true })
  }, [!!route.file, narrow])
  const resizeDocument = (event: React.PointerEvent<HTMLElement>) => {
    const initial = event.currentTarget.parentElement!.getBoundingClientRect().width
    const start = event.clientX
    const resize = (move: PointerEvent) => setDocumentWidth(Math.min(canvasWidth(), Math.max(340, initial + start - move.clientX)))
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
  const clickDocument = (event: React.MouseEvent<HTMLElement>) => {
    const source = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-source-locator]')
    if (source && position.reading.current?.contains(source)) {
      const locator = source.dataset.sourceLocator!
      void navigator.clipboard.writeText(`${root}/${locator}`).then(() => {
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
    if (!link || !position.reading.current?.contains(link))
      return
    const url = new URL(link.href)
    if (url.origin !== location.origin)
      return
    event.preventDefault()
    if (url.hash) {
      navigate(route.file, decodeURIComponent(url.hash.slice(1)))
      return
    }
    navigate(url.searchParams.get('file') ?? route.file, url.searchParams.get('anchor') ?? '')
  }
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
            setDocumentWidth(width => Math.min(canvasWidth(), Math.max(340, width + (event.key === 'ArrowLeft' ? 40 : -40))))
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
                <nav aria-label={t('tableOfContents')}>{currentDocument.headings.map(heading => <Button key={heading.anchor} style={{ paddingLeft: `${(heading.depth - 1) * 8 + 8}px` }} onClick={() => navigate(route.file, heading.anchor)}>{heading.title}</Button>)}</nav>
              </details>
              <article ref={bindReading} onScroll={position.onScroll} onClick={clickDocument} dangerouslySetInnerHTML={{ __html: currentDocument.html }} />
            </div>
          )
        : <p className="opening" role="status">{t('openingDocument')}</p>}
    </section>
  )
  return route.file && (narrow
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
    : reader)
}
