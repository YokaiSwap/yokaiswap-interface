import { ethers } from 'ethers'
import { BigInteger } from 'big-integer'

export const getDisplayAmount = (balance: ethers.BigNumber | BigInteger, decimals = 18) => {
  const valueStr = balance.toString()
  if (decimals === 0) {
    return valueStr
  }

  const intPart = valueStr.slice(0, -decimals) || '0'
  const unit = intPart === '0' ? 1e8 : 1e4
  let decPart = valueStr
    .slice(-decimals)
    .padStart(decimals, '0')
    .slice(0, intPart === '0' ? 9 : 5)
  decPart = (Math.round(Number(`0.${decPart}`) * unit) / unit)
    .toFixed(intPart === '0' ? 8 : 4)
    .replace(/(\d)0+$/, '$1')
    .slice(2)

  return `${intPart}${decPart === '0' ? '' : `.${decPart}`}`
}

export const getFullDisplayAmount = (value: ethers.BigNumber | BigInteger, decimals = 18) => {
  const valueStr = value.toString()
  if (decimals === 0) {
    return valueStr
  }

  const intPart = valueStr.slice(0, -decimals) || '0'
  const decPart = valueStr
    .slice(-decimals)
    .padStart(decimals, '0')
    .replace(/(\d)0+$/, '$1')
  return `${intPart}${decPart === '0' ? '' : `.${decPart}`}`
}
