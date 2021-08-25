import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text, CloseIcon } from '@yokaiswap/interface-uikit'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useSUDTCurrenciesWithBalance, SUDTTokenOrCurrency } from 'hooks/useSUDTCurrenciesWithBalance'
import { SUDTToken } from 'helpers/SUDTToken'
import { CKB_SUDT } from 'helpers/SUDTCurrency'
import { useTokensByAddress } from '../../hooks/Tokens'
import { isAddress } from '../../utils'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween } from '../Row'
import { filterSUDT } from './filtering'
import SortButton from './SortButton'
import { useL1TokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import L1CurrencyList from './L1CurrencyList'

interface IL1CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  onCurrencySelect: (issuerLockHash: string) => void
  selectedIssuerLockHash?: string | null
  tokens?: SUDTToken[]
}

export function L1CurrencySearch({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedIssuerLockHash,
  tokens,
}: IL1CurrencySearchProps) {
  const { t } = useTranslation()

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const allTokens = useSUDTCurrenciesWithBalance()
  const tokensByAddress = useTokensByAddress(tokens)
  const availableTokens = useMemo(() => (tokens ? tokensByAddress : allTokens), [tokens, tokensByAddress, allTokens])

  const showETH: boolean = useMemo(() => {
    if (tokens) {
      return false
    }
    const s = searchQuery.toLowerCase().trim()
    return s === '' || s === 'c' || s === 'ck' || s === 'ckb'
  }, [searchQuery, tokens])

  const tokenComparator = useL1TokenComparator(invertSearchOrder)

  // const audioPlay = useSelector<AppState, AppState['user']['audioPlay']>((state) => state.user.audioPlay)

  const filteredTokens: SUDTTokenOrCurrency[] = useMemo(() => {
    return filterSUDT(Object.values(availableTokens), searchQuery)
  }, [availableTokens, searchQuery])

  const filteredSortedTokens: SUDTTokenOrCurrency[] = useMemo(() => {
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)
    if (symbolMatch.length > 1) {
      return sorted
    }

    return [
      // sort any exact symbol matches first
      ...sorted.filter((token) => token.symbol?.toLowerCase() === symbolMatch[0]),
      ...sorted.filter((token) => token.symbol?.toLowerCase() !== symbolMatch[0]),
    ]
  }, [filteredTokens, searchQuery, tokenComparator])

  const handleCurrencySelect = useCallback(
    (currency: SUDTTokenOrCurrency) => {
      onCurrencySelect(currency.issuerLockHash)
      onDismiss()
      // if (audioPlay) {
      //   const audio = document.getElementById('bgMusic') as HTMLAudioElement
      //   if (audio) {
      //     audio.play()
      //   }
      // }
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = searchQuery.toLowerCase().trim()
        if (s === 'ckb' && tokens == null) {
          handleCurrencySelect(CKB_SUDT)
        } else if (filteredSortedTokens.length > 0) {
          if (
            filteredSortedTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
            filteredSortedTokens.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokens[0])
          }
        }
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery, tokens]
  )

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text>
            Select a {tokens != null ? 'sUDT' : 'token'}
            <QuestionHelper
              text={`Find a ${
                tokens != null ? 'sUDT' : 'token'
              } by searching for its name or symbol or by pasting its issuer-lock-hash or layer 2 address below.`}
            />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t('tokenSearchPlaceholder')}
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
        <RowBetween>
          <Text fontSize="14px">Token name</Text>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder((iso) => !iso)} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <div style={{ flex: '1' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <L1CurrencyList
              height={height}
              showETH={showETH}
              currencies={filteredSortedTokens}
              onCurrencySelect={handleCurrencySelect}
              selectedIssuerLockHash={selectedIssuerLockHash}
              fixedListRef={fixedList}
            />
          )}
        </AutoSizer>
      </div>
    </Column>
  )
}

export default L1CurrencySearch
