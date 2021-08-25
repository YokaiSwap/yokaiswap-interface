import React, { CSSProperties, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from '@yokaiswap/interface-uikit'
import { IStablePool } from 'constants/stablePools'
import StablePoolLogo from 'components/StablePoolLogo'
import Column from '../Column'
import { MenuItem } from './styleds'

function poolKey(pool: IStablePool | null): string {
  return pool === null ? '' : pool.address
}

function PoolRow({
  pool,
  onSelect,
  isSelected,
  style,
}: {
  pool: IStablePool
  onSelect: () => void
  isSelected: boolean
  style: CSSProperties
}) {
  const key = poolKey(pool)

  return (
    <MenuItem
      style={style}
      className={`pool-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
    >
      <StablePoolLogo pool={pool} size="24px" />
      <Column>
        <Text title={pool.name}>{pool.name}</Text>
      </Column>
    </MenuItem>
  )
}

export default function PoolList({
  height,
  pools,
  selectedPool,
  onPoolSelect,
}: {
  height: number
  pools: Readonly<IStablePool[]>
  selectedPool?: IStablePool | null
  onPoolSelect: (pool: IStablePool | null) => void
}) {
  const Row = useCallback(
    ({ data, index, style }) => {
      if (index === 0) {
        return (
          <MenuItem
            style={style}
            className="pool-item-default"
            onClick={() => onPoolSelect(null)}
            disabled={selectedPool == null}
          >
            <StablePoolLogo size="24px" />
            <Column>
              <Text>
                General pair pool
                {/* <QuestionHelper text="Pool with any two tokens." /> */}
              </Text>
            </Column>
          </MenuItem>
        )
      }
      const pool: IStablePool = data[index]
      const isSelected = Boolean(selectedPool && selectedPool.address === pool.address)
      const handleSelect = () => onPoolSelect(pool)
      return <PoolRow style={style} pool={pool} isSelected={isSelected} onSelect={handleSelect} />
    },
    [onPoolSelect, selectedPool]
  )

  const itemKey = useCallback((index: number, data: any) => poolKey(data[index]), [])

  const itemData = useMemo(() => ([null] as Array<null | IStablePool>).concat(pools), [pools])

  return (
    <FixedSizeList
      height={height}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
