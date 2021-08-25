import { Token } from '@yokaiswap/sdk'
import { SUDTTokenOrCurrency } from 'hooks/useSUDTCurrenciesWithBalance'
import { isAddress } from '../../utils'

export function filterTokens(tokens: Token[], search: string): Token[] {
  if (search.length === 0) return tokens

  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    return tokens.filter((token) => token.address === searchingAddress)
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0)

  if (lowerSearchParts.length === 0) {
    return tokens
  }

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((str) => str.length > 0)

    return lowerSearchParts.every((p) => p.length === 0 || sParts.some((sp) => sp.startsWith(p) || sp.endsWith(p)))
  }

  return tokens.filter((token) => {
    const { symbol, name } = token

    return (symbol && matchesSearch(symbol)) || (name && matchesSearch(name))
  })
}

function isCodeHash(str: string) {
  return str.startsWith('0x') && str.length === 66 && /^0x[a-fA-F0-9]+$/.test(str)
}

export function filterSUDT(tokens: SUDTTokenOrCurrency[], search: string): SUDTTokenOrCurrency[] {
  if (search.length === 0) {
    return tokens
  }

  const searchingCodeHash = isCodeHash(search) ? search.toLowerCase() : undefined
  if (searchingCodeHash != null) {
    return tokens.filter((token) => token.issuerLockHash === searchingCodeHash)
  }

  const searchingAddress = isAddress(search)
  if (searchingAddress) {
    return tokens.filter((token) => token.address === searchingAddress)
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0)

  if (lowerSearchParts.length === 0) {
    return tokens
  }

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((str) => str.length > 0)

    return lowerSearchParts.every((p) => p.length === 0 || sParts.some((sp) => sp.startsWith(p) || sp.endsWith(p)))
  }

  return tokens.filter((token) => {
    const { symbol, name } = token

    return (symbol && matchesSearch(symbol)) || (name && matchesSearch(name))
  })
}

export default filterTokens
