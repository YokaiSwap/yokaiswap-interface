import { AmountUnit } from '@lay2/pw-core'
import bigInt, { zero } from 'big-integer'
import { ILayer1TxHistory, Layer1TxType } from 'hooks/useLayer1TxHistory'
import { useMemo } from 'react'
import { getDisplayAmount } from '../helpers/formatTokenAmount'

export function useLayer1TxSummary({ capacity, amount, symbol, decimals, type }: ILayer1TxHistory) {
  const capacityBI = useMemo(() => bigInt(capacity), [capacity])
  const amountBI = useMemo(() => bigInt(amount), [amount])

  const hasSUDT = useMemo(() => amountBI.gt(zero), [amountBI])
  const hasCKB = useMemo(() => capacityBI.gt(zero), [capacityBI])

  return useMemo(() => {
    const sudtAmount = `${getDisplayAmount(amountBI, decimals)} ${symbol}`
    const ckbAmount = `${getDisplayAmount(capacityBI, AmountUnit.ckb)} CKB`
    const assets = hasSUDT && hasCKB ? `${sudtAmount} and ${ckbAmount}` : hasSUDT ? sudtAmount : ckbAmount
    switch (type) {
      case Layer1TxType.deposit: {
        return `Deposit ${assets}`
      }
      case Layer1TxType.withdrawal: {
        // return `Withdraw ${assets}${recipient == null ? '' : ` to ${recipient}`}`
        return `Withdraw ${assets}`
      }
      case Layer1TxType.transfer: {
        // return `Transfer ${assets}${recipient == null ? '' : ` to ${recipient}`}`
        return `Transfer ${assets}`
      }
      default: {
        throw new Error('unexpected tx type')
      }
    }
  }, [amountBI, decimals, symbol, capacityBI, hasSUDT, hasCKB, type])
}
