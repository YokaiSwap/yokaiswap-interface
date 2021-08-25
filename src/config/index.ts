import { DepType, HashType, AmountUnit } from '@lay2/pw-core'
import { PolyjuiceConfig } from '@polyjuice-provider/web3'
import bigInt from 'big-integer'

import genesis from './genesis.json'
import scriptsDeployResult from './scripts-deploy-result.json'

export const chainId = parseInt(process.env.REACT_APP_CHAIN_ID!, 10)

export const ckbRPCURL = process.env.REACT_APP_CKB_RPC_URL!
export const ckbIndexerURL = process.env.REACT_APP_CKB_INDEXER_URL!
export const ckbPWCollectURL = process.env.REACT_APP_CKB_PW_COLLECTOR_URL!
export const ckbSUDTScriptCodeHash = process.env.REACT_APP_CKB_SUDT_SCRIPT_CODE_HASH!
export const ckbSUDTScriptHashType = process.env.REACT_APP_CKB_SUDT_SCRIPT_HASH_TYPE! as HashType

export const ckbPWLockCodeHash = process.env.REACT_APP_CKB_PW_LOCK_CODE_HASH!
export const ckbPWLockHashType = process.env.REACT_APP_CKB_PW_LOCK_HASH_TYPE! as HashType
export const ckbPWLockCellDepOutPointTxHash = process.env.REACT_APP_CKB_PW_CELL_DEP_OUT_POINT_TX_HASH!
export const ckbPWLockCellDepOutPointIndex = process.env.REACT_APP_CKB_PW_CELL_DEP_OUT_POINT_INDEX!

export const gwPolyjuiceRPCURL = process.env.REACT_APP_GW_POLYJUICE_RPC_URL!

export const gwEstimateBlocktime = Number(process.env.REACT_APP_GW_ESTIMATE_BLOCK_TIME!)
export const gwEstimateBlockFinalityTime = Number(process.env.REACT_APP_GW_ESTIMATE_BLOCK_FINALITY_TIME!)
export const gwRollupTypeHash = genesis.rollup_type_hash
export const gwRollupScriptCodeHash = genesis.rollup_type_script.code_hash
export const gwRollupScriptHashType = genesis.rollup_type_script.hash_type as HashType
export const gwRollupScriptArgs = genesis.rollup_type_script.args
export const gwPolyjuiceETHAccountLockCodeHash = scriptsDeployResult.eth_account_lock.script_type_hash
export const gwDepositLockCodeHash = scriptsDeployResult.deposit_lock.script_type_hash
export const gwWithdrawalLockCodeHash = scriptsDeployResult.withdrawal_lock.script_type_hash
export const gwWithdrawalLockCellDepOutPointTxHash = scriptsDeployResult.withdrawal_lock.cell_dep.out_point.tx_hash
export const gwWithdrawalLockCellDepOutPointIndex = scriptsDeployResult.withdrawal_lock.cell_dep.out_point.index
export const gwWithdrawalLockCellDepDepType = scriptsDeployResult.withdrawal_lock.cell_dep.dep_type as DepType
export const gwSUDTScriptCodeHash = scriptsDeployResult.l2_sudt_validator.script_type_hash
export const gwSUDTScriptHashType = process.env.REACT_APP_GW_SUDT_SCRIPT_HASH_TYPE! as HashType
export const gwCustodianScriptCodeHash = scriptsDeployResult.custodian_lock.script_type_hash
export const gwCustodianScriptHashType = process.env.REACT_APP_GW_CUSTODIAN_SCRIPT_HASH_TYPE! as HashType

export const polyjuiceConfig: PolyjuiceConfig = {
  rollupTypeHash: gwRollupTypeHash,
  ethAccountLockCodeHash: gwPolyjuiceETHAccountLockCodeHash,
  web3Url: gwPolyjuiceRPCURL,
}

// https://github.com/nervosnetwork/godwoken/blob/4b2ff6f52aabef0a8cef3d3c8f76c6c0a0044fd1/crates/generator/src/constants.rs#L1-L4
// ckb only: 290 CKB, with sUDT: 371 CKB
export const MIN_DEPOSIT_CELL_CAPACITY = process.env.REACT_APP_MIN_CKB_DEPOSIT_CAPACITY!
// ckb only: 265 CKB, with sUDT: 346 CKB
export const MIN_WITHDRAWAL_CELL_CAPACITY = process.env.REACT_APP_MIN_CKB_WITHDRAWAL_CAPACITY!

export const minDepositCKBAmountBI = bigInt(MIN_DEPOSIT_CELL_CAPACITY).multiply(bigInt(10).pow(AmountUnit.ckb))
export const minWithdrawalCKBAmountBI = bigInt(MIN_WITHDRAWAL_CELL_CAPACITY).multiply(bigInt(10).pow(AmountUnit.ckb))

export const MIN_WALLET_CAPACITY = process.env.REACT_APP_MIN_WALLET_CAPACITY!
// TODO: should allow empty wallet
export const minWalletCapacity = bigInt(MIN_WALLET_CAPACITY).multiply(bigInt(10).pow(AmountUnit.ckb))

// TODO: remove
export const ckbUSDCIssuerLockHash = process.env.REACT_APP_CKB_USDC_ISSUER_LOCK_HASH!
export const ckbUSDCIssuerPrivateKey = process.env.REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY!
export const USDC_MINT_AMOUNT = process.env.REACT_APP_CKB_USDC_MINT_AMOUNT!
