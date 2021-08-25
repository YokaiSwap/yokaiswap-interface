import { useCallback } from 'react'
import { Cell, ScriptType, SearchKey } from '@lay2/pw-core'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { useFetchable, IFetchableConfig } from './useFetchable'

import { rollupScript } from '../helpers/godwoken/scripts'
import { ckbIndexer } from '../helpers/ckb'
import { emptyCell, indexerCellToPWCell } from '../helpers/godwoken/cell'

const rollupCellSearchParams: SearchKey = {
  script: rollupScript,
  script_type: ScriptType.type,
}

export interface IRollupGlobalState {
  lastFinalizedBlockNumber: number
}

const initialState = emptyCell

export async function fetchRollupCell() {
  const rollupCells = await ckbIndexer.getCells(rollupCellSearchParams)
  if (rollupCells.length === 0) {
    return null
  }

  return indexerCellToPWCell(rollupCells[rollupCells.length - 1])
}

export function useRollupCell(config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()

  const fetchData: () => Promise<[Cell, boolean]> = useCallback(async () => {
    const rollupCell = await fetchRollupCell()
    if (rollupCell === null) {
      console.warn('[warn] can not find rollup cell')
      return [initialState, true]
    }

    return [rollupCell, false]
  }, [])

  return useFetchable(initialState, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    refreshInterval: config?.refreshInterval ?? 20000,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: config?.isDisabled ?? !isTabVisible,
  })
}
