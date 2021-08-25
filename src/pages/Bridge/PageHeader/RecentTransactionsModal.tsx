import React, { useMemo } from 'react'
import { Flex, Text, Modal, Button } from '@yokaiswap/interface-uikit'
import { useActiveWeb3React } from 'hooks'
import { ILayer1TxHistory } from 'hooks/useLayer1TxHistory'
import styled from 'styled-components'
import { ILayer1TxStatuses } from 'contexts/PendingLayer1TxnsContext'
import Transaction from './Transaction'

const TransactionWrapper = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: 24px;
`

type RecentTransactionsModalProps = {
  onDismiss?: () => void
  txHistory: ILayer1TxHistory[]
  txStatuses: ILayer1TxStatuses
  txStatusesStorageKey?: string
}

// TODO: Fix UI Kit typings
const defaultOnDismiss = () => null

function RecentTransactionsModal({
  onDismiss = defaultOnDismiss,
  txHistory,
  txStatuses,
  txStatusesStorageKey,
}: RecentTransactionsModalProps) {
  const { account, chainId } = useActiveWeb3React()
  const isConnected = useMemo(() => account != null, [account])

  return (
    <Modal title="Recent transactions" onDismiss={onDismiss} bodyPadding="0">
      {!isConnected && (
        <Flex justifyContent="center" flexDirection="column" alignItems="center">
          <Text mb="8px" bold>
            Please connect your wallet to view your recent transactions
          </Text>
          <Button variant="tertiary" scale="sm" onClick={onDismiss}>
            Close
          </Button>
        </Flex>
      )}
      {isConnected && txHistory.length === 0 && (
        <Flex justifyContent="center" flexDirection="column" alignItems="center">
          <Text mt="16px" mb="16px" bold>
            No recent transactions
          </Text>
        </Flex>
      )}
      {isConnected && chainId != null && txHistory.length > 0 && (
        <TransactionWrapper>
          {txHistory.map((tx) => (
            <Transaction
              key={tx.txHash}
              tx={tx}
              chainId={chainId}
              txStatuses={txStatuses}
              txStatusesStorageKey={txStatusesStorageKey}
            />
          ))}
        </TransactionWrapper>
      )}
    </Modal>
  )
}

export default RecentTransactionsModal
