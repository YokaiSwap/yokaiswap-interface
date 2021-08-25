import React, { useState, useMemo } from 'react'
import { useIntervalRefreshFactor } from 'hooks/useIntervalRefreshFactor'

interface IIntervalRefreshContext {
  multicallRefreshFactor: number
  refreshMulticall: () => void
  setMulticallRefreshInterval: React.Dispatch<React.SetStateAction<number | undefined>>
  transactionRefreshFactor: number
  refreshTransaction: () => void
  setTransactionRefreshInterval: React.Dispatch<React.SetStateAction<number | undefined>>
}

export const IntervalRefreshContext = React.createContext<IIntervalRefreshContext>({
  multicallRefreshFactor: 0,
  refreshMulticall: () => void 0,
  setMulticallRefreshInterval: () => void 0,
  transactionRefreshFactor: 0,
  refreshTransaction: () => void 0,
  setTransactionRefreshInterval: () => void 0,
})

export interface IIntervalRefreshProviderProps {
  defaultMulticallRefreshInterval?: number
  defaultTransactionRefreshInterval?: number
}

export function IntervalRefreshProvider({
  children,
  defaultMulticallRefreshInterval,
  defaultTransactionRefreshInterval,
}: React.PropsWithChildren<IIntervalRefreshProviderProps>) {
  const [multicallRefreshInterval, setMulticallRefreshInterval] = useState(defaultMulticallRefreshInterval)
  const { refreshFactor: multicallRefreshFactor, forceRefresh: refreshMulticall } =
    useIntervalRefreshFactor(multicallRefreshInterval)

  const [transactionRefreshInterval, setTransactionRefreshInterval] = useState(defaultTransactionRefreshInterval)
  const { refreshFactor: transactionRefreshFactor, forceRefresh: refreshTransaction } =
    useIntervalRefreshFactor(transactionRefreshInterval)

  return (
    <IntervalRefreshContext.Provider
      value={useMemo(
        () => ({
          multicallRefreshFactor,
          refreshMulticall,
          setMulticallRefreshInterval,
          transactionRefreshFactor,
          refreshTransaction,
          setTransactionRefreshInterval,
        }),
        [multicallRefreshFactor, refreshMulticall, refreshTransaction, transactionRefreshFactor]
      )}
    >
      {children}
    </IntervalRefreshContext.Provider>
  )
}
