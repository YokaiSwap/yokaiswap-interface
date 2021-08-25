import { CellDep, HashType, OutPoint, Script, SnakeScript, SUDT } from '@lay2/pw-core'
import {
  gwDepositLockCodeHash,
  gwPolyjuiceETHAccountLockCodeHash,
  gwRollupTypeHash,
  gwRollupScriptCodeHash,
  gwRollupScriptHashType,
  gwRollupScriptArgs,
  gwWithdrawalLockCodeHash,
  gwWithdrawalLockCellDepOutPointTxHash,
  gwWithdrawalLockCellDepOutPointIndex,
  gwWithdrawalLockCellDepDepType,
  gwSUDTScriptCodeHash,
  gwSUDTScriptHashType,
  ckbSUDTScriptCodeHash,
  ckbSUDTScriptHashType,
  gwCustodianScriptCodeHash,
  gwCustodianScriptHashType,
} from '../../config'

export function generateETHAccountLockScript(ethAddr: string): SnakeScript {
  return {
    code_hash: gwPolyjuiceETHAccountLockCodeHash,
    hash_type: HashType.type,
    args: `${gwRollupTypeHash}${ethAddr.toLowerCase().slice(2)}`,
  }
}

export function generateDepositLockScript(args: string): SnakeScript {
  return {
    code_hash: gwDepositLockCodeHash,
    hash_type: HashType.type,
    args,
  }
}

export function generateWithdrawalLockScript(args: string): SnakeScript {
  return {
    code_hash: gwWithdrawalLockCodeHash,
    hash_type: HashType.type,
    args,
  }
}

export const rollupScript: SnakeScript = {
  code_hash: gwRollupScriptCodeHash,
  hash_type: gwRollupScriptHashType,
  args: gwRollupScriptArgs,
}

export const withdrawalLockDep: CellDep = new CellDep(
  gwWithdrawalLockCellDepDepType,
  new OutPoint(gwWithdrawalLockCellDepOutPointTxHash, gwWithdrawalLockCellDepOutPointIndex)
)

export function generateLayer1SUDTTypeHash(sudt: SUDT) {
  return new Script(ckbSUDTScriptCodeHash, sudt.issuerLockHash, ckbSUDTScriptHashType).toHash()
}

export function generateLayer2SUDTTypeScript(sudtScriptHash: string): SnakeScript {
  return {
    code_hash: gwSUDTScriptCodeHash,
    hash_type: gwSUDTScriptHashType,
    args: `${gwRollupTypeHash}${sudtScriptHash.slice(2)}`,
  }
}

export const custodianLock: SnakeScript = {
  code_hash: gwCustodianScriptCodeHash,
  hash_type: gwCustodianScriptHashType,
  args: gwRollupTypeHash,
}
