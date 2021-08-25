import React, { createContext, PropsWithChildren, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { ILayer1TxHistory } from 'hooks/useLayer1TxHistory'
import { useActiveWeb3React } from 'hooks'

export enum Layer1TxStatus {
  committed = 'committed',
  dropped = 'dropped',
}

export interface ILayer1TxStatuses {
  [txHash: string]: Layer1TxStatus | undefined
}

export interface IPendingLayer1TxnsContext {
  pendingTxns: ILayer1TxHistory[]
  addPendingTxn: (newTxn: ILayer1TxHistory) => void
  txStatuses: ILayer1TxStatuses
  txStatusesStorageKey?: string
}

const emptyArray = []
const emptyStatuses: ILayer1TxStatuses = {}

export const PendingLayer1TxnsContext = createContext<IPendingLayer1TxnsContext>({
  pendingTxns: emptyArray,
  addPendingTxn: () => void 0,
  txStatuses: emptyStatuses,
})

export function PendingLayer1TxnsProvider({ children }: PropsWithChildren<unknown>) {
  const { account: ethAddress, chainId } = useActiveWeb3React()
  const [pendingTxns, setPendingTxns] = useState<ILayer1TxHistory[]>(() => emptyArray)
  const [txStatusesStorageKey, setTxStatusesStorageKey] = useState<string | undefined>('')
  const [txStatuses, setTxStatuses] = useState(emptyStatuses)
  useLayoutEffect(() => {
    setPendingTxns(emptyArray)
    if (chainId == null || ethAddress == null) {
      setTxStatusesStorageKey(undefined)
      setTxStatuses(emptyStatuses)
      return
    }

    const nextTxStatusesStorageKey = `@${chainId}@${ethAddress}/layer1-tx-statuses`
    setTxStatusesStorageKey(nextTxStatusesStorageKey)
    const txStatusesInStorage = window.localStorage.getItem(nextTxStatusesStorageKey)
    if (txStatusesInStorage == null) {
      setTxStatuses(emptyStatuses)
      return
    }

    try {
      setTxStatuses(JSON.parse(txStatusesInStorage) as ILayer1TxStatuses)
    } catch (err: any) {
      console.warn('[warn] failed to parse layer 1 transaction statuses', nextTxStatusesStorageKey, err)
      setTxStatuses(emptyStatuses)
    }
  }, [chainId, ethAddress])

  const addPendingTxn = useCallback((newTxn: ILayer1TxHistory) => {
    setPendingTxns((txns) => txns.concat(newTxn))
  }, [])

  return (
    <PendingLayer1TxnsContext.Provider
      value={useMemo(
        () => ({
          pendingTxns,
          addPendingTxn,
          txStatuses,
          txStatusesStorageKey,
        }),
        [addPendingTxn, pendingTxns, txStatuses, txStatusesStorageKey]
      )}
    >
      {children}
    </PendingLayer1TxnsContext.Provider>
  )
}
