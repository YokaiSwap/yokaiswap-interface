import { ChainId, Token } from '@yokaiswap/sdk'

export type IStablePoolsMap = Readonly<{ [chainId in ChainId]: Readonly<IStablePool[]> }>

interface IStablePoolByPairKey extends IStablePool {
  tokenIndexes: [number, number]
}

export type IStablePoolsByPairKeyMap = Readonly<
  { [chainId in ChainId]: Readonly<{ [key: string]: IStablePoolByPairKey | undefined }> }
>

export const stablePools: IStablePoolsMap = {
  [ChainId.GWDEVNET]: [
    // {
    //   name: '3USDT',
    //   address: '0xaC69F0710fF23e50986E56189f2220EAc8FDe90B',
    //   tokens: [
    //     new Token(ChainId.GWDEVNET, '0xC72d93A333E13cFe3364Abc70157b39147957a92', 18, 'USDT', 'Nervos-Peg Tether USD'),
    //     new Token(
    //       ChainId.GWDEVNET,
    //       '0x106fDEc8EC9250f93d38182Ea917B75f51246b02',
    //       18,
    //       'ethUSDT',
    //       'Nervos-Peg Ethereum Tether USD'
    //     ),
    //     new Token(
    //       ChainId.GWDEVNET,
    //       '0x490827E53Cf0cE4aBCECd152394eF2df0631F955',
    //       18,
    //       'solUSDT',
    //       'Nervos-Peg Solana Tether USD'
    //     ),
    //   ],
    //   liquidityToken: new Token(
    //     ChainId.GWTESTNET,
    //     '0x60666157B85614e62aC181ca36291E59a509Dc93',
    //     18,
    //     '3USDT-LP',
    //     'YokaiSwap 3USDT'
    //   ),
    // },
  ],
  [ChainId.GWTESTNET]: [
    {
      name: '3USDT',
      address: '0x19Ca7e56aD9375a14ff19Dd6872da2934C81807C',
      tokens: [
        new Token(ChainId.GWTESTNET, '0x3380EA6631D4Aa6C6fE0E4eF7600896ad530093A', 18, 'USDT', 'Nervos-Peg Tether USD'),
        new Token(
          ChainId.GWTESTNET,
          '0xeC8bF93B774a353Fd7244A7e427C021287779b77',
          18,
          'ethUSDT',
          'Nervos-Peg Ethereum Tether USD'
        ),
        new Token(
          ChainId.GWTESTNET,
          '0x1A0E713d9c91e23c891BDd9e59Db2f1A307417fb',
          18,
          'solUSDT',
          'Nervos-Peg Solana Tether USD'
        ),
      ],
      liquidityToken: new Token(
        ChainId.GWTESTNET,
        '0x50cD088FB669d159D6d3Da2a8D63D9BF3e3A88cc',
        18,
        '3USDT-LP',
        'YokaiSwap 3USDT'
      ),
    },
  ],
}

export function getPairKey(tokenA: Token, tokenB: Token): string {
  return tokenA.sortsBefore(tokenB) ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
}

function getStablePoolsByPairKey(result: { [key: string]: IStablePoolByPairKey | undefined }, stablePool: IStablePool) {
  const { tokens } = stablePool
  const tokensCount = tokens.length
  tokens.forEach((token, i) => {
    for (let j = i + 1; j < tokensCount; j++) {
      result[getPairKey(token, tokens[j])] = {
        ...stablePool,
        tokenIndexes: token.sortsBefore(tokens[j]) ? [i, j] : [j, i],
      }
    }
  })
  return result
}

export const stablePoolsByPairKey: IStablePoolsByPairKeyMap = {
  [ChainId.GWDEVNET]: stablePools[ChainId.GWDEVNET].reduce(getStablePoolsByPairKey, {}),
  [ChainId.GWTESTNET]: stablePools[ChainId.GWTESTNET].reduce(getStablePoolsByPairKey, {}),
}

export function getStablePoolByPairKey(chainId?: ChainId, key?: string): IStablePoolByPairKey | undefined {
  if (chainId == null || key == null) {
    return undefined
  }

  return stablePoolsByPairKey[chainId][key]
}

export interface IStablePool {
  name: string
  address: string
  tokens: Token[]
  liquidityToken: Token
}
