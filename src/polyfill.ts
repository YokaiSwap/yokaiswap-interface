/* eslint-disable */
import JSBI from 'jsbi'

const useNativeBigIntsIfAvailable = true
if (useNativeBigIntsIfAvailable && (JSBI as any).useNativeBigIntsIfAvailable != null) {
  ;(JSBI as any).useNativeBigIntsIfAvailable()
}
const { BigInt } = JSBI

;(DataView.prototype as any)._setBigUint64 = DataView.prototype.setBigUint64
DataView.prototype.setBigUint64 = function (byteOffset, value, littleEndian) {
  if (typeof value === 'bigint' && typeof (this as any)._setBigUint64 !== 'undefined') {
    // the original native implementation for bigint
    ;(this as any)._setBigUint64(byteOffset, value, littleEndian)
  } else if (
    value.constructor === JSBI &&
    typeof (value as any).sign === 'bigint' &&
    typeof (this as any)._setBigUint64 !== 'undefined'
  ) {
    // JSBI wrapping a native bigint
    ;(this as any)._setBigUint64(byteOffset, (value as any).sign, littleEndian)
  } else if (value.constructor === JSBI) {
    // JSBI polyfill implementation
    const lowWord = value[0]
    let highWord = 0
    if ((value as any).length >= 2) {
      highWord = value[1]
    }
    this.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian)
    this.setUint32(littleEndian ? 4 : 0, highWord, littleEndian)
  } else {
    throw TypeError('Value needs to be BigInt ot JSBI')
  }
}
;(DataView.prototype as any)._getBigUint64 = DataView.prototype.getBigUint64
DataView.prototype.getBigUint64 = function (byteOffset, littleEndian) {
  if (typeof (this as any)._getBigUint64 !== 'undefined') {
    return (this as any)._getBigUint64(byteOffset, littleEndian)
  }
  if (typeof (this as any)._setBigUint64 !== 'undefined' && useNativeBigIntsIfAvailable) {
    return BigInt((this as any)._getBigUint64(byteOffset, littleEndian)) as any as bigint
  }
  let lowWord = 0
  let highWord = 0
  lowWord = this.getUint32(littleEndian ? 0 : 4, littleEndian)
  highWord = this.getUint32(littleEndian ? 4 : 0, littleEndian)
  const result = new JSBI(2, false)
  ;(result as any).__setDigit(0, lowWord)
  ;(result as any).__setDigit(1, highWord)
  return result as any as bigint
}
