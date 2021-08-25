import { ILayer1TxStatuses, Layer1TxStatus } from 'contexts/PendingLayer1TxnsContext'
import { useActiveWeb3React } from 'hooks'
import { ILayer1TxHistory } from 'hooks/useLayer1TxHistory'
import { useLayer1TxSummary } from 'hooks/useLayer1TxSummary'
import { useRefresh } from 'hooks/useRefresh'
import { useTxStatus } from 'hooks/useTxStatus'
import { useEffect } from 'react'
import { useAddPopup } from 'state/application/hooks'

export interface ICheckPendingLayer1TxProps {
  tx: ILayer1TxHistory
  txStatusesStorageKey?: string
  txStatuses: ILayer1TxStatuses
}

export function CheckPendingLayer1Tx({ tx, txStatuses, txStatusesStorageKey }: ICheckPendingLayer1TxProps) {
  const { account: ethAddress } = useActiveWeb3React()
  const { txHash } = tx

  const { data: txStatus } = useTxStatus(txHash, {
    isDisabled: txStatuses[txHash] != null,
  })
  const summary = useLayer1TxSummary(tx)

  const addPopup = useAddPopup()
  const refresh = useRefresh()

  useEffect(() => {
    if (ethAddress == null || txStatuses[txHash] != null || txStatusesStorageKey == null) {
      return
    }

    if (txStatus !== 'committed' && txStatus !== 'dropped') {
      return
    }

    txStatuses[txHash] = txStatus as Layer1TxStatus

    window.localStorage.setItem(txStatusesStorageKey, JSON.stringify(txStatuses))

    addPopup(
      {
        layer1Tx: {
          hash: tx.txHash,
          success: txStatus === 'committed',
          summary,
        },
      },
      tx.txHash
    )

    refresh()
  }, [ethAddress, tx, txStatus, refresh, summary, txStatuses, txHash, txStatusesStorageKey, addPopup])

  return null
}
