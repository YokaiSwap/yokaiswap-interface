import { GodwokenBalancesContext } from 'contexts/Godwoken/contexts'
import { useContext, useMemo } from 'react'
import { sudtETHAddressByIssuerLockHashByChain } from 'constants/sudt'
import { useActiveWeb3React } from 'hooks'
import { SUDTCurrency } from 'helpers/SUDTCurrency'
import { SUDTToken } from 'helpers/SUDTToken'
import { useAllTokens } from './Tokens'

export type SUDTTokenOrCurrency = SUDTToken | SUDTCurrency

export interface ISUDTCurrencies {
  [issuerLockHash: string]: SUDTTokenOrCurrency
}

const emptyObject = {}

export function useSUDTCurrenciesWithBalance(): ISUDTCurrencies {
  const { chainId } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const {
    l1SUDTBalances: { data: l1SUDTBalances },
  } = useContext(GodwokenBalancesContext)

  const sudtETHAddressByIssuerLockHash = useMemo(
    () => (chainId != null ? sudtETHAddressByIssuerLockHashByChain[chainId] : emptyObject),
    [chainId]
  )

  return useMemo(() => {
    const result: ISUDTCurrencies = emptyObject
    for (const issuerLockHash of Object.keys(l1SUDTBalances)) {
      const ethAddress = sudtETHAddressByIssuerLockHash[issuerLockHash]
      if (ethAddress == null) {
        result[issuerLockHash] = new SUDTCurrency(issuerLockHash)
        continue
      }

      const token = allTokens[ethAddress]
      result[issuerLockHash] =
        token != null ? new SUDTToken(token, issuerLockHash) : new SUDTCurrency(issuerLockHash, ethAddress)
    }

    return result
  }, [l1SUDTBalances, allTokens, sudtETHAddressByIssuerLockHash])
}
