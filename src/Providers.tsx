import React from 'react'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import { ModalProvider } from '@yokaiswap/interface-uikit'
import { NetworkContextName } from './constants'
import store from './state'
import getLibrary from './utils/getLibrary'
import { ThemeContextProvider } from './contexts/ThemeContext'
import { TabVisibilityProvider } from './contexts/TabVisibilityContext'
import { GodwokenBaseProvider, GodwokenAccountProvider, GodwokenBalancesProvider } from './contexts/Godwoken/Providers'
import { PendingLayer1TxnsProvider } from './contexts/PendingLayer1TxnsContext'
import { WithdrawalRequestsProvider } from './contexts/WithdrawalRequestsContext'
import { IntervalRefreshProvider } from './contexts/IntervalRefreshContext'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

const Providers: React.FC = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <ThemeContextProvider>
            <ModalProvider>
              <TabVisibilityProvider>
                <GodwokenBaseProvider>
                  <GodwokenAccountProvider>
                    <GodwokenBalancesProvider
                      defaultFetchCKBBalanceL1Config={{
                        isDisabled: true,
                      }}
                      defaultFetchCKBBalanceL2Config={{
                        isDisabled: true,
                      }}
                      defaultFetchL1SUDTBalancesConfig={{
                        isDisabled: true,
                      }}
                    >
                      <PendingLayer1TxnsProvider>
                        <WithdrawalRequestsProvider
                          defaultFetchWithdrawalRequestsConfig={{
                            isDisabled: true,
                          }}
                        >
                          <IntervalRefreshProvider
                            defaultMulticallRefreshInterval={10_000}
                            defaultTransactionRefreshInterval={10_000}
                          >
                            {children}
                          </IntervalRefreshProvider>
                        </WithdrawalRequestsProvider>
                      </PendingLayer1TxnsProvider>
                    </GodwokenBalancesProvider>
                  </GodwokenAccountProvider>
                </GodwokenBaseProvider>
              </TabVisibilityProvider>
            </ModalProvider>
          </ThemeContextProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  )
}

export default Providers
