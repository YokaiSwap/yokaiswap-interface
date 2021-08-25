import { ChainId, JSBI, Percent, Token, WETH } from '@yokaiswap/sdk'

export const ROUTER_ADDRESS =
  Number(process.env.REACT_APP_CHAIN_ID) === ChainId.GWTESTNET
    ? '0x3Ef391dF0756Cb8da62856eFBb385aaC1F9AB40A'
    : '0xBF5e941D64B542e532B972C6390Cee648CBfd76D'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

const YOK_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0x37D8a33814eBC6BB300a734237DA60730c91d0a8',
  18,
  'YOK',
  'YokaiSwap Token'
)

const USDC_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0x3F626e70F5d26C35e0fF1fC5aBbBF52492BD51D9',
  18,
  'USDC',
  'Nervos-Peg USD Coin'
)

const ETH_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0x897F8be9456c84C24044B88A5af4ec6534D2DEAA',
  18,
  'ETH',
  'Nervos-Peg Ethereum Token'
)

const ETH_USDT_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0x106fDEc8EC9250f93d38182Ea917B75f51246b02',
  18,
  'ethUSDT',
  'Nervos-Peg Ethereum Tether USD'
)

const SOL_USDT_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0x490827E53Cf0cE4aBCECd152394eF2df0631F955',
  18,
  'solUSDT',
  'Nervos-Peg Solana Tether USD'
)

const USDT_GW_DEVNET = new Token(
  ChainId.GWDEVNET,
  '0xC72d93A333E13cFe3364Abc70157b39147957a92',
  18,
  'USDT',
  'Nervos-Peg Tether USD'
)

const YOK_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0xc5e133E6B01b2C335055576C51A53647B1b9b624',
  18,
  'YOK',
  'YokaiSwap Token'
)

// const BUSD_GW_TESTNET = new Token(
//   ChainId.GWTESTNET,
//   '0xe0AEaF100F89bA13f9Bcf8a7c8AbCCAEDf4993c0',
//   18,
//   'BUSD',
//   'Nervos-Peg Binance USD'
// )

const USDC_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a',
  18,
  'USDC',
  'Nervos-Peg USD Coin'
)

const ETH_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0xfF313383879C1214F7AeCfE2E3174274339218c3',
  18,
  'ETH',
  'Nervos-Peg Ethereum Token'
)

const ETH_USDT_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0xeC8bF93B774a353Fd7244A7e427C021287779b77',
  18,
  'ethUSDT',
  'Nervos-Peg Ethereum Tether USD'
)

const SOL_USDT_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0x1A0E713d9c91e23c891BDd9e59Db2f1A307417fb',
  18,
  'solUSDT',
  'Nervos-Peg Solana Tether USD'
)

const USDT_GW_TESTNET = new Token(
  ChainId.GWTESTNET,
  '0x3380EA6631D4Aa6C6fE0E4eF7600896ad530093A',
  18,
  'USDT',
  'Nervos-Peg Tether USD'
)

const WETH_ONLY: ChainTokenList = {
  [ChainId.GWDEVNET]: [WETH[ChainId.GWDEVNET]],
  [ChainId.GWTESTNET]: [WETH[ChainId.GWTESTNET]],
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.GWDEVNET]: [...WETH_ONLY[ChainId.GWDEVNET], USDC_GW_DEVNET, USDT_GW_DEVNET, ETH_GW_DEVNET],
  [ChainId.GWTESTNET]: [...WETH_ONLY[ChainId.GWTESTNET], USDC_GW_TESTNET, USDT_GW_TESTNET, ETH_GW_TESTNET],
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.GWDEVNET]: [...WETH_ONLY[ChainId.GWDEVNET], USDC_GW_DEVNET, USDT_GW_DEVNET],
  [ChainId.GWTESTNET]: [...WETH_ONLY[ChainId.GWTESTNET], USDC_GW_TESTNET, USDT_GW_TESTNET],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.GWDEVNET]: [...WETH_ONLY[ChainId.GWDEVNET], ETH_GW_DEVNET, USDC_GW_DEVNET, YOK_GW_DEVNET, USDT_GW_DEVNET],
  [ChainId.GWTESTNET]: [
    ...WETH_ONLY[ChainId.GWTESTNET],
    ETH_GW_TESTNET,
    USDC_GW_TESTNET,
    YOK_GW_TESTNET,
    USDT_GW_TESTNET,
  ],
}

export const DO_NOT_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.GWDEVNET]: [ETH_USDT_GW_DEVNET, SOL_USDT_GW_DEVNET],
  [ChainId.GWTESTNET]: [ETH_USDT_GW_TESTNET, SOL_USDT_GW_TESTNET],
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 80
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
