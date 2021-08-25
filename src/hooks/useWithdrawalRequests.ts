import bigInt, { BigInteger } from 'big-integer'
import { useCallback } from 'react'
import { Amount, Cell, IndexerCell, Order, ScriptType, SearchKey } from '@lay2/pw-core'
import { core as godwokenCore } from 'godwoken'
import { Reader as CKBReader } from 'ckb-js-toolkit'

import { useIsTabVisible } from '../contexts/TabVisibilityContext'

import { usePWAddress } from './usePWAddress'
import { useFetchable, IFetchableConfig } from './useFetchable'

import { generateWithdrawalLockScript } from '../helpers/godwoken/scripts'
import { ckbIndexer } from '../helpers/ckb'
import { gwRollupTypeHash } from '../config'
import { indexerCellToPWCell } from '../helpers/godwoken/cell'

const withdrawalCellSearchParams: SearchKey = {
  script: generateWithdrawalLockScript(gwRollupTypeHash), // search with prefix,
  script_type: ScriptType.lock,
}

export interface IWithdrawalRequest {
  withdrawalBlockNumber: number
  sudtScriptHash: string
  capacity: BigInteger
  amount: BigInteger
  outPoint: string
  cell: Cell
}

export const emptyResult: IWithdrawalRequest[] = []

export function useWithdrawalRequests(ethAddr?: string | null, sizeLimit = 20, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()
  const address = usePWAddress(ethAddr)

  const fetchData: () => Promise<[IWithdrawalRequest[], false]> = useCallback(async () => {
    if (address == null) {
      throw new Error('trying to fetch withdrawal requests without address')
    }
    const ownerLockHash = address.toLockScript().toHash()

    let cellCount = 0
    const withdrawalCells = await ckbIndexer.getCells(
      withdrawalCellSearchParams,
      (_, cell) => {
        const withdrawalLockArgs = parseWithdrawalLockArgs(cell)
        if (withdrawalLockArgs == null) {
          return { stop: false, push: false }
        }

        const ownerLockHashFromArgs = new CKBReader(withdrawalLockArgs.getOwnerLockHash().raw()).serializeJson()

        const isOwnCell = ownerLockHashFromArgs === ownerLockHash
        if (isOwnCell) {
          cellCount++
        }
        return {
          stop: cellCount === sizeLimit,
          push: isOwnCell,
        }
      },
      { sizeLimit: 1000, order: Order.asc }
    )

    if (withdrawalCells.length === 0) {
      return [emptyResult, false]
    }

    const result: IWithdrawalRequest[] = []

    for (const cell of withdrawalCells) {
      const withdrawalLockArgs = parseWithdrawalLockArgs(cell)
      if (withdrawalLockArgs == null) {
        continue
      }

      const withdrawalBlockNumber = Number(withdrawalLockArgs.getWithdrawalBlockNumber().toLittleEndianBigUint64())
      const sudtScriptHash = new CKBReader(withdrawalLockArgs.getSudtScriptHash().raw()).serializeJson()
      const capacity = bigInt(cell.output.capacity)
      const amount = bigInt(Amount.fromUInt128LE(cell.output_data).toHexString().slice(2), 16)
      const outPoint = `${cell.out_point.tx_hash}-${Number(cell.out_point.index)}`
      result.push({
        withdrawalBlockNumber,
        sudtScriptHash,
        capacity,
        amount,
        outPoint,
        cell: indexerCellToPWCell(cell),
      })
    }

    return [result.sort((requestA, requestB) => requestA.withdrawalBlockNumber - requestB.withdrawalBlockNumber), false]
  }, [address, sizeLimit])

  return useFetchable(emptyResult, fetchData, {
    ...config,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || address == null,
  })
}

function parseWithdrawalLockArgs(cell: IndexerCell): godwokenCore.WithdrawalLockArgs | undefined {
  try {
    const rawLockArgs = cell.output.lock.args
    const rawLockArgsWithoutRollupTypeHash = `0x${rawLockArgs.slice(66)}`
    const lockArgs = new godwokenCore.WithdrawalLockArgs(new CKBReader(rawLockArgsWithoutRollupTypeHash))
    return lockArgs
  } catch (err) {
    console.warn('[warn] failed to parse withdrawal lock args', cell, err)
  }

  return void 0
}
