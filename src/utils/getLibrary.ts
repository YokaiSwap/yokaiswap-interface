import type { Web3Provider } from '@ethersproject/providers'
import { godwokenWeb3Provider } from '../helpers/godwoken/providers'

export default function getLibrary(): Web3Provider {
  return godwokenWeb3Provider
}
