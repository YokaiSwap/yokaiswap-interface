import { useIsTabVisible } from 'contexts/TabVisibilityContext'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

export function useIntervalRefreshFactor(interval = 10_000) {
  const [refreshFactor, setRefreshFactor] = useState(0)
  const isTabVisible = useIsTabVisible()
  const isTabVisibleRef = useRef(true)
  useLayoutEffect(() => {
    isTabVisibleRef.current = isTabVisible
  }, [isTabVisible])

  useEffect(() => {
    let timeoutID: number | undefined
    const loop = () => {
      if (isTabVisibleRef.current) {
        setRefreshFactor((value) => (value === 999 ? 1 : value + 1))
      }
      timeoutID = window.setTimeout(loop, interval)
    }
    timeoutID = window.setTimeout(loop, interval)

    return () => {
      window.clearTimeout(timeoutID)
    }
  }, [interval])

  const forceRefresh = useCallback(() => {
    setRefreshFactor((value) => (value === 999 ? 1 : value + 1))
  }, [])

  return useMemo(
    () => ({
      refreshFactor,
      forceRefresh,
    }),
    [forceRefresh, refreshFactor]
  )
}
