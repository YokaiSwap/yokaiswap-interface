import { IStablePool } from 'constants/stablePools'
import React, { useCallback, useEffect, useState } from 'react'
import useLast from '../../hooks/useLast'
import { useSelectedListUrl } from '../../state/lists/hooks'
import Modal from '../Modal'
import { PoolSearch } from './PoolSearch'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedPool?: IStablePool | null
  onPoolSelect: (pool: IStablePool | null) => void
}

export default function PoolSearchModal({ isOpen, onDismiss, onPoolSelect, selectedPool }: CurrencySearchModalProps) {
  const [listView, setListView] = useState<boolean>(false)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setListView(false)
    }
  }, [isOpen, lastOpen])

  const handlePoolSelect = useCallback(
    (pool: IStablePool | null) => {
      onPoolSelect(pool)
      onDismiss()
    },
    [onDismiss, onPoolSelect]
  )

  const selectedListUrl = useSelectedListUrl()
  const noListSelected = !selectedListUrl

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={listView ? 40 : noListSelected ? 0 : 80}>
      <PoolSearch onDismiss={onDismiss} onPoolSelect={handlePoolSelect} selectedPool={selectedPool} />
    </Modal>
  )
}
