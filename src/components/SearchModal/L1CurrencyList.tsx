import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import styled from 'styled-components'
import { Text } from '@yokaiswap/interface-uikit'
import { SUDTTokenOrCurrency } from 'hooks/useSUDTCurrenciesWithBalance'
import { CKB_SUDT } from 'helpers/SUDTCurrency'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import { BigInteger } from 'big-integer'
import { getDisplayAmount, getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { useActiveWeb3React } from '../../hooks'
import Column from '../Column'
import { RowFixed } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { MenuItem } from './styleds'
import Loader from '../Loader'

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

function Balance({ balance, decimals }: { balance: BigInteger; decimals: number }) {
  return (
    <StyledBalanceText title={getFullDisplayAmount(balance, decimals)}>
      {getDisplayAmount(balance, decimals)}
    </StyledBalanceText>
  )
}

interface CurrencyRowProps {
  currency: SUDTTokenOrCurrency
  onSelect: () => void
  isSelected: boolean
  style: CSSProperties
}

function CurrencyRow({ currency, onSelect, isSelected, style }: CurrencyRowProps) {
  const { account } = useActiveWeb3React()
  const { balance, hasBalanceBeenFetched, decimals, symbol, symbolFull, layer2Currency } = useSUDTCurrency(
    currency.issuerLockHash
  )

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${currency.issuerLockHash}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
    >
      <CurrencyLogo currency={layer2Currency} size="24px" />
      <Column>
        <Text title={currency.name ?? symbolFull}>{symbol}</Text>
      </Column>
      <span />
      <RowFixed style={{ justifySelf: 'flex-end' }}>
        {hasBalanceBeenFetched ? <Balance balance={balance} decimals={decimals} /> : account ? <Loader /> : null}
      </RowFixed>
    </MenuItem>
  )
}

export interface IL1CurrencyListProps {
  height: number
  currencies: SUDTTokenOrCurrency[]
  onCurrencySelect: (currency: SUDTTokenOrCurrency) => void
  selectedIssuerLockHash?: string | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showETH: boolean
}

export default function L1CurrencyList({
  height,
  currencies,
  onCurrencySelect,
  selectedIssuerLockHash,
  fixedListRef,
  showETH,
}: IL1CurrencyListProps) {
  const itemData = useMemo(() => (showETH ? [CKB_SUDT, ...currencies] : [...currencies]), [currencies, showETH])

  const Row = useCallback(
    ({ data, index, style }) => {
      const currency: SUDTTokenOrCurrency = data[index]
      const isSelected = Boolean(selectedIssuerLockHash && currency.issuerLockHash === selectedIssuerLockHash)
      const handleSelect = () => onCurrencySelect(currency)
      return <CurrencyRow style={style} currency={currency} isSelected={isSelected} onSelect={handleSelect} />
    },
    [onCurrencySelect, selectedIssuerLockHash]
  )

  const itemKey = useCallback((index: number, data: SUDTTokenOrCurrency[]) => data[index].issuerLockHash, [])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
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
