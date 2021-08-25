import { zero } from 'big-integer'
import { sudtETHAddressByIssuerLockHashByChain } from 'constants/sudt'
import { GodwokenBalancesContext } from 'contexts/Godwoken/contexts'
import { emptyScriptHash } from 'helpers/ckb'
import { useActiveWeb3React } from 'hooks'
import { useContext, useMemo } from 'react'
import { ETHER } from '@yokaiswap/sdk'
import { constants as ethersConstants } from 'ethers'
import { ellipseString } from 'helpers/ellipseString'
import { useAllTokens } from './Tokens'

const emptyObject = {}

export function useSUDTCurrency(issuerLockHash?: string | null) {
  const {
    ckbBalanceL1: { data: ckbBalanceL1, hasBeenFetched: hasL1CKBBalanceBeenFetched },
    l1SUDTBalances: { data: l1SUDTBalances, hasBeenFetched: hasL1SUDTBalancesBeenFetched },
  } = useContext(GodwokenBalancesContext)

  const isCKB = useMemo(() => issuerLockHash === emptyScriptHash, [issuerLockHash])

  const balance = useMemo(() => {
    if (issuerLockHash == null) {
      return zero
    }

    if (isCKB) {
      return ckbBalanceL1
    }

    return l1SUDTBalances[issuerLockHash] ?? zero
  }, [ckbBalanceL1, l1SUDTBalances, issuerLockHash, isCKB])

  const hasBalanceBeenFetched = useMemo(
    () => (isCKB ? hasL1CKBBalanceBeenFetched : hasL1SUDTBalancesBeenFetched),
    [isCKB, hasL1CKBBalanceBeenFetched, hasL1SUDTBalancesBeenFetched]
  )

  const allTokens = useAllTokens()
  const { chainId } = useActiveWeb3React()
  const sudtETHAddressByIssuerLockHash = useMemo(
    () => (chainId != null ? sudtETHAddressByIssuerLockHashByChain[chainId] : emptyObject),
    [chainId]
  )

  const [layer2Currency, layer2CurrencyETHAddress] = useMemo(() => {
    if (issuerLockHash == null) {
      return [void 0, void 0]
    }

    if (isCKB) {
      return [ETHER, ethersConstants.AddressZero]
    }

    const sudtETHAddress = sudtETHAddressByIssuerLockHash[issuerLockHash]
    if (sudtETHAddress == null) {
      return [void 0, void 0]
    }

    return [allTokens[sudtETHAddress], sudtETHAddress]
  }, [allTokens, sudtETHAddressByIssuerLockHash, issuerLockHash, isCKB])

  const decimals = useMemo(() => {
    return layer2Currency?.decimals ?? 0
  }, [layer2Currency])

  const [symbol, symbolFull] = useMemo(() => {
    if (issuerLockHash == null) {
      return [void 0, void 0]
    }

    if (layer2Currency != null) {
      const { symbol: layer2Symbol } = layer2Currency
      const symbolLength = layer2Symbol?.length ?? 0

      if (symbolLength > 20) {
        return [ellipseString(layer2Symbol, 4), layer2Symbol]
      }

      if (layer2Symbol != null) {
        return [layer2Symbol, layer2Symbol]
      }

      return [`Unknown${ellipseString(layer2CurrencyETHAddress, 4)}`, layer2CurrencyETHAddress]
    }

    return [`Unknown${ellipseString(issuerLockHash, 4)}`, issuerLockHash]
  }, [layer2Currency, issuerLockHash, layer2CurrencyETHAddress])

  return {
    balance,
    hasBalanceBeenFetched,
    layer2Currency,
    decimals,
    symbol,
    symbolFull,
  }
}
