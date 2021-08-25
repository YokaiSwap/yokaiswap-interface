import { CurrencyAmount, Percent, Price } from '@yokaiswap/sdk'
import React, { useState } from 'react'
import { Text, Button } from '@yokaiswap/interface-uikit'
import { Repeat } from 'react-feather'

import useI18n from 'hooks/useI18n'
import { warningSeverity } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'

export default function StableSwapModalFooter({
  inputAmount,
  slippageAdjustedOutputAmount,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  realizedLPFee,
  priceImpact,
  executionPrice,
}: {
  inputAmount: CurrencyAmount
  slippageAdjustedOutputAmount: CurrencyAmount
  realizedLPFee: CurrencyAmount
  priceImpact: Percent
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  executionPrice: Price
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const severity = warningSeverity(priceImpact)
  const TranslateString = useI18n()

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <Text fontSize="14px">Price</Text>
          <Text
            fontSize="14px"
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '8px',
              fontWeight: 500,
            }}
          >
            {showInverted
              ? `${executionPrice.invert().toSignificant(6)} ${inputAmount.currency.symbol} / ${
                  slippageAdjustedOutputAmount.currency.symbol
                }`
              : `${executionPrice.toSignificant(6)} ${slippageAdjustedOutputAmount.currency.symbol} / ${
                  inputAmount.currency.symbol
                }`}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <Text fontSize="14px">{TranslateString(1210, 'Minimum received')}</Text>
            <QuestionHelper
              text={TranslateString(
                202,
                'Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.'
              )}
            />
          </RowFixed>
          <RowFixed>
            <Text fontSize="14px">{slippageAdjustedOutputAmount.toSignificant(4)}</Text>
            <Text fontSize="14px" marginLeft="4px">
              {slippageAdjustedOutputAmount.currency.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <Text fontSize="14px">{TranslateString(226, 'Price Impact')}</Text>
            <QuestionHelper
              text={TranslateString(224, 'The difference between the market price and your price due to trade size.')}
            />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <Text fontSize="14px">{TranslateString(228, 'Liquidity Provider Fee')}</Text>
            <QuestionHelper text={TranslateString(999, 'For each trade a 0.04% fee is paid.')} />
          </RowFixed>
          <Text fontSize="14px">
            {realizedLPFee ? `${realizedLPFee?.toSignificant(6)} ${realizedLPFee.currency.symbol}` : '-'}
          </Text>
        </RowBetween>
      </AutoColumn>

      <AutoRow>
        <Button
          onClick={onConfirm}
          disabled={disabledConfirm}
          variant={severity > 2 ? 'danger' : 'primary'}
          mt="10px"
          id="confirm-swap-or-send"
          width="100%"
        >
          {severity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
        </Button>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
