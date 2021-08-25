import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IWithdrawalRequest } from 'hooks/useWithdrawalRequests'
import styled from 'styled-components'
import { darken } from 'polished'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { Button, Text } from '@yokaiswap/interface-uikit'
import { ETHER } from '@yokaiswap/sdk'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import { ChevronDown, ChevronUp } from 'react-feather'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Dots } from 'components/swap/styleds'
import { zero } from 'big-integer'
import { getDisplayAmount, getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { AmountUnit } from '@lay2/pw-core'
import { gwEstimateBlockFinalityTime } from 'config'
import getTimePeriods from 'helpers/getTimePeriods'
import { ILayer1TxStatuses, Layer1TxStatus } from 'contexts/PendingLayer1TxnsContext'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.invertedContrast};
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.colors.invertedContrast)};
  }
`

export interface IWithdrawalRequestCardProps {
  withdrawalRequest: IWithdrawalRequest
  now: number
  txStatuses: ILayer1TxStatuses
  lastFinalizedBlockNumber?: number
  pendingTxHash?: string
}

export function WithdrawalRequestCard({
  withdrawalRequest,
  lastFinalizedBlockNumber,
  now,
  pendingTxHash,
  txStatuses,
}: IWithdrawalRequestCardProps) {
  const [shouldShowMore, setShouldShowMore] = useState(false)
  const { withdrawalBlockNumber, capacity, amount, outPoint, cell } = withdrawalRequest

  const blockLeft = useMemo(
    () => Math.max(0, withdrawalBlockNumber - (lastFinalizedBlockNumber ?? 0)),
    [lastFinalizedBlockNumber, withdrawalBlockNumber]
  )

  const isMature = useMemo(() => blockLeft === 0, [blockLeft])
  const isLoading = useMemo(() => lastFinalizedBlockNumber == null, [lastFinalizedBlockNumber])
  const isLoadingOrMature = useMemo(() => isLoading || isMature, [isLoading, isMature])
  const issuerLockHash = useMemo(() => cell.type?.args, [cell])
  const { layer2Currency, decimals, symbol } = useSUDTCurrency(issuerLockHash)

  const [sudtAmount, sudtFullAmount] = useMemo(() => {
    if (amount.eq(zero)) {
      return ['', '']
    }

    return [`${getDisplayAmount(amount, decimals)} ${symbol}`, `${getFullDisplayAmount(amount, decimals)} ${symbol}`]
  }, [amount, decimals, symbol])

  const [ckbAmount, ckbFullAmount] = useMemo(() => {
    if (capacity.eq(zero)) {
      console.error('[warn] a withdrawal request cell with zero capacity')
      return ['', '']
    }

    return [
      `${getDisplayAmount(capacity, AmountUnit.ckb)} CKB`,
      `${getFullDisplayAmount(capacity, AmountUnit.ckb)} CKB`,
    ]
  }, [capacity])

  const handleToggleShowMore = useCallback(() => {
    setShouldShowMore((value) => !value)
  }, [])

  const estimatedArrivalDate = useMemo(() => Date.now() + blockLeft * gwEstimateBlockFinalityTime * 1000, [blockLeft])
  const estimatedSecondsLeft = useMemo(() => Math.max(0, estimatedArrivalDate - now), [now, estimatedArrivalDate])
  const {
    days: daysLeft,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
  } = useMemo(() => getTimePeriods(estimatedSecondsLeft / 1000), [estimatedSecondsLeft])

  const hasPendingTx = pendingTxHash != null && txStatuses[pendingTxHash] !== Layer1TxStatus.dropped

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow
          onClick={isLoadingOrMature ? undefined : handleToggleShowMore}
          style={isLoadingOrMature ? undefined : { cursor: 'pointer' }}
        >
          <RowFixed>
            <DoubleCurrencyLogo currency0={layer2Currency} currency1={ETHER} margin size={20} />
            <Text title={`${sudtFullAmount}${sudtFullAmount === '' ? '' : ' and '}${ckbFullAmount}`}>
              {sudtAmount}
              {sudtAmount === '' ? '' : ` and `}
              {ckbAmount}
            </Text>
          </RowFixed>
          <RowFixed>
            {isLoading ? (
              <Dots>Loading</Dots>
            ) : !isMature ? (
              <>
                {!shouldShowMore && (
                  <Text marginLeft="10px" title="Estimated time left">
                    {daysLeft > 0
                      ? `${daysLeft} ${daysLeft > 1 ? 'days' : 'day'}`
                      : `${hoursLeft > 0 ? `${hoursLeft.toString().padStart(2, '0')}:` : ''}${minutesLeft
                          .toString()
                          .padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`}
                  </Text>
                )}
                {shouldShowMore ? (
                  <ChevronUp size="20" style={{ marginLeft: '10px' }} />
                ) : (
                  <ChevronDown size="20" style={{ marginLeft: '10px' }} />
                )}
              </>
            ) : (
              <Button disabled={hasPendingTx} as={Link} scale="sm" to={`/bridge/withdrawal/${outPoint}`}>
                Withdraw
              </Button>
            )}
          </RowFixed>
        </FixedHeightRow>
        {!isLoading && !isMature && shouldShowMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <Text>Blocks remaining:</Text>
              <Text>{blockLeft}</Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Estimated time left:</Text>
              <Text>
                {`${daysLeft > 0 ? `${daysLeft} ${daysLeft > 1 ? 'days' : 'day'} ` : ''}${
                  hoursLeft > 0 ? `${hoursLeft.toString().padStart(2, '0')}:` : ''
                }${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`}
              </Text>
            </FixedHeightRow>
          </AutoColumn>
        )}
      </AutoColumn>
    </HoverCard>
  )
}
