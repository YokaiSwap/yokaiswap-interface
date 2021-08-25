import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { CurrencyAmount, Percent } from '@yokaiswap/sdk'
import { Button, Text } from '@yokaiswap/interface-uikit'
import { ArrowDown, AlertTriangle } from 'react-feather'
import { isAddress, shortenAddress } from '../../utils'
import { warningSeverity } from '../../utils/prices'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import { SwapShowAcceptChanges } from './styleds'

const PriceInfoText = styled(Text)`
  font-style: italic;
  line-height: 1.3;

  span {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`

export default function StableSwapModalHeader({
  inputAmount,
  outputAmount,
  slippageAdjustedOutputAmount,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
  priceImpact,
}: {
  inputAmount: CurrencyAmount
  outputAmount: CurrencyAmount
  slippageAdjustedOutputAmount: CurrencyAmount
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  priceImpact: Percent
}) {
  const priceImpactSeverity = warningSeverity(priceImpact)

  const theme = useContext(ThemeContext)

  return (
    <AutoColumn gap="md" style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <RowFixed gap="0px">
          <CurrencyLogo currency={inputAmount.currency} size="24px" style={{ marginRight: '12px' }} />
          <Text fontSize="24px" color="text">
            {inputAmount.toSignificant(6)}
          </Text>
        </RowFixed>
        <RowFixed gap="0px">
          <Text fontSize="24px" style={{ marginLeft: '10px', fontWeight: 500 }}>
            {inputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDown size="16" color={theme.colors.textSubtle} style={{ marginLeft: '4px', minWidth: '16px' }} />
      </RowFixed>
      <RowBetween align="flex-end">
        <RowFixed gap="0px">
          <CurrencyLogo currency={outputAmount.currency} size="24px" style={{ marginRight: '12px' }} />
          <Text
            fontSize="24px"
            color={priceImpactSeverity > 2 ? theme.colors.failure : showAcceptChanges ? theme.colors.primary : 'text'}
          >
            {outputAmount.toSignificant(6)}
          </Text>
        </RowFixed>
        <RowFixed gap="0px">
          <Text fontSize="24px" style={{ marginLeft: '10px', fontWeight: 500 }}>
            {outputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap="0px">
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <Text color="primary"> Price Updated</Text>
            </RowFixed>
            <Button onClick={onAcceptChanges}>Accept</Button>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '16px 0 0' }}>
        <PriceInfoText>
          {`Output is estimated. You will receive at least `}
          <span>
            {slippageAdjustedOutputAmount.toSignificant(6)} {outputAmount.currency.symbol}
          </span>
          {' or the transaction will revert.'}
        </PriceInfoText>
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '16px 0 0' }}>
          <Text>
            Output will be sent to{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </Text>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}
