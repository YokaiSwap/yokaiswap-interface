import React, { useEffect, useMemo } from 'react'
import { CheckmarkCircleIcon, ErrorIcon, Flex, Text, LinkExternal } from '@yokaiswap/interface-uikit'
import Loader from 'components/Loader'
import { ILayer1TxHistory } from 'hooks/useLayer1TxHistory'
import { getCKBExplorerLink } from 'utils'
import { ChainId } from '@yokaiswap/sdk'
import { useTxStatus } from 'hooks/useTxStatus'
import { useActiveWeb3React } from 'hooks'
import { useRefresh } from 'hooks/useRefresh'
import { useLayer1TxSummary } from 'hooks/useLayer1TxSummary'
import { ILayer1TxStatuses, Layer1TxStatus } from 'contexts/PendingLayer1TxnsContext'

export interface ITransactionProps {
  tx: ILayer1TxHistory
  chainId: ChainId
  txStatuses: ILayer1TxStatuses
  txStatusesStorageKey?: string
}

export default function Transaction({ tx, chainId, txStatuses, txStatusesStorageKey }: ITransactionProps) {
  const { txHash } = tx
  const txStatusCache = txStatuses[txHash]
  const { icon, color } = getRowStatus(txStatusCache)
  const summary = useLayer1TxSummary(tx)
  const { data: txStatus, hasBeenFetched: hasTxStatusBeenFetched } = useTxStatus(txHash, {
    isDisabled: txStatusCache != null,
  })
  const statusText = useMemo(() => {
    if (txStatusCache == null) {
      return hasTxStatusBeenFetched ? ` (${txStatus})` : ''
    }

    return txStatusCache === Layer1TxStatus.dropped ? ' (dropped)' : ''
  }, [hasTxStatusBeenFetched, txStatus, txStatusCache])

  const { account: ethAddress } = useActiveWeb3React()
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

    refresh()
  }, [ethAddress, tx, txStatus, refresh, summary, txStatuses, txHash, txStatusesStorageKey])

  return (
    <Flex key={txHash} alignItems="center" justifyContent="space-between" mb="4px">
      {txStatusCache !== Layer1TxStatus.dropped ? (
        <LinkExternal href={getCKBExplorerLink(chainId, txHash, 'transaction')} color={color}>
          <Text title={txHash}>
            {summary}
            {statusText}
          </Text>
        </LinkExternal>
      ) : (
        <Text title={txHash}>
          {summary}
          {statusText}
        </Text>
      )}
      {icon}
    </Flex>
  )
}

function getRowStatus(status?: Layer1TxStatus) {
  switch (status) {
    case Layer1TxStatus.committed: {
      return { icon: <CheckmarkCircleIcon color="success" />, color: 'success' }
    }
    case Layer1TxStatus.dropped: {
      return { icon: <ErrorIcon color="failure" />, color: 'failure' }
    }
    default: {
      return { icon: <Loader />, color: 'text' }
    }
  }
}
