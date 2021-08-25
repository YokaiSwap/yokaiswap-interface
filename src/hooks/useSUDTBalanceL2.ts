import bigInt, { zero, BigInteger } from 'big-integer'
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { SUDT } from '@lay2/pw-core'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { useSUDTAccountID } from './useSUDTAccountID'
import { useRefresh } from './useRefresh'
import { useGodwokenAddress } from './useGodwokenAddress'
import { useFetchable, IFetchableConfig, IFetchableResult } from './useFetchable'

import { godwoken } from '../helpers/godwoken'

export function useSUDTBalanceL2(
  sudt: SUDT,
  ethAddr?: string | null,
  config?: IFetchableConfig
): IFetchableResult<BigInteger> {
  const isTabVisible = useIsTabVisible()

  const sudtAccountIdRef = useRef<number>()
  const { data: sudtAccountId, isFetching: isFetchingSUDTAccountID } = useSUDTAccountID(sudt, {
    refreshFactor: config?.refreshFactor,
    isDisabled: sudtAccountIdRef.current != null,
  })
  const refresh = useRefresh()
  useLayoutEffect(() => {
    sudtAccountIdRef.current = sudtAccountId
    if (sudtAccountId != null) {
      refresh()
    }
  }, [sudtAccountId, refresh])

  const address = useGodwokenAddress(ethAddr)

  const fetchData = useCallback(async () => {
    if (sudtAccountId == null) {
      return zero
    }

    if (address == null) {
      throw new Error('trying to fetch balance without address')
    }

    const balanceAmount = await godwoken.getBalance(sudtAccountId, address)
    return bigInt(balanceAmount.toString())
  }, [address, sudtAccountId])

  const result = useFetchable(zero, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || address == null,
  })

  return useMemo(
    () => ({
      ...result,
      isFetching: result.isFetching || isFetchingSUDTAccountID,
    }),
    [result, isFetchingSUDTAccountID]
  )
}
