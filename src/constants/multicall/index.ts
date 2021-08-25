import { ChainId } from '@yokaiswap/sdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.GWDEVNET]: '0x438a754EdAd6924Ada410019d20E66D59acD9Ca7',
  [ChainId.GWTESTNET]: '0x8BE87Ac9376c33C64583d0CD512227151FeD5bfe',
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
