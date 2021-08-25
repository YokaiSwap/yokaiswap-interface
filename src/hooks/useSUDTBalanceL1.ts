import bigInt, { zero } from 'big-integer'
import { useCallback } from 'react'
import { SUDT } from '@lay2/pw-core'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { usePWAddress } from './usePWAddress'
import { useFetchable, IFetchableConfig } from './useFetchable'

import { ckbCollector } from '../helpers/ckb'

export function useSUDTBalanceL1(sudt: SUDT, ethAddr?: string | null, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()
  const address = usePWAddress(ethAddr)

  const fetchData = useCallback(async () => {
    if (address == null) {
      throw new Error('trying to fetch balance without address')
    }

    const balanceAmount = await ckbCollector.getSUDTBalance(sudt, address)

    return bigInt(balanceAmount.toHexString().slice(2), 16)
  }, [sudt, address])

  return useFetchable(zero, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    refreshInterval: config?.refreshInterval ?? 10000,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || address == null,
  })
}
