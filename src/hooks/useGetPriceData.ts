import { useEffect, useState } from 'react'

export interface TokenList {
  [address: string]: Token
}

export interface Token {
  price: string
  symbol: string
}

export interface TokensApiResponse {
  /* eslint-disable camelcase */
  update_at: string
  data: TokenList
}

export interface PriceList {
  [key: string]: number
}

export interface PriceApiResponse {
  /* eslint-disable camelcase */
  update_at: string
  prices: PriceList
}

/**
 * Due to Cors the api was forked and a proxy was created
 * @see https://github.com/pancakeswap/gatsby-pancake-api/commit/e811b67a43ccc41edd4a0fa1ee704b2f510aa0ba
 */
const api = 'https://api.pancakeswap.info/api/v2/tokens'

const useGetPriceData = () => {
  const [data, setData] = useState<PriceApiResponse | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(api)
        const res: TokensApiResponse = await response.json()

        setData({
          update_at: res.update_at,
          prices: Object.keys(res.data).reduce((accum, address) => {
            return {
              ...accum,
              [res.data[address].symbol]: Number(res.data[address].price),
            }
          }, {}),
        })
      } catch (error) {
        console.error('Unable to fetch price data:', error)
      }
    }

    fetchData()
  }, [setData])

  return data
}

export default useGetPriceData
