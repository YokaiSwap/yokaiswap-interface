import { Amount, ScriptType, SnakeScript } from '@lay2/pw-core'
import bigInt, { BigInteger, zero } from 'big-integer'
import { ckbSUDTScriptCodeHash, ckbSUDTScriptHashType } from 'config'
import { useIsTabVisible } from 'contexts/TabVisibilityContext'
import { useCallback } from 'react'
import { ckbIndexer } from '../helpers/ckb'
import { IFetchableConfig, useFetchable } from './useFetchable'
import { usePWAddress } from './usePWAddress'

export interface ILayer1SUDTBalances {
  [issuerLockHash: string]: BigInteger
}

const emptyResult: ILayer1SUDTBalances = {}

export function useL1SUDTBalances(ethAddress?: string | null, config?: IFetchableConfig) {
  const isTabVisible = useIsTabVisible()
  const address = usePWAddress(ethAddress)

  const fetchData = useCallback(async () => {
    if (address == null) {
      throw new Error('trying to fetch balances without address')
    }

    const ownerLockPW = address.toLockScript()
    const ownerLock: SnakeScript = {
      code_hash: ownerLockPW.codeHash,
      hash_type: ownerLockPW.hashType,
      args: ownerLockPW.args,
    }

    const sudtCells = await ckbIndexer.getCells(
      {
        script: ownerLock,
        script_type: ScriptType.lock,
        filter: {
          script: {
            code_hash: ckbSUDTScriptCodeHash,
            hash_type: ckbSUDTScriptHashType,
            args: '0x',
          },
        },
      },
      undefined,
      { sizeLimit: 1000 }
    )

    const result: ILayer1SUDTBalances = {}
    for (const cell of sudtCells) {
      const issuerLockHash = cell.output.type?.args
      if (issuerLockHash == null) {
        continue
      }

      try {
        const amount = bigInt(Amount.fromUInt128LE(cell.output_data).toHexString().slice(2), 16)
        result[issuerLockHash] = (result[issuerLockHash] ?? zero).add(amount)
      } catch (err) {
        console.warn('Failed to parse sudt cell amount', err)
      }
    }

    return result
  }, [address])

  return useFetchable(emptyResult, fetchData, {
    ...config,
    shouldRefresh: config?.shouldRefresh ?? true,
    refreshInterval: config?.refreshInterval ?? 10000,
    shouldRetry: config?.shouldRetry ?? true,
    isDisabled: (config?.isDisabled ?? !isTabVisible) || address == null,
  })
}
