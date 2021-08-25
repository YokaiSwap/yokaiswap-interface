import { Token, TokenAmount } from '@yokaiswap/sdk'
import { useMemo } from 'react'

import { useTokenContract } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useGodwokenAddress } from '../hooks/useGodwokenAddress'

export function useTokenAllowance(token?: Token, owner?: string | null, spender?: string): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const ownerGodwokenAddress = useGodwokenAddress(owner)
  const inputs = useMemo(() => [ownerGodwokenAddress, spender], [ownerGodwokenAddress, spender])
  const allowance = useSingleCallResult(ownerGodwokenAddress == null ? undefined : contract, 'allowance', inputs).result

  return useMemo(
    () => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined),
    [token, allowance]
  )
}

export default useTokenAllowance
