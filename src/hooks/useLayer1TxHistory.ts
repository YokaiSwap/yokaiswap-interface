import { useActiveWeb3React } from 'hooks'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'

export enum Layer1TxType {
  deposit = 'deposit',
  withdrawal = 'withdrawal',
  transfer = 'transfer',
}

export interface ILayer1TxHistory {
  type: Layer1TxType
  txHash: string
  capacity: string
  amount: string
  symbol: string
  decimals: number
  outPoint?: string
  recipient?: string
}

export function useLayer1TxHistory(storageKey?: string) {
  const { account: ethAddress } = useActiveWeb3React()
  const [txHistory, setTxHistory] = useState<ILayer1TxHistory[]>(() => [])

  useLayoutEffect(() => {
    if (storageKey == null) {
      return
    }

    const rawData = window.localStorage.getItem(storageKey)
    if (rawData == null) {
      setTxHistory([])
      return
    }

    try {
      setTxHistory(JSON.parse(rawData))
    } catch (err) {
      console.warn('[warn] failed to parse layer 1 transaction history', storageKey, err)
    }
  }, [storageKey])

  const addTxnToHistory = useCallback(
    (newTxHistory: ILayer1TxHistory) => {
      if (storageKey == null || ethAddress == null) {
        return
      }

      const latestTxHistoryRaw = window.localStorage.getItem(storageKey) ?? '[]'
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw)
        window.localStorage.setItem(storageKey, JSON.stringify([newTxHistory].concat(latestTxHistory)))
      } catch (err: any) {
        console.warn('[warn] failed to parse layer 1 transaction history', storageKey, err)
      }
    },
    [storageKey, ethAddress]
  )

  return useMemo(
    () => ({
      txHistory,
      setTxHistory,
      addTxnToHistory,
    }),
    [addTxnToHistory, txHistory]
  )
}
