import React from 'react'
import { Percent } from '@yokaiswap/sdk'
import { Text } from '@yokaiswap/interface-uikit'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'

export function PoolPriceBar({ poolTokenPercentage }: { poolTokenPercentage?: Percent }) {
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <Text>{(poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}%</Text>
          <Text fontSize="14px" color="textSubtle" pt={1}>
            Share of Pool
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export default PoolPriceBar
