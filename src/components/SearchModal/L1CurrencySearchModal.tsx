import React from 'react'
import { SUDTToken } from 'helpers/SUDTToken'
import Modal from '../Modal'
import { L1CurrencySearch } from './L1CurrencySearch'

interface IL1CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  onCurrencySelect: (issuerLockHash: string) => void
  selectedIssuerLockHash?: string | null
  tokens?: SUDTToken[]
}

export default function L1CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedIssuerLockHash,
  tokens,
}: IL1CurrencySearchModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={80}>
      <L1CurrencySearch
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={onCurrencySelect}
        selectedIssuerLockHash={selectedIssuerLockHash}
        tokens={tokens}
      />
    </Modal>
  )
}
