import { GodwokenUtils } from 'godwoken'
import { BigInteger, zero } from 'big-integer'

import { Address, AddressType } from '@lay2/pw-core'
import { polyjuiceHttpProvider } from './providers'
import { polyjuiceConfig } from '../../config'
import { emptyScriptHash } from '../ckb'

export async function generateCKBWithdrawalData(fromETHAddr: string, toCKBAddr: string, amount: BigInteger) {
  return generateWithdrawalData({
    fromETHAddr,
    toCKBAddr,
    capacity: amount,
    amount: zero,
  })
}

export async function generateSUDTWithdrawalData(
  fromETHAddr: string,
  toCKBAddr: string,
  sudtScriptHash: string,
  amount: BigInteger
) {
  return generateWithdrawalData({
    fromETHAddr,
    toCKBAddr,
    capacity: zero,
    amount,
    sudtScriptHash,
  })
}

export async function generateWithdrawalData({
  fromETHAddr,
  toCKBAddr,
  capacity,
  amount,
  sudtScriptHash = emptyScriptHash,
  feeSudtId = 1,
  feeAmount = zero,
}: {
  fromETHAddr: string
  toCKBAddr: string
  capacity: BigInteger
  amount: BigInteger
  sudtScriptHash?: string
  feeSudtId?: number
  feeAmount?: BigInteger
}) {
  const accountScriptHash = polyjuiceHttpProvider.godwoker.computeScriptHashByEoaEthAddress(fromETHAddr)
  const accountId = await polyjuiceHttpProvider.godwoker.getAccountIdByEoaEthAddress(fromETHAddr)
  const nonce = await polyjuiceHttpProvider.godwoker.getNonce(Number(accountId))
  const ownerLockHash = addressToLockHash(toCKBAddr)

  const rawWithdrawalRequest = GodwokenUtils.createRawWithdrawalRequest(
    Number(nonce),
    BigInt(capacity.toString()),
    BigInt(amount.toString()),
    sudtScriptHash,
    accountScriptHash,
    BigInt(0),
    // ignored `sell_capacity`
    // https://github.com/nervosnetwork/godwoken/blob/80b784527687950b16554ce31949faaf89a54b8f/crates/block-producer/src/withdrawal.rs#L499
    BigInt(0),
    ownerLockHash,
    emptyScriptHash,
    {
      sudt_id: feeSudtId,
      amount: BigInt(feeAmount.toString()),
    }
  )

  const godwokenUtils = new GodwokenUtils(polyjuiceConfig.rollupTypeHash)
  return {
    messageToSign: godwokenUtils.generateWithdrawalMessageWithoutPrefixToSign(rawWithdrawalRequest),
    rawWithdrawalRequest,
  }
}

function addressToLockHash(address: string): string {
  return new Address(address, AddressType.ckb).toLockScript().toHash()
}
