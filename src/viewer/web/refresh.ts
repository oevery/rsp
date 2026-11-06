/** Schedule refreshes without overlapping requests; callers own data and cancellation. */
export function startRefreshing(load: () => Promise<void>, interval = 5000) {
  let running = false
  let stopped = false
  const refresh = async () => {
    if (running || stopped)
      return
    running = true
    try {
      await load()
    }
    finally {
      running = false
    }
  }
  const reactivate = () => {
    if (document.visibilityState === 'visible')
      void refresh()
  }
  void refresh()
  const timer = setInterval(refresh, interval)
  document.addEventListener('visibilitychange', reactivate)
  addEventListener('focus', reactivate)
  return () => {
    stopped = true
    clearInterval(timer)
    document.removeEventListener('visibilitychange', reactivate)
    removeEventListener('focus', reactivate)
  }
}
