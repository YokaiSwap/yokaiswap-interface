import { useCallback } from 'react'
import { SUDT, Script } from '@lay2/pw-core'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { IFetchableConfig, useFetchable } from './useFetchable'
import { godwoken } from '../helpers/godwoken'
import { generateLayer1SUDTTypeHash, generateLayer2SUDTTypeScript } from '../helpers/godwoken/scripts'

export function useSUDTAccountID(sudt: SUDT, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()

  const fetchData = useCallback(async () => {
    const sudtType = generateLayer2SUDTTypeScript(generateLayer1SUDTTypeHash(sudt))

    const accountId = await godwoken.getAccountIdByScriptHash(
      new Script(sudtType.code_hash, sudtType.args, sudtType.hash_type).toHash()
    )
    return accountId
  }, [sudt])

  return useFetchable(undefined, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: config?.isDisabled ?? !isTabVisible,
  })
}
