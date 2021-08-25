import { InjectedConnector } from '@web3-react/injected-connector'
import type { Web3Provider } from '@ethersproject/providers'

import { godwokenWeb3Provider } from './godwoken/providers'
import { chainId } from '../config'

export enum ConnectorNames {
  Injected = 'injected',
}

const injected = new InjectedConnector({ supportedChainIds: [chainId] })

export const connectorsByName: { [connectorName in ConnectorNames]?: any } = {
  [ConnectorNames.Injected]: injected,
}

export function getLibrary(): Web3Provider {
  return godwokenWeb3Provider
}
