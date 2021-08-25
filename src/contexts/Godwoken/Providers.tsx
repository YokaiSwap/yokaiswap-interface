import React, { PropsWithChildren, useMemo, useState } from 'react'

import { GodwokenAccountContext, GodwokenBalancesContext, GodwokenBaseContext } from './contexts'

import { useActiveWeb3React } from '../../hooks'
import { usePWCore } from '../../hooks/usePWCore'
import { IFetchableConfig } from '../../hooks/useFetchable'
import { usePWAddress } from '../../hooks/usePWAddress'
import { useGodwokenAddress } from '../../hooks/useGodwokenAddress'
import { useCKBBalanceL1 } from '../../hooks/useCKBBalanceL1'
import { useCKBBalanceL2 } from '../../hooks/useCKBBalanceL2'
import { useL1SUDTBalances } from '../../hooks/useL1SUDTBalances'

export function GodwokenBaseProvider({ children }: PropsWithChildren<unknown>) {
  const pwCore = usePWCore()

  return (
    <GodwokenBaseContext.Provider value={useMemo(() => ({ pwCore }), [pwCore])}>
      {children}
    </GodwokenBaseContext.Provider>
  )
}

export function GodwokenAccountProvider({ children }: PropsWithChildren<unknown>) {
  const { account: ethAddress } = useActiveWeb3React()
  const pwAddress = usePWAddress(ethAddress)
  const ckbAddress = useMemo(() => pwAddress?.toCKBAddress(), [pwAddress])
  const godwokenAddress = useGodwokenAddress(ethAddress)

  return (
    <GodwokenAccountContext.Provider
      value={useMemo(
        () => ({
          pwAddress,
          ckbAddress,
          godwokenAddress,
        }),
        [pwAddress, ckbAddress, godwokenAddress]
      )}
    >
      {children}
    </GodwokenAccountContext.Provider>
  )
}

export interface IGodwokenBalancesProviderProps {
  defaultFetchCKBBalanceL1Config?: IFetchableConfig
  defaultFetchCKBBalanceL2Config?: IFetchableConfig
  defaultFetchL1SUDTBalancesConfig?: IFetchableConfig
}

export function GodwokenBalancesProvider({
  defaultFetchCKBBalanceL1Config,
  defaultFetchCKBBalanceL2Config,
  defaultFetchL1SUDTBalancesConfig,
  children,
}: PropsWithChildren<IGodwokenBalancesProviderProps>) {
  const { account: ethAddress } = useActiveWeb3React()

  const [fetchCKBBalanceL1Config, setFetchCKBBalanceL1Config] = useState<IFetchableConfig | undefined>(
    defaultFetchCKBBalanceL1Config
  )
  const ckbBalanceL1 = useCKBBalanceL1(ethAddress, fetchCKBBalanceL1Config)

  const [fetchCKBBalanceL2Config, setFetchCKBBalanceL2Config] = useState<IFetchableConfig | undefined>(
    defaultFetchCKBBalanceL2Config
  )
  const ckbBalanceL2 = useCKBBalanceL2(ethAddress, fetchCKBBalanceL2Config)

  const [fetchL1SUDTBalancesConfig, setFetchL1SUDTBalancesConfig] = useState<IFetchableConfig | undefined>(
    defaultFetchL1SUDTBalancesConfig
  )
  const l1SUDTBalances = useL1SUDTBalances(ethAddress, fetchL1SUDTBalancesConfig)

  return (
    <GodwokenBalancesContext.Provider
      value={useMemo(
        () => ({
          ckbBalanceL1,
          ckbBalanceL2,
          l1SUDTBalances,
          setFetchCKBBalanceL1Config,
          setFetchCKBBalanceL2Config,
          setFetchL1SUDTBalancesConfig,
        }),
        [ckbBalanceL1, ckbBalanceL2, l1SUDTBalances]
      )}
    >
      {children}
    </GodwokenBalancesContext.Provider>
  )
}
