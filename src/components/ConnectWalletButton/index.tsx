import React, { useCallback } from 'react'
import {
  Button,
  ButtonProps,
  connectorLocalStorageKey,
  ConnectorNames,
  useWalletModal,
} from '@yokaiswap/interface-uikit'
import useAuth from 'hooks/useAuth'

const UnlockButton: React.FC<ButtonProps> = (props) => {
  const { login, logout } = useAuth()
  const handleConnect = useCallback(() => {
    login(ConnectorNames.Injected)
    window.localStorage.setItem(connectorLocalStorageKey, ConnectorNames.Injected)
  }, [login])
  const handleDisconnect = useCallback(() => {
    logout()
    window.localStorage.removeItem(connectorLocalStorageKey)
  }, [logout])

  const { onPresentConnectModal } = useWalletModal(handleConnect, handleDisconnect)

  return (
    <Button onClick={onPresentConnectModal} {...props}>
      Connect Wallet
    </Button>
  )
}

export default UnlockButton
