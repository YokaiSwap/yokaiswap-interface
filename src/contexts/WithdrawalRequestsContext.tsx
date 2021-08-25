import { useActiveWeb3React } from 'hooks'
import { IFetchableConfig } from 'hooks/useFetchable'
import { emptyResult, useWithdrawalRequests } from 'hooks/useWithdrawalRequests'
import React, { createContext, PropsWithChildren, useMemo, useState } from 'react'

export type TWithdrawalReqeustsFetchResult = ReturnType<typeof useWithdrawalRequests>

export interface TWithdrawalReqeustsContext {
  withdrawalRequests: TWithdrawalReqeustsFetchResult
  setFetchWithdrawalRequestsConfig: React.Dispatch<React.SetStateAction<IFetchableConfig | undefined>>
  setSizeLimit: React.Dispatch<React.SetStateAction<number>>
}

const emptyContext: TWithdrawalReqeustsContext = {
  withdrawalRequests: {
    data: emptyResult,
    isFetching: false,
    hasBeenFetched: false,
    retryCount: 0,
  },
  setFetchWithdrawalRequestsConfig: () => void 0,
  setSizeLimit: () => void 0,
}

export const WithdrawalRequestsContext = createContext<TWithdrawalReqeustsContext>(emptyContext)

export type TWithdrawalRequestsProviderProps = {
  defaultSizeLimit?: number
  defaultFetchWithdrawalRequestsConfig?: IFetchableConfig
}

export function WithdrawalRequestsProvider({
  defaultSizeLimit = 1000,
  defaultFetchWithdrawalRequestsConfig,
  children,
}: PropsWithChildren<TWithdrawalRequestsProviderProps>) {
  const { account: ethAddress } = useActiveWeb3React()

  const [fetchWithdrawalRequestsConfig, setFetchWithdrawalRequestsConfig] = useState<IFetchableConfig | undefined>(
    defaultFetchWithdrawalRequestsConfig
  )

  const [sizeLimit, setSizeLimit] = useState(defaultSizeLimit)

  const withdrawalRequests = useWithdrawalRequests(ethAddress, sizeLimit, fetchWithdrawalRequestsConfig)

  return (
    <WithdrawalRequestsContext.Provider
      value={useMemo(
        () => ({
          withdrawalRequests,
          setFetchWithdrawalRequestsConfig,
          setSizeLimit,
        }),
        [withdrawalRequests]
      )}
    >
      {children}
    </WithdrawalRequestsContext.Provider>
  )
}
