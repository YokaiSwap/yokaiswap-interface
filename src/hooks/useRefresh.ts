import { useCallback, useState } from 'react'

export function useRefresh() {
  const [, setRefreshFactory] = useState<any>()

  return useCallback(() => {
    setRefreshFactory({})
  }, [])
}
