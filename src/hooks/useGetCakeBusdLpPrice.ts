import { useCurrency } from 'hooks/Tokens'
import { useTradeExactIn } from 'hooks/Trades'
import { tryParseAmount } from 'state/swap/hooks'
import { ChainId } from '@yokaiswap/sdk'

const useGetCakeBusdLpPrice = () => {
  const cakeAddress =
    Number(process.env.REACT_APP_CHAIN_ID) === ChainId.GWTESTNET
      ? '0xc5e133E6B01b2C335055576C51A53647B1b9b624'
      : '0x37D8a33814eBC6BB300a734237DA60730c91d0a8'
  const busdAddress =
    Number(process.env.REACT_APP_CHAIN_ID) === ChainId.GWTESTNET
      ? '0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a'
      : '0x3F626e70F5d26C35e0fF1fC5aBbBF52492BD51D9'
  const inputCurrency = useCurrency(cakeAddress)
  const outputCurrency = useCurrency(busdAddress)
  const parsedAmount = tryParseAmount('1', inputCurrency ?? undefined)
  const bestTradeExactIn = useTradeExactIn(parsedAmount, outputCurrency ?? undefined)
  const price = bestTradeExactIn?.executionPrice.toSignificant(6)
  return price ? parseFloat(price) : undefined
}

export default useGetCakeBusdLpPrice
