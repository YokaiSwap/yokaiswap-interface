import { Token, TokenAmount } from '@yokaiswap/sdk'
import { BigInteger, zero } from 'big-integer'
import { GodwokenBalancesContext } from 'contexts/Godwoken/contexts'
import { SUDTTokenOrCurrency } from 'hooks/useSUDTCurrenciesWithBalance'
import { useContext, useMemo } from 'react'
import { useAllTokenBalances } from '../../state/wallet/hooks'

// compare two token amounts with highest one coming first
function balanceComparator(balanceA?: TokenAmount, balanceB?: TokenAmount) {
  if (balanceA && balanceB) {
    return balanceA.greaterThan(balanceB) ? -1 : balanceA.equalTo(balanceB) ? 0 : 1
  }
  if (balanceA && balanceA.greaterThan('0')) {
    return -1
  }
  if (balanceB && balanceB.greaterThan('0')) {
    return 1
  }
  return 0
}

function getTokenComparator(balances: {
  [tokenAddress: string]: TokenAmount | undefined
}): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[tokenA.address]
    const balanceB = balances[tokenB.address]

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if (tokenA.symbol && tokenB.symbol) {
      // sort by symbol
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
    }
    return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0
  }
}

// compare two token amounts with highest one coming first
function balanceBIComparator(balanceA?: BigInteger, balanceB?: BigInteger) {
  if (balanceA && balanceB) {
    return balanceA.gt(balanceB) ? -1 : balanceA.eq(balanceB) ? 0 : 1
  }
  if (balanceA && balanceA.gt(zero)) {
    return -1
  }
  if (balanceB && balanceB.gt(zero)) {
    return 1
  }
  return 0
}

export function useTokenComparator(inverted: boolean): (tokenA: Token, tokenB: Token) => number {
  const balances = useAllTokenBalances()
  const comparator = useMemo(() => getTokenComparator(balances ?? {}), [balances])
  return useMemo(() => {
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    }
    return comparator
  }, [inverted, comparator])
}

function getL1TokenComparator(balances: {
  [issuerLockHash: string]: BigInteger | undefined
}): (tokenA: SUDTTokenOrCurrency, tokenB: SUDTTokenOrCurrency) => number {
  return function sortTokens(tokenA: SUDTTokenOrCurrency, tokenB: SUDTTokenOrCurrency): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[tokenA.issuerLockHash]
    const balanceB = balances[tokenB.issuerLockHash]

    const balanceComp = balanceBIComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if (tokenA.symbol && tokenB.symbol) {
      // sort by symbol
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
    }
    return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0
  }
}

export function useL1TokenComparator(
  inverted: boolean
): (tokenA: SUDTTokenOrCurrency, tokenB: SUDTTokenOrCurrency) => number {
  const {
    l1SUDTBalances: { data: l1SUDTBalances },
  } = useContext(GodwokenBalancesContext)
  const comparator = useMemo(() => getL1TokenComparator(l1SUDTBalances ?? {}), [l1SUDTBalances])
  return useMemo(() => {
    if (inverted) {
      return (tokenA: SUDTTokenOrCurrency, tokenB: SUDTTokenOrCurrency) => comparator(tokenA, tokenB) * -1
    }
    return comparator
  }, [inverted, comparator])
}

export default useTokenComparator
