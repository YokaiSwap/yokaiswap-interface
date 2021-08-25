import { IStablePool, stablePools } from 'constants/stablePools'
import { BigNumber, Contract } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { TokenAmount } from '@yokaiswap/sdk'
import { useEffect, useMemo, useState } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'

export function useStablePools(): Readonly<IStablePool[]> {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId) return []
    return stablePools[chainId]
  }, [chainId])
}

export function useStablePool(poolAddress?: string): IStablePool | null | undefined {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId || poolAddress == null) {
      return null
    }
    return stablePools[chainId].find((pool) => pool.address === poolAddress)
  }, [chainId, poolAddress])
}

export function useStablePoolWithdrawAmounts(
  pool: IStablePool | null | undefined,
  contract: Contract | null,
  liquidityAmount: TokenAmount | undefined
): TokenAmount[] {
  const tokens = pool?.tokens
  const [withdrawAmounts, setWithdrawAmounts] = useState<BigNumber[]>([])
  // for refreshing
  const virtualPrice = useSingleCallResult(
    liquidityAmount?.equalTo('0') ?? true ? undefined : contract,
    'get_virtual_price'
  )?.result?.[0]

  const liquidityAmountString = liquidityAmount?.raw.toString()
  useEffect(() => {
    let cancelled = false
    const cachedContract = contract
    const cachedTokens = tokens
    if (liquidityAmountString == null || cachedContract == null || cachedTokens == null) {
      setWithdrawAmounts([])

      return () => {
        cancelled = true
      }
    }

    async function run() {
      const result: BigNumber[] = await cachedContract?.callStatic.remove_liquidity(
        liquidityAmountString,
        cachedTokens?.map(() => 0)
      )
      if (cancelled || result == null) {
        return
      }

      setWithdrawAmounts(result)
    }

    run()

    return undefined
  }, [liquidityAmountString, contract, tokens, virtualPrice])

  return useMemo(
    () => (tokens == null ? [] : withdrawAmounts.map((amount, i) => new TokenAmount(tokens[i], amount.toString()))),
    [withdrawAmounts, tokens]
  )
}

export function useStablePoolSingleWithdrawAmount(
  pool: IStablePool | null | undefined,
  contract: Contract | null,
  liquidityAmount: TokenAmount | undefined,
  tokenIndex?: number
): TokenAmount | undefined {
  const tokens = pool?.tokens
  const isInvalid = liquidityAmount == null || tokens == null || tokenIndex == null
  const withdrawAmount: BigNumber | undefined = useSingleCallResult(
    isInvalid ? undefined : contract,
    'calc_withdraw_one_coin',
    [liquidityAmount?.raw.toString() ?? '0', tokenIndex]
  )?.result?.[0]

  if (liquidityAmount == null || tokens == null || tokenIndex == null || withdrawAmount == null) {
    return undefined
  }

  return new TokenAmount(tokens[tokenIndex], withdrawAmount.toString())
}
