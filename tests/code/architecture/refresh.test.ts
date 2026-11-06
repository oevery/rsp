import { afterEach, expect, it, vi } from 'vitest'
import { startRefreshing } from '../../../src/viewer/web/refresh.js'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('coalesces poll and reactivation while a request runs, and stops all refresh triggers on cleanup', async () => {
  vi.useFakeTimers()
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const window = new EventTarget()
  vi.stubGlobal('document', page)
  vi.stubGlobal('addEventListener', window.addEventListener.bind(window))
  vi.stubGlobal('removeEventListener', window.removeEventListener.bind(window))
  let complete!: () => void
  const load = vi.fn(() => new Promise<void>((resolve) => {
    complete = resolve
  }))
  const stop = startRefreshing(load)
  expect(load).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(10000)
  window.dispatchEvent(new Event('focus'))
  expect(load).toHaveBeenCalledTimes(1)
  complete()
  await Promise.resolve()
  page.visibilityState = 'hidden'
  page.dispatchEvent(new Event('visibilitychange'))
  expect(load).toHaveBeenCalledTimes(1)
  page.visibilityState = 'visible'
  page.dispatchEvent(new Event('visibilitychange'))
  expect(load).toHaveBeenCalledTimes(2)
  complete()
  await Promise.resolve()
  await vi.advanceTimersByTimeAsync(5000)
  expect(load).toHaveBeenCalledTimes(3)
  stop()
  complete()
  await Promise.resolve()
  window.dispatchEvent(new Event('focus'))
  page.dispatchEvent(new Event('visibilitychange'))
  await vi.advanceTimersByTimeAsync(10000)
  expect(load).toHaveBeenCalledTimes(3)
})
