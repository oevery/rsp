import type { DocumentPayload } from '../../protocol.js'
import type { Route } from '../navigation.js'
import { useEffect, useRef } from 'react'

export function useReadingPosition(route: Pick<Route, 'workspace' | 'file' | 'anchor'>, currentDocument: DocumentPayload | null, narrow: boolean) {
  const reading = useRef<HTMLElement>(null)
  const currentRoute = useRef(route)
  currentRoute.current = route
  const readingPosition = useRef<{ workspace: string, file: string, anchor?: string, offset: number, scrollTop: number } | null>(null)
  const lastReadingPosition = useRef<typeof readingPosition.current>(null)
  const captureReadingPosition = () => {
    const article = reading.current
    if (!article)
      return null
    // A queued scroll can arrive after breakpoint CSS reflows the old reader,
    // before React remounts it. Its geometry no longer describes the saved layout.
    if (matchMedia('(max-width: 760px)').matches !== narrow)
      return lastReadingPosition.current
    const top = article.getBoundingClientRect().top
    const heading = Array.from(article.querySelectorAll<HTMLElement>('[id]')).filter(element => element.getBoundingClientRect().top <= top + 40).at(-1)
    return { workspace: currentRoute.current.workspace, file: currentRoute.current.file, anchor: heading?.id, offset: heading ? top - heading.getBoundingClientRect().top : 0, scrollTop: article.scrollTop }
  }
  const bindReading = (element: HTMLElement | null) => {
    reading.current = element
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
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)')
    const preserve = () => {
      readingPosition.current = lastReadingPosition.current
    }
    media.addEventListener('change', preserve)
    return () => media.removeEventListener('change', preserve)
  }, [])
  useEffect(() => {
    if (!reading.current || !currentDocument)
      return
    if (route.anchor)
      Array.from(reading.current.querySelectorAll('[id]')).find(element => element.id === route.anchor)?.scrollIntoView()
    else reading.current.scrollTop = 0
  }, [route.workspace, route.file, route.anchor, !!currentDocument])
  return {
    reading,
    bindReading,
    capture: () => { readingPosition.current = captureReadingPosition() },
    onScroll: () => { lastReadingPosition.current = captureReadingPosition() },
  }
}
