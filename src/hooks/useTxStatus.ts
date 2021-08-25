import { useCallback } from 'react'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { IFetchableConfig, useFetchable } from './useFetchable'

import { ckbRPC } from '../helpers/ckb'

export type TxStatus = 'pending' | 'proposed' | 'committed' | 'dropped'

export function useTxStatus(txHash?: string | null, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()

  const fetchData = useCallback(async () => {
    if (txHash == null) {
      throw new Error('trying to fetch tx without tx hash')
    }

    const tx = await ckbRPC.get_transaction(txHash)
    const status = tx?.tx_status?.status ?? 'dropped'

    return status as TxStatus
  }, [txHash])

  return useFetchable('pending', fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    refreshInterval: config?.refreshInterval ?? 5000,
    shouldRetry: config?.shouldRetry ?? true,
    retryInterval: config?.retryInterval ?? 1000,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || txHash == null,
  })
}
