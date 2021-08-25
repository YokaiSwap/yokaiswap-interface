import PWCore, { Address } from '@lay2/pw-core'
import { createContext } from 'react'
import { zero, BigInteger } from 'big-integer'

import type { ILayer1SUDTBalances } from 'hooks/useL1SUDTBalances'
import { IFetchableConfig, IFetchableResult } from '../../hooks/useFetchable'

export interface IGodwokenBaseContext {
  pwCore?: PWCore | null
}

export const GodwokenBaseContext = createContext<IGodwokenBaseContext>({})

export interface IGodwokenAccountContext {
  pwAddress?: Address | null
  ckbAddress?: string | null
  godwokenAddress?: string | null
}

export const GodwokenAccountContext = createContext<IGodwokenAccountContext>({})

export interface IGodwokenBalancesContext {
  ckbBalanceL1: IFetchableResult<BigInteger>
  ckbBalanceL2: IFetchableResult<BigInteger>
  l1SUDTBalances: IFetchableResult<ILayer1SUDTBalances>
  setFetchCKBBalanceL1Config: React.Dispatch<React.SetStateAction<IFetchableConfig | undefined>>
  setFetchCKBBalanceL2Config: React.Dispatch<React.SetStateAction<IFetchableConfig | undefined>>
  setFetchL1SUDTBalancesConfig: React.Dispatch<React.SetStateAction<IFetchableConfig | undefined>>
}

const defaultBalance: IFetchableResult<BigInteger> = {
  data: zero,
  isFetching: false,
  hasBeenFetched: false,
  retryCount: 0,
}

const defaultBalances: IFetchableResult<ILayer1SUDTBalances> = {
  data: {},
  isFetching: false,
  hasBeenFetched: false,
  retryCount: 0,
}

export const GodwokenBalancesContext = createContext<IGodwokenBalancesContext>({
  ckbBalanceL1: defaultBalance,
  ckbBalanceL2: defaultBalance,
  l1SUDTBalances: defaultBalances,
  setFetchCKBBalanceL1Config: () => void 0,
  setFetchCKBBalanceL2Config: () => void 0,
  setFetchL1SUDTBalancesConfig: () => void 0,
})
