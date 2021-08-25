import React, { useContext, useEffect, useMemo } from 'react'
import { ThemeContext } from 'styled-components'
import { Link } from 'react-router-dom'
import { Button, CardBody, Text } from '@yokaiswap/interface-uikit'
import { AutoColumn } from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { useLayer1TxHistory } from 'hooks/useLayer1TxHistory'
import { Dots } from 'components/swap/styleds'
import { BridgeBodyWrapper } from 'components/Shared'
import { Layer1TxStatus, PendingLayer1TxnsContext } from 'contexts/PendingLayer1TxnsContext'
import { RowBetween } from 'components/Row'
import QuestionHelper from 'components/QuestionHelper'
import { WithdrawalRequestsContext } from 'contexts/WithdrawalRequestsContext'
import { LightCard } from 'components/Card'
import { useRollupGlobalState } from 'hooks/useRollupGlobalState'
import { useClock } from 'hooks/useClock'
import CardNav from './CardNav'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import PageHeader from './PageHeader'
import { WithdrawalRequestCard } from './WithdrawalRequestCard'

// const ShowMoreButton = styled.button`
//   align-items: center;
//   border: 0;
//   outline: 0;
//   background: transparent;
//   box-shadow: none;
//   cursor: pointer;
//   display: inline-flex;
//   font-family: inherit;
//   font-size: 16px;
//   justify-content: center;
//   text-decoration: none;
//   color: ${({ theme }) => theme.colors.primary};
//   font-weight: 500;
//   :hover {
//     text-decoration: underline;
//   }

//   :focus {
//     outline: none;
//     text-decoration: underline;
//   }

//   :active {
//     text-decoration: none;
//   }
// `

export default function Withdrawal() {
  const theme = useContext(ThemeContext)
  const { account: ethAddress, chainId } = useActiveWeb3React()

  const txHistoryStorageKey = useMemo(
    () => (chainId != null && ethAddress != null ? `@${chainId}@${ethAddress}/bridge-withdrawal-history` : undefined),
    [chainId, ethAddress]
  )
  const { txHistory } = useLayer1TxHistory(txHistoryStorageKey)
  const { txStatuses, txStatusesStorageKey } = useContext(PendingLayer1TxnsContext)

  const {
    hasBeenFetched: hasLastFinalizedBlockNumberBeenFetched,
    data: { lastFinalizedBlockNumber },
  } = useRollupGlobalState()

  const {
    withdrawalRequests: { data: withdrawalRequests, hasBeenFetched: hasWithdrawalRequestsBeenFetched },
    setFetchWithdrawalRequestsConfig,
  } = useContext(WithdrawalRequestsContext)

  const pendingTxByOutPoint = useMemo(
    () =>
      txHistory.reduce((result, { txHash, outPoint }) => {
        if (outPoint != null && result[outPoint] == null && txStatuses[txHash] !== Layer1TxStatus.dropped) {
          result[outPoint] = txHash
        }
        return result
      }, {} as { [outPoint: string]: string | undefined }),
    [txHistory, txStatuses]
  )

  useEffect(() => {
    setFetchWithdrawalRequestsConfig((config) => ({
      ...config,
      shouldRefresh: true,
      refreshInterval: 20_000,
      isDisabled: false,
    }))

    return () => {
      setFetchWithdrawalRequestsConfig({
        isDisabled: true,
      })
    }
  }, [setFetchWithdrawalRequestsConfig])

  const now = useClock()

  // const handleLoadMoreWithdrawalRequests = useCallback(() => {
  //   setFetchWithdrawalRequestsSizeLimit(1000)
  // }, [setFetchWithdrawalRequestsSizeLimit])

  return (
    <BridgeBodyWrapper>
      <CardNav activeIndex={1} />
      <AppBody>
        <Wrapper>
          <PageHeader
            title="Withdrawal"
            description="Withdraw assets back to layer 1"
            txHistory={txHistory}
            txStatuses={txStatuses}
            txStatusesStorageKey={txStatusesStorageKey}
          >
            {ethAddress == null ? (
              <ConnectWalletButton />
            ) : (
              <Button id="request-withdrawal-button" as={Link} to="/bridge/withdrawal/request">
                Request Withdrawal
              </Button>
            )}
          </PageHeader>
          <CardBody style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <AutoColumn gap="12px" style={{ width: '100%' }}>
              <RowBetween padding="0 8px">
                <Text color={theme.colors.text}>Your Withdrawal Requests</Text>
                <QuestionHelper text="Withdrawal Requests are immature withdrawals, you can withdraw assets back to layer 1 wallet after maturity" />
              </RowBetween>

              {ethAddress == null ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    Connect wallet to view your requests.
                  </Text>
                </LightCard>
              ) : !hasWithdrawalRequestsBeenFetched ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    <Dots>Loading</Dots>
                  </Text>
                </LightCard>
              ) : withdrawalRequests.length === 0 ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    No requests found, it may take a few minutes for new withdrawals to appear after submission.
                  </Text>
                </LightCard>
              ) : (
                withdrawalRequests.map((withdrawalRequest) => (
                  <WithdrawalRequestCard
                    key={withdrawalRequest.outPoint}
                    withdrawalRequest={withdrawalRequest}
                    lastFinalizedBlockNumber={
                      hasLastFinalizedBlockNumberBeenFetched ? lastFinalizedBlockNumber : undefined
                    }
                    now={now}
                    pendingTxHash={pendingTxByOutPoint[withdrawalRequest.outPoint]}
                    txStatuses={txStatuses}
                  />
                ))
              )}

              {/* {hasWithdrawalRequestsBeenFetched && withdrawalRequests.length === 5 && (
                <Text fontSize="14px" style={{ padding: '.5rem 0 .5rem 0' }}>
                  Displaying oldest 5 requests.{' '}
                  <ShowMoreButton onClick={handleLoadMoreWithdrawalRequests}>Show all</ShowMoreButton>
                </Text>
              )} */}
            </AutoColumn>
          </CardBody>
        </Wrapper>
      </AppBody>
    </BridgeBodyWrapper>
  )
}
