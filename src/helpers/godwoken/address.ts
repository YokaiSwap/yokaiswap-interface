import { isAddress, getAddress } from '@ethersproject/address'
import { Script } from '@lay2/pw-core'

import { generateETHAccountLockScript } from './scripts'

export function ethEoaAddressToGodwokenShortAddress(ethAddress: string): string {
  if (!isAddress(ethAddress)) {
    throw new Error('invalid eth address')
  }

  const ethAccountLock = generateETHAccountLockScript(ethAddress)
  const ethAccountLockPW = new Script(ethAccountLock.code_hash, ethAccountLock.args, ethAccountLock.hash_type)
  const scriptHash = ethAccountLockPW.toHash()
  const shortAddress = scriptHash.slice(0, 42)
  return getAddress(shortAddress)
}
