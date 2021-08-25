import { Currency, ETHER, Token } from '@yokaiswap/sdk'

export function currencyId(currency: Currency): string {
  if (currency === ETHER) return 'CKB'
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}

export default currencyId
