import React from 'react'
import { CurrencyAmount, Percent } from '@yokaiswap/sdk'
import { Card, CardBody, Text } from '@yokaiswap/interface-uikit'
import useI18n from 'hooks/useI18n'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'

function TradeSummary({
  slippageAdjustedOutputAmount,
  realizedLPFee,
  priceImpact,
}: {
  slippageAdjustedOutputAmount: CurrencyAmount
  realizedLPFee: CurrencyAmount
  priceImpact: Percent
}) {
  const TranslateString = useI18n()

  return (
    <Card>
      <CardBody>
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
            <Text fontSize="14px">
              {`${slippageAdjustedOutputAmount?.toSignificant(4)} ${slippageAdjustedOutputAmount.currency.symbol}`}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <Text fontSize="14px">{TranslateString(226, 'Price Impact')}</Text>
            <QuestionHelper
              text={TranslateString(
                224,
                'The difference between the market price and estimated price due to trade size.'
              )}
            />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <Text fontSize="14px">{TranslateString(228, 'Liquidity Provider Fee')}</Text>
            <QuestionHelper text={TranslateString(230, 'For each trade a 0.04% fee is paid.')} />
          </RowFixed>
          <Text fontSize="14px">
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
          </Text>
        </RowBetween>
      </CardBody>
    </Card>
  )
}

export interface AdvancedStableSwapDetailsProps {
  slippageAdjustedOutputAmount?: CurrencyAmount
  realizedLPFee?: CurrencyAmount
  priceImpact?: Percent
}

export function AdvancedStableSwapDetails({
  slippageAdjustedOutputAmount,
  realizedLPFee,
  priceImpact,
}: AdvancedStableSwapDetailsProps) {
  return (
    <AutoColumn gap="md">
      {slippageAdjustedOutputAmount && realizedLPFee && priceImpact && (
        <TradeSummary
          slippageAdjustedOutputAmount={slippageAdjustedOutputAmount}
          realizedLPFee={realizedLPFee}
          priceImpact={priceImpact}
        />
      )}
    </AutoColumn>
  )
}
