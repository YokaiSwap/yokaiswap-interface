import React, { useCallback, useContext, useEffect } from 'react'
import { connectorLocalStorageKey, ConnectorNames, Menu as UikitMenu } from '@yokaiswap/interface-uikit'
import { useWeb3React } from '@web3-react/core'
import { allLanguages } from 'constants/localisation/languageCodes'
import { LanguageContext } from 'hooks/LanguageContext'
import useTheme from 'hooks/useTheme'
// import useGetPriceData from 'hooks/useGetPriceData'
// import useGetLocalProfile from 'hooks/useGetLocalProfile'
import useAuth from 'hooks/useAuth'
import links from './config'
import useGetCakeBusdLpPrice from '../../hooks/useGetCakeBusdLpPrice'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const chainId = parseInt(process.env.REACT_APP_CHAIN_ID!, 10)

const Menu: React.FC = (props) => {
  const { account } = useWeb3React()
  const { login, logout } = useAuth()
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext)
  const { isDark, toggleTheme } = useTheme()
  const cakeBusdPrice = useGetCakeBusdLpPrice()

  const handleConnect = useCallback(() => {
    login(ConnectorNames.Injected)
    window.localStorage.setItem(connectorLocalStorageKey, ConnectorNames.Injected)
  }, [login])
  const handleDisconnect = useCallback(() => {
    logout()
    window.localStorage.removeItem(connectorLocalStorageKey)
  }, [logout])

  const autoConnect = useCallback(
    (id = Number(window.ethereum?.chainId)) => {
      const key = window.localStorage.getItem(connectorLocalStorageKey)
      if (key === ConnectorNames.Injected && Number(id) === chainId) {
        login(ConnectorNames.Injected)
      }
    },
    [login]
  )

  useEffect(() => {
    ;(window.ethereum as any)?.addListener('chainChanged', autoConnect)
    const timeoutId = window.setTimeout(autoConnect, 500)

    return () => {
      window.clearTimeout(timeoutId)
      ;(window.ethereum as any)?.removeListener('chainChanged', autoConnect)
    }
  }, [autoConnect])
  // const priceData = useGetPriceData()
  // const cakePriceUsd = priceData ? Number(priceData.prices.Cake) : undefined
  // const profile = useGetLocalProfile()

  return (
    <UikitMenu
      links={links}
      account={account as string}
      login={handleConnect}
      logout={handleDisconnect}
      isDark={isDark}
      toggleTheme={toggleTheme}
      currentLang={selectedLanguage?.code || ''}
      langs={allLanguages}
      setLang={setSelectedLanguage}
      cakePriceUsd={cakeBusdPrice}
      profile={undefined}
      {...props}
    />
  )
}

export default Menu
