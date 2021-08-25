import React, { useState, useCallback } from 'react'
import { Button, ChevronDownIcon, Text } from '@yokaiswap/interface-uikit'
import styled from 'styled-components'
import { darken } from 'polished'
import { getDisplayAmount, getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { HelpCircle } from 'react-feather'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import L1CurrencySearchModal from 'components/SearchModal/L1CurrencySearchModal'
import { SUDTToken } from 'helpers/SUDTToken'
import { Dots } from 'components/swap/styleds'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween } from '../Row'
import { Input as NumericalInput } from '../NumericalInput'
import { useActiveWeb3React } from '../../hooks'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: ${({ selected, theme }) => (selected ? theme.colors.text : '#FFFFFF')};
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;
  :focus,
  :hover:not(:disabled) {
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
  :disabled {
    cursor: initial;
  }
`
const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.colors.textSubtle)};
  }
`
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
`
const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`
interface IL1CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  showMaxButton: boolean
  onMax?: () => void
  label?: string
  onCurrencySelect?: (issuerLockHash: string) => void
  selectedIssuerLockHash?: string | null
  disableCurrencySelect?: boolean
  shouldHideBalance?: boolean
  hideInput?: boolean
  id: string
  disabled?: boolean
  tokens?: SUDTToken[]
}

export default function L1CurrencyInputPanel({
  value,
  onUserInput,
  showMaxButton,
  onMax,
  label = 'input',
  onCurrencySelect,
  selectedIssuerLockHash,
  disableCurrencySelect = false,
  shouldHideBalance = false,
  hideInput = false,
  id,
  disabled = false,
  tokens,
}: IL1CurrencyInputPanelProps) {
  const { account } = useActiveWeb3React()

  const {
    balance,
    hasBalanceBeenFetched,
    layer2Currency: selectedLayer2Currency,
    decimals,
    symbol: selectedCurrencySymbol,
    symbolFull: selectedCurrencySymbolFull,
  } = useSUDTCurrency(selectedIssuerLockHash)

  const [shouldShowSearchModal, setShouldShowSearchModal] = useState(false)
  const handleDismissSearch = useCallback(() => {
    setShouldShowSearchModal(false)
  }, [])

  const handleOpenSearchModal = useCallback(() => {
    if (!disableCurrencySelect) {
      setShouldShowSearchModal(true)
    }
  }, [disableCurrencySelect])

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <RowBetween>
              <Text fontSize="14px">{label}</Text>
              {account != null && (
                <Text
                  fontSize="14px"
                  style={{ display: 'inline' }}
                  title={
                    !shouldHideBalance && selectedIssuerLockHash != null && hasBalanceBeenFetched
                      ? getFullDisplayAmount(balance, decimals)
                      : undefined
                  }
                >
                  {!shouldHideBalance && selectedIssuerLockHash != null && hasBalanceBeenFetched ? (
                    `Balance: ${getDisplayAmount(balance, decimals)}`
                  ) : shouldHideBalance ? (
                    ''
                  ) : selectedIssuerLockHash == null ? (
                    '-'
                  ) : (
                    <Dots>Balance: loading</Dots>
                  )}
                </Text>
              )}
            </RowBetween>
          </LabelRow>
        )}
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          {!hideInput && (
            <>
              <NumericalInput
                disabled={disabled}
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account != null &&
                showMaxButton &&
                !disabled &&
                selectedIssuerLockHash != null &&
                hasBalanceBeenFetched && (
                  <Button onClick={onMax} scale="sm" variant="text">
                    MAX
                  </Button>
                )}
            </>
          )}
          <CurrencySelect
            disabled={disableCurrencySelect}
            selected={selectedIssuerLockHash != null}
            className="open-currency-select-button"
            onClick={handleOpenSearchModal}
          >
            <Aligner>
              {selectedLayer2Currency != null ? (
                <CurrencyLogo currency={selectedLayer2Currency} size="24px" style={{ marginRight: '8px' }} />
              ) : selectedIssuerLockHash != null ? (
                <HelpCircle color="white" size="24px" style={{ marginRight: '8px' }} />
              ) : null}
              <Text title={selectedCurrencySymbolFull}>
                {selectedCurrencySymbol || `Select a ${tokens != null ? 'sUDT' : 'token'}`}
              </Text>
              {!disableCurrencySelect && <ChevronDownIcon />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
      </Container>
      {!disableCurrencySelect && onCurrencySelect != null && (
        <L1CurrencySearchModal
          isOpen={shouldShowSearchModal}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedIssuerLockHash={selectedIssuerLockHash}
          tokens={tokens}
        />
      )}
    </InputPanel>
  )
}
