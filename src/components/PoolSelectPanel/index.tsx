import React, { useState, useCallback } from 'react'
import { ChevronDownIcon, Text } from '@yokaiswap/interface-uikit'
import styled from 'styled-components'
import useI18n from 'hooks/useI18n'
import { IStablePool } from 'constants/stablePools'
import { darken } from 'polished'
import StablePoolLogo from 'components/StablePoolLogo'
import PoolSearchModal from 'components/SearchModal/PoolSearchModal'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const PoolSelect = styled.button<{ selected: boolean }>`
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
  :hover {
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
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
interface PoolSelectPanelProps {
  label?: string
  onPoolSelect?: (pool: IStablePool | null) => void
  pool?: IStablePool | null
  hideInput?: boolean
  disablePoolSelect?: boolean
  id: string
}
export default function PoolSelectPanel({
  label,
  onPoolSelect,
  pool,
  hideInput = false,
  disablePoolSelect = false,
  id,
}: PoolSelectPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const TranslateString = useI18n()
  const translatedLabel = label || TranslateString(132, 'Pool')
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disablePoolSelect}>
          <Text style={{ marginRight: 'auto' }} fontSize="14px">
            {translatedLabel}
          </Text>
          <PoolSelect
            selected={pool != null}
            className="open-currency-select-button"
            onClick={() => {
              if (!disablePoolSelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              {pool ? <StablePoolLogo pool={pool} size="24px" style={{ marginRight: '8px' }} /> : null}
              {pool ? (
                <Text>
                  {pool.name.length > 20
                    ? `${pool.name.slice(0, 4)}...${pool.name.slice(pool.name.length - 5, pool.name.length)}`
                    : pool.name}
                </Text>
              ) : (
                <Text>{TranslateString(1196, 'General pair pool')}</Text>
              )}
              {!disablePoolSelect && <ChevronDownIcon />}
            </Aligner>
          </PoolSelect>
        </InputRow>
      </Container>
      {!disablePoolSelect && onPoolSelect && (
        <PoolSearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onPoolSelect={onPoolSelect}
          selectedPool={pool}
        />
      )}
    </InputPanel>
  )
}
