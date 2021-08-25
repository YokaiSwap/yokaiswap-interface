import bigInt, { BigInteger } from 'big-integer'
import { parseUnits } from '@ethersproject/units'

export function tryParseAmount(value?: string, decimals?: number): BigInteger | undefined {
  if (value == null || value === '' || decimals == null) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, decimals).toString()
    if (typedValueParsed !== '0') {
      return bigInt(typedValueParsed)
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    if (!error?.message?.includes('fractional component exceeds decimals')) {
      console.info(`Failed to parse input amount: "${value}"`, error)
    }
  }
  // necessary for all paths to return a value
  return undefined
}
