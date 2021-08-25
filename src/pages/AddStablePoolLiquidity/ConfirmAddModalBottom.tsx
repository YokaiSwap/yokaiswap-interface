import React from 'react'
import { Currency, CurrencyAmount, Percent } from '@yokaiswap/sdk'
import { Button, Text } from '@yokaiswap/interface-uikit'
import { TranslateString } from 'utils/translateTextHelpers'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'

export function ConfirmAddModalBottom({
  noLiquidity,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
}: {
  noLiquidity?: boolean
  currencies?: Currency[]
  parsedAmounts: (CurrencyAmount | undefined)[]
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  return (
    <>
      {currencies?.[0] ? (
        <RowBetween>
          <Text>{currencies[0]?.symbol} Deposited</Text>
          <RowFixed>
            <CurrencyLogo currency={currencies[0]} style={{ marginRight: '8px' }} />
            <Text>{parsedAmounts[0]?.toSignificant(6) ?? '0'}</Text>
          </RowFixed>
        </RowBetween>
      ) : null}
      {currencies?.[1] ? (
        <RowBetween>
          <Text>{currencies[1]?.symbol} Deposited</Text>
          <RowFixed>
            <CurrencyLogo currency={currencies[1]} style={{ marginRight: '8px' }} />
            <Text>{parsedAmounts[1]?.toSignificant(6) ?? '0'}</Text>
          </RowFixed>
        </RowBetween>
      ) : null}
      {currencies?.[2] ? (
        <RowBetween>
          <Text>{currencies[2]?.symbol} Deposited</Text>
          <RowFixed>
            <CurrencyLogo currency={currencies[2]} style={{ marginRight: '8px' }} />
            <Text>{parsedAmounts[2]?.toSignificant(6) ?? '0'}</Text>
          </RowFixed>
        </RowBetween>
      ) : null}
      {currencies?.[3] ? (
        <RowBetween>
          <Text>{currencies[3]?.symbol} Deposited</Text>
          <RowFixed>
            <CurrencyLogo currency={currencies[3]} style={{ marginRight: '8px' }} />
            <Text>{parsedAmounts[3]?.toSignificant(6) ?? '0'}</Text>
          </RowFixed>
        </RowBetween>
      ) : null}
      <RowBetween>
        <Text>Share of Pool:</Text>
        <Text>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</Text>
      </RowBetween>
      <Button mt="20px" onClick={onAdd}>
        {noLiquidity ? TranslateString(250, 'Create Pool & Supply') : TranslateString(252, 'Confirm Supply')}
      </Button>
    </>
  )
}

export default ConfirmAddModalBottom
