// import { ChainId } from '@yokaiswap/sdk'
import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text, Button } from '@yokaiswap/interface-uikit'
import { ArrowUpCircle } from 'react-feather'
import { AutoColumn } from '../Column'
import { Wrapper, Section, ConfirmedIcon, ContentHeader } from './helpers'

type TransactionSubmittedContentProps = {
  onDismiss: () => void
  hash: string | undefined
  // chainId: ChainId
}

const StyledTxHash = styled(Text)`
  display: flex;
  align-items: center;
  width: fit-content;
  word-break: break-all;
`

const TransactionSubmittedContent = ({ onDismiss, hash }: TransactionSubmittedContentProps) => {
  const theme = useContext(ThemeContext)

  return (
    <Wrapper>
      <Section>
        <ContentHeader onDismiss={onDismiss}>Transaction submitted</ContentHeader>
        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={97} color={theme.colors.primary} />
        </ConfirmedIcon>
        <AutoColumn gap="8px" justify="center">
          {hash && <StyledTxHash>{hash}</StyledTxHash>}
          {/* {chainId && hash && (
            <LinkExternal href={getBscScanLink(chainId, hash, 'transaction')}>View on BscScan</LinkExternal>
          )} */}
          <Button onClick={onDismiss} mt="20px">
            Close
          </Button>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

export default TransactionSubmittedContent
