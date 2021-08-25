import React, { useContext } from 'react'
import { ChainId } from '@yokaiswap/sdk'
import { ThemeContext } from 'styled-components'
import { Button, LinkExternal } from '@yokaiswap/interface-uikit'
import { ArrowUpCircle } from 'react-feather'
import { getCKBExplorerLink } from 'utils'
import Modal from 'components/Modal'
import { AutoColumn } from '../../components/Column'
import { Wrapper, Section, ConfirmedIcon, ContentHeader } from '../../components/TransactionConfirmationModal/helpers'

type ISubmittedModalProps = {
  isOpen: boolean
  onDismiss?: () => void
  title?: string
  hash?: string
  chainId?: ChainId
}

const defaultOnDismiss = () => null

const SubmittedModal = ({
  isOpen,
  onDismiss = defaultOnDismiss,
  title = 'Transaction submitted',
  hash,
  chainId,
  children,
}: React.PropsWithChildren<ISubmittedModalProps>) => {
  const theme = useContext(ThemeContext)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <Wrapper>
        <Section>
          <ContentHeader onDismiss={onDismiss}>{title}</ContentHeader>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={97} color={theme.colors.primary} />
          </ConfirmedIcon>
          <AutoColumn gap="8px" justify="center">
            {chainId && hash && (
              <LinkExternal href={getCKBExplorerLink(chainId, hash, 'transaction')}>View on Explorer</LinkExternal>
            )}
            {children}
            <Button onClick={onDismiss} mt="20px">
              Close
            </Button>
          </AutoColumn>
        </Section>
      </Wrapper>
    </Modal>
  )
}

export default SubmittedModal
