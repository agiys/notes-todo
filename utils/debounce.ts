export interface Debounced<T extends (...args: any[]) => void> {
  (...args: Parameters<T>): void
  flush: () => void
  cancel: () => void
  isPending: () => boolean
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): Debounced<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const run = () => {
    if (!lastArgs) return
    const args = lastArgs
    lastArgs = null
    fn(...args)
  }

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      run()
    }, delay)
  }) as Debounced<T>

  debounced.flush = () => {
    if (timer) clearTimeout(timer)
    timer = null
    run()
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  debounced.isPending = () => lastArgs !== null

  return debounced
}
