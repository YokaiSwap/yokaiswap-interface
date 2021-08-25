import bigInt, { zero } from 'big-integer'
import { useCallback } from 'react'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { useGodwokenAddress } from './useGodwokenAddress'
import { useFetchable, IFetchableConfig } from './useFetchable'

import { godwokenWeb3Provider } from '../helpers/godwoken/providers'

export function useCKBBalanceL2(ethAddr?: string | null, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()
  const address = useGodwokenAddress(ethAddr)

  const fetchData = useCallback(async () => {
    if (address == null) {
      throw new Error('trying to fetch balance without address')
    }

    const balanceAmount = await godwokenWeb3Provider.getBalance(address)
    return bigInt(balanceAmount.toHexString().slice(2), 16)
  }, [address])

  return useFetchable(zero, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || address == null,
  })
}
