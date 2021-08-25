import { useMemo } from 'react'
import { core as godwokenCore } from 'godwoken'
import { Reader as CKBReader } from 'ckb-js-toolkit'

import { useRollupCell } from './useRollupCell'
import { IFetchableConfig } from './useFetchable'

import { emptyCell } from '../helpers/godwoken/cell'

export interface IRollupGlobalState {
  lastFinalizedBlockNumber: number
}

const initialState: IRollupGlobalState = {
  lastFinalizedBlockNumber: 0,
}

export function useRollupGlobalState(config?: IFetchableConfig) {
  const { data: rollupCell, hasBeenFetched, isFetching, retryCount, error } = useRollupCell(config)
  const data: IRollupGlobalState = useMemo(() => {
    if (rollupCell === emptyCell) {
      return initialState
    }

    try {
      const globalState = new godwokenCore.GlobalState(new CKBReader(rollupCell.getHexData()))
      const lastFinalizedBlockNumber = Number(globalState.getLastFinalizedBlockNumber().toLittleEndianBigUint64())

      return { lastFinalizedBlockNumber }
    } catch (err) {
      console.warn('[warn] failed to parse rollup global state', rollupCell, err)
    }

    return initialState
  }, [rollupCell])

  return useMemo(
    () => ({
      data,
      isFetching,
      hasBeenFetched,
      retryCount,
      error,
    }),
    [data, isFetching, hasBeenFetched, retryCount, error]
  )
}
