type Locks = Pick<LockManager, 'request'>
type Visibility = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>

/**
 * Runs `work` in exactly one visible tab. Hidden tabs give the lock up because browsers throttle
 * their timers, which would slow the whole simulation down.
 */
export function runAsLeader(
  work: () => () => void,
  locks: Locks | undefined,
  page: Visibility,
): () => void {
  if (!locks) return work()

  let release: (() => void) | null = null
  let pending: AbortController | null = null

  const stepDown = () => {
    pending?.abort()
    pending = null
    release?.()
    release = null
  }

  const campaign = () => {
    if (pending || release) return
    const controller = new AbortController()
    pending = controller
    locks
      .request('biocoleta-engine', { signal: controller.signal }, () => {
        pending = null
        const stop = work()
        return new Promise<void>((resolve) => {
          release = () => {
            stop()
            resolve()
          }
        })
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') console.error(error)
      })
  }

  const onVisibility = () => (page.visibilityState === 'visible' ? campaign() : stepDown())
  page.addEventListener('visibilitychange', onVisibility)
  onVisibility()

  return () => {
    page.removeEventListener('visibilitychange', onVisibility)
    stepDown()
  }
}
