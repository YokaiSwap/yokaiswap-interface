import { Currency } from '@yokaiswap/sdk'
import { emptyScriptHash } from './ckb'

export class SUDTCurrency extends Currency {
  public constructor(
    public readonly issuerLockHash: string,
    public readonly address?: string,
    decimals = 18,
    symbol?: string,
    name?: string
  ) {
    super(decimals, symbol, name)
  }
}

const { ETHER } = Currency
export const CKB_SUDT = new SUDTCurrency(emptyScriptHash, undefined, ETHER.decimals, ETHER.symbol, ETHER.name)
