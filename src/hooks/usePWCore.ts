import PWCore, {
  CellDep,
  DepType,
  EthProvider,
  HashType,
  OutPoint,
  Script,
  CHAIN_SPECS,
  Amount,
  Address,
  ChainID as PWChainID,
} from '@lay2/pw-core'
import { useEffect, useState } from 'react'
import { ChainId } from '@yokaiswap/sdk'

import {
  ckbRPCURL,
  chainId,
  ckbPWLockCellDepOutPointTxHash,
  ckbPWLockCellDepOutPointIndex,
  ckbPWLockCodeHash,
  ckbPWLockHashType,
} from '../config'
import { ckbCollector } from '../helpers/ckb'

const devSpecs: Omit<typeof CHAIN_SPECS.Aggron, 'pwLock'> = {
  daoType: {
    cellDep: new CellDep(
      DepType.code,
      new OutPoint('0x6dd0b20f37a03939f40f26a6a41a9ad3baa9abdc37086e74879c52dd35c8664c', '0x2')
    ),
    script: new Script('0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e', '0x', HashType.type),
  },
  defaultLock: {
    cellDep: new CellDep(
      DepType.depGroup,
      new OutPoint('0x2db1b175e0436966e5fc8dd5cdf855970869b37a6c556e00e97ccb161c644eb5', '0x0')
    ),
    script: new Script('0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', '0x', HashType.type),
  },
  multiSigLock: {
    cellDep: new CellDep(
      DepType.depGroup,
      new OutPoint('0x2db1b175e0436966e5fc8dd5cdf855970869b37a6c556e00e97ccb161c644eb5', '0x1')
    ),
    script: new Script('0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8', '0x', HashType.type),
  },
  sudtType: {
    cellDep: new CellDep(
      DepType.code,
      new OutPoint('0x50ca87722da8b67deea5517cca73da7d65408d6e2e87539e40b4267341830e50', '0x1')
    ),
    script: new Script('0xc1d16846e515a60e28d19197b87097631f40fbc8a33c0408ee65202803795939', '0x', HashType.type),
  },
  acpLockList: [new Script('0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541', '0x', HashType.type)],
}

const spec =
  chainId === ChainId.GWDEVNET ? devSpecs : chainId === ChainId.GWTESTNET ? CHAIN_SPECS.Aggron : CHAIN_SPECS.Lina

const rawPWCore = new PWCore(ckbRPCURL)
const initPWCorePromise = rawPWCore
  .init(new EthProvider(), ckbCollector, chainId === ChainId.GWDEVNET ? PWChainID.ckb_dev : undefined, {
    ...spec,
    pwLock: {
      cellDep: new CellDep(DepType.code, new OutPoint(ckbPWLockCellDepOutPointTxHash, ckbPWLockCellDepOutPointIndex)),
      script: new Script(ckbPWLockCodeHash, '0x', ckbPWLockHashType),
    },
    // remove default acp version pw-lock
    acpLockList: spec.acpLockList.slice(-1),
  })
  .catch((err) => {
    console.error('Failed to init pw-core', err)
  })

export function usePWCore() {
  const [pwCore, setPWCore] = useState<PWCore>()

  useEffect(() => {
    let isDisposed = false

    async function init() {
      const result = await initPWCorePromise
      if (isDisposed || result == null) {
        return
      }
      if (process.env.NODE_ENV === 'development') {
        Object.assign(window, { pwCore: result, Amount, Address })
      }
      setPWCore(result)
    }

    init()

    return () => {
      isDisposed = true
    }
  }, [])

  return pwCore
}
