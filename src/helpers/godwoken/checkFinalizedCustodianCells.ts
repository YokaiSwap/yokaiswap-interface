import { Amount, IndexerCell, ScriptType, SearchKey, SUDT, Script } from '@lay2/pw-core'
import bigInt, { BigInteger, zero } from 'big-integer'
import { Reader as CKBReader } from 'ckb-js-toolkit'
import { core as godwokenCore } from 'godwoken'

import { ckbIndexer } from '../ckb'
import { custodianLock } from './scripts'

export interface ISUDTWithdrawalAmount {
  type: SUDT
  amount: BigInteger
}

export interface IWithdrawalAmount {
  ckb: BigInteger
  sudt?: ISUDTWithdrawalAmount
}

export interface ICheckFinalizedCustodianCellsResult {
  hasEnoughCKB: boolean
  hasEnoughSUDT: boolean
  collectedCKB: BigInteger
  collectedSUDT: BigInteger
}

export const emptyResult: ICheckFinalizedCustodianCellsResult = {
  hasEnoughCKB: false,
  hasEnoughSUDT: false,
  collectedCKB: zero,
  collectedSUDT: zero,
}

const custodianCellSearchParams: SearchKey = {
  script: custodianLock,
  script_type: ScriptType.lock,
}

export async function checkFinalizedCustodianCells(
  neededWithdrawalAmount: IWithdrawalAmount,
  lastFinalizedBlockNumber: number
): Promise<ICheckFinalizedCustodianCellsResult> {
  let collectedCKB = zero
  let collectedSUDT = zero
  const { sudt } = neededWithdrawalAmount

  const neededCapacity = neededWithdrawalAmount.ckb
  const isCKBOnly = sudt == null

  const sudtType = sudt?.type.toTypeScript()
  const neededSUDTAmount = sudt?.amount ?? zero

  const continueSearching = { stop: false, push: false }

  let hasEnoughSUDT = collectedSUDT.eq(neededSUDTAmount)
  let hasEnoughCKB = collectedCKB.eq(neededCapacity)
  await ckbIndexer.getCells(
    custodianCellSearchParams,
    (_, cell) => {
      const custodianLockArgs = parseCustodianLockArgs(cell)
      if (custodianLockArgs == null) {
        return continueSearching
      }

      const depositBlockNumber = custodianLockArgs.getDepositBlockNumber().toLittleEndianBigUint64()
      if (Number(depositBlockNumber) > lastFinalizedBlockNumber) {
        return continueSearching
      }

      // collect sudt
      if (!isCKBOnly && !hasEnoughSUDT) {
        collectedSUDT = collectedSUDT.add(getSUDTAmount(cell, sudtType!))
        hasEnoughSUDT = collectedSUDT.greaterOrEquals(neededSUDTAmount)
      }

      // collect ckb
      collectedCKB = collectedCKB.add(bigInt(cell.output.capacity))
      hasEnoughCKB = collectedCKB.greaterOrEquals(neededCapacity)

      if (hasEnoughSUDT && hasEnoughCKB) {
        return { stop: true, push: false }
      }

      return continueSearching
    },
    { sizeLimit: 1000 }
  )

  return {
    hasEnoughCKB,
    hasEnoughSUDT,
    collectedCKB,
    collectedSUDT,
  }
}

function parseCustodianLockArgs(cell: IndexerCell): godwokenCore.CustodianLockArgs | undefined {
  try {
    const rawlockArgs = cell.output.lock.args
    const rawlockArgsWithoutRollupTypeHash = `0x${rawlockArgs.slice(66)}`
    const lockArgs = new godwokenCore.CustodianLockArgs(new CKBReader(rawlockArgsWithoutRollupTypeHash))
    return lockArgs
  } catch (err) {
    console.warn('[warn] failed to parse custodian lock args', cell, err)
  }

  return undefined
}

function getSUDTAmount(cell: IndexerCell, sudtType: Script) {
  const outputType = cell.output.type
  if (
    outputType == null ||
    outputType.code_hash !== sudtType.codeHash ||
    outputType.hash_type !== sudtType.hashType ||
    outputType.args !== sudtType.args
  ) {
    return zero
  }

  const amount = bigInt(Amount.fromUInt128LE(cell.output_data).toHexString().slice(2), 16)

  return amount
}
