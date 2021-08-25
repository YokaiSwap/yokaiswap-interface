import { useEffect, useRef, useState } from 'react'

export const useThrottleFn = <T, U extends any[]>(fn: (...args: U) => T, ms = 200, args: U) => {
  const [state, setState] = useState<T | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const nextArgs = useRef<U>()

  useEffect(() => {
    if (!timeout.current) {
      setState(fn(...args))
      const timeoutCallback = () => {
        if (nextArgs.current) {
          setState(fn(...nextArgs.current))
          nextArgs.current = undefined
          timeout.current = setTimeout(timeoutCallback, ms)
        } else {
          timeout.current = undefined
        }
      }
      timeout.current = setTimeout(timeoutCallback, ms)
    } else {
      nextArgs.current = args
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)

  useEffect(() => {
    return () => {
      const currentTimeout = timeout.current
      if (currentTimeout != null) {
        clearTimeout(currentTimeout)
      }
    }
  }, [])

  return state
}
