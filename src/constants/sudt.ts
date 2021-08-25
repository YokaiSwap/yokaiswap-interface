import { ChainId } from '@yokaiswap/sdk'

export interface ISUDTIssuerLockHashByETHAddress {
  [ethAddress: string]: string
}

export type SUDTIssuerLockHashByETHAddressByChain = {
  [chainId in ChainId]: ISUDTIssuerLockHashByETHAddress
}

export const sudtIssuerLockHashByETHAddressByChain: SUDTIssuerLockHashByETHAddressByChain = {
  [ChainId.GWDEVNET]: {
    '0x3F626e70F5d26C35e0fF1fC5aBbBF52492BD51D9': '0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e',
  },
  [ChainId.GWTESTNET]: {
    '0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a': '0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e',
    '0x5716B1187182090d0C5D95d8bc58c71ac8c43C22': '0xc43009f083e70ae3fee342d59b8df9eec24d669c1c3a3151706d305f5362c37e',
    '0x8290f27935A2D353adc834c9F3c5F6ef19635C2D': '0x13d640a864c7e84d60afd8ca9c6689d345a18f63e2e426c9623a2811776cf211',
    '0x184Fc3C0B889f2a665e2584Fe4c45FEfB35C76A2': '0xf4ed71b04b087bb2f166f007b80584e772a779fa94cac25c582a35b17c432a32',
  },
}

export interface ISUDTETHAddressByIssuerLockHash {
  [issuerLockHash: string]: string
}

export type SUDTETHAddressByIssuerLockHashByChain = {
  [chainId in ChainId]: ISUDTETHAddressByIssuerLockHash
}

function issuerLockHashByETHAddressToRevertMap(
  issuerLockHashByETHAddress: ISUDTIssuerLockHashByETHAddress
): ISUDTETHAddressByIssuerLockHash {
  return Object.entries(issuerLockHashByETHAddress).reduce((result, [ethAddress, issuerLockHash]) => {
    result[issuerLockHash] = ethAddress
    return result
  }, {})
}

export const sudtETHAddressByIssuerLockHashByChain: SUDTETHAddressByIssuerLockHashByChain = {
  [ChainId.GWDEVNET]: issuerLockHashByETHAddressToRevertMap(sudtIssuerLockHashByETHAddressByChain[ChainId.GWDEVNET]),
  [ChainId.GWTESTNET]: issuerLockHashByETHAddressToRevertMap(sudtIssuerLockHashByETHAddressByChain[ChainId.GWTESTNET]),
}
