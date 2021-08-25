import { Address, AddressType, Script, SnakeScript } from '@lay2/pw-core'
import { Reader as CKBReader } from 'ckb-js-toolkit'
import { core as godwokenCore, normalizer as godwokenNormalizer } from 'godwoken'

import { gwRollupTypeHash } from '../../config'
import { generateDepositLockScript, generateETHAccountLockScript } from './scripts'

export function ethAddrToDepositAddr(ethAddr: string): Address {
  const pwETHAddr = new Address(ethAddr, AddressType.eth)
  const ownerLockHash = pwETHAddr.toLockScript().toHash()

  const ethAccountLock = generateETHAccountLockScript(ethAddr)

  const depositLockArgs = getDepositLockArgs(ownerLockHash, ethAccountLock)
  const serializedArgs = serializeArgs(depositLockArgs)
  const depositLock = generateDepositLockScript(serializedArgs)

  const depositLockPW = new Script(depositLock.code_hash, depositLock.args, depositLock.hash_type)

  return depositLockPW.toAddress()
}

interface DepositLockArgs {
  owner_lock_hash: string
  layer2_lock: SnakeScript
  cancel_timeout: string
}

function getDepositLockArgs(
  ownerLockHash: string,
  layer2_lock: SnakeScript,
  cancelTimeout = '0xc00000000002a300'
): DepositLockArgs {
  const depositLockArgs: DepositLockArgs = {
    owner_lock_hash: ownerLockHash,
    layer2_lock,
    cancel_timeout: cancelTimeout, // relative timestamp, 2 days
  }
  return depositLockArgs
}

function serializeArgs(args: DepositLockArgs): string {
  const serializedDepositLockArgs: ArrayBuffer = godwokenCore.SerializeDepositLockArgs(
    godwokenNormalizer.NormalizeDepositLockArgs(args)
  )

  const depositLockArgsStr = new CKBReader(serializedDepositLockArgs).serializeJson()

  return `${gwRollupTypeHash}${depositLockArgsStr.slice(2)}`
}
