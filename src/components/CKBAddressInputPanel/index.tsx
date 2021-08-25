import React, { useCallback } from 'react'
import styled from 'styled-components'
import { Text, LinkExternal } from '@yokaiswap/interface-uikit'
import { useActiveWeb3React } from 'hooks'
import { getCKBExplorerLink } from 'utils'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

const InputPanel = styled.div`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.colors.input};
  z-index: 1;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.colors.failure : theme.colors.input)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.colors.input};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const Input = styled.input<{ error?: boolean }>`
  font-size: 16px;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.colors.input};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.colors.failure : theme.colors.text)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.colors.textSubtle};
    opacity: 0.6;
  }
`

export default function CKBAddressInputPanel({
  id,
  value,
  onChange,
  hasError = false,
}: {
  id?: string
  // the typed string value
  value: string
  // triggers whenever the typed value changes
  onChange: (value: string) => void
  hasError?: boolean
}) {
  const { chainId } = useActiveWeb3React()

  const handleInput = useCallback(
    (event) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  return (
    <InputPanel id={id}>
      <ContainerRow error={hasError}>
        <InputContainer style={{ overflow: 'hidden' }}>
          <AutoColumn gap="md" style={{ overflow: 'hidden' }}>
            <RowBetween>
              <Text color="textSubtle" fontWeight={500} fontSize="14px">
                To Layer 1 Address
              </Text>
              {value !== '' && chainId && !hasError && (
                <LinkExternal href={getCKBExplorerLink(chainId, value, 'address')} style={{ fontSize: '14px' }}>
                  View on Explorer
                </LinkExternal>
              )}
            </RowBetween>
            <Input
              className="recipient-address-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="CKB Address"
              error={hasError}
              pattern="^([a-zA-Z0-9]*)$"
              onChange={handleInput}
              value={value}
            />
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
