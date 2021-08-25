import React, { useCallback } from 'react'
import { Text, CloseIcon } from '@yokaiswap/interface-uikit'
import AutoSizer from 'react-virtualized-auto-sizer'
import useI18n from 'hooks/useI18n'
import { IStablePool } from 'constants/stablePools'
import { useStablePools } from 'hooks/StablePools'
import Column from '../Column'
import { RowBetween } from '../Row'
import { PaddedColumn, Separator } from './styleds'
import PoolList from './PoolList'

interface PoolSearchProps {
  onDismiss: () => void
  selectedPool?: IStablePool | null
  onPoolSelect: (pool: IStablePool | null) => void
}

export function PoolSearch({ selectedPool, onPoolSelect, onDismiss }: PoolSearchProps) {
  const pools = useStablePools()

  const handlePoolSelect = useCallback(
    (pool: IStablePool | null) => {
      onPoolSelect(pool)
      onDismiss()
    },
    [onDismiss, onPoolSelect]
  )

  const TranslateString = useI18n()
  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text>
            {TranslateString(82, 'Select a pool')}
            {/* <QuestionHelper
              text={TranslateString(
                128,
                'Find a token by searching for its name or symbol or by pasting its address below.'
              )}
            /> */}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <div style={{ flex: '1' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <PoolList height={height} pools={pools} onPoolSelect={handlePoolSelect} selectedPool={selectedPool} />
          )}
        </AutoSizer>
      </div>
    </Column>
  )
}

export default PoolSearch
