import { CurrencyAmount } from '@yokaiswap/sdk'
import bigInt, { BigInteger } from 'big-integer'

export function currencyAmountToBigInt(amount: CurrencyAmount | undefined): BigInteger | undefined {
  if (amount == null) {
    return amount
  }

  return bigInt(amount.raw.toString())
}
