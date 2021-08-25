import { PendingLayer1TxnsContext } from 'contexts/PendingLayer1TxnsContext'
import React, { useContext } from 'react'
import { CheckPendingLayer1Tx } from './CheckPendingLayer1Tx'

export function CheckPendingLayer1Txns() {
  const { pendingTxns, txStatuses, txStatusesStorageKey } = useContext(PendingLayer1TxnsContext)

  return (
    <>
      {pendingTxns.map((tx) => (
        <CheckPendingLayer1Tx
          key={tx.txHash}
          tx={tx}
          txStatuses={txStatuses}
          txStatusesStorageKey={txStatusesStorageKey}
        />
      ))}
    </>
  )
}
