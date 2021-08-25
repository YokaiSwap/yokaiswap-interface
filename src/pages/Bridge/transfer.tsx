import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChainId } from '@yokaiswap/sdk'
import { Button, CardBody, Text } from '@yokaiswap/interface-uikit'
import { AutoColumn } from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import ConnectWalletButton from 'components/ConnectWalletButton'
import L1CurrencyInputPanel from 'components/L1CurrencyInputPanel'
import { emptyScriptHash } from 'helpers/ckb'
import { tryParseAmount } from 'helpers/tryParseAmount'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import { zero } from 'big-integer'
import { minWalletCapacity, chainId as configChainId } from 'config'
import { GodwokenAccountContext, GodwokenBalancesContext, GodwokenBaseContext } from 'contexts/Godwoken/contexts'
import { ILayer1TxHistory, Layer1TxType, useLayer1TxHistory } from 'hooks/useLayer1TxHistory'
import {
  Amount as PWAmount,
  LumosConfigs,
  SUDT as PWSUDT,
  parseAddress,
  Address as PWAddress,
  Script as PWScript,
  HashType as PWHashType,
} from '@lay2/pw-core'
import LoaderIcon from 'components/LoaderIcon'
import { getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { BridgeBodyWrapper } from 'components/Shared'
import { PendingLayer1TxnsContext } from 'contexts/PendingLayer1TxnsContext'
import CKBAddressInputPanel from 'components/CKBAddressInputPanel'
import CardNav from './CardNav'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import PageHeader from './PageHeader'
import SubmittedModal from './SubmittedModal'

export default function Transfer() {
  const { account: ethAddress, chainId } = useActiveWeb3React()

  // for state invalidate after address changed
  const stateNonceRef = useRef<any>()
  useLayoutEffect(() => {
    stateNonceRef.current = {}
  }, [ethAddress])

  const txHistoryStorageKey = useMemo(
    () => (chainId != null && ethAddress != null ? `@${chainId}@${ethAddress}/bridge-transfer-history` : undefined),
    [chainId, ethAddress]
  )
  const { txHistory, addTxnToHistory, setTxHistory } = useLayer1TxHistory(txHistoryStorageKey)
  const { addPendingTxn, txStatuses, txStatusesStorageKey } = useContext(PendingLayer1TxnsContext)

  const { setFetchCKBBalanceL1Config, setFetchL1SUDTBalancesConfig } = useContext(GodwokenBalancesContext)

  useEffect(() => {
    setFetchCKBBalanceL1Config({
      isDisabled: false,
    })
    setFetchL1SUDTBalancesConfig({
      isDisabled: false,
    })

    return () => {
      setFetchCKBBalanceL1Config({
        isDisabled: true,
      })
      setFetchL1SUDTBalancesConfig({
        isDisabled: true,
      })
    }
  }, [setFetchCKBBalanceL1Config, setFetchL1SUDTBalancesConfig])

  const [selectedIssuerLockHash, setSelectedIssuerLockHash] = useState(emptyScriptHash)
  const handleCurrencySelect = useCallback((innerSelectedIssuerLockHash: string) => {
    setSelectedIssuerLockHash(innerSelectedIssuerLockHash)
  }, [])

  const { balance, hasBalanceBeenFetched, decimals, symbol } = useSUDTCurrency(selectedIssuerLockHash)

  const [typedValue, setTypedValue] = useState<string>('')
  const parsedAmount = useMemo(() => tryParseAmount(typedValue, decimals), [typedValue, decimals])

  const isCKB = useMemo(() => selectedIssuerLockHash === emptyScriptHash, [selectedIssuerLockHash])
  const maxAmount = useMemo(
    () => (isCKB && balance.gt(minWalletCapacity) ? balance.minus(minWalletCapacity) : balance),
    [isCKB, balance]
  )

  const handleSetMaxAmount = useCallback(() => {
    setTypedValue(getFullDisplayAmount(maxAmount, decimals))
  }, [maxAmount, decimals])
  const isAtMaxAmount = useMemo(
    () => (parsedAmount != null ? parsedAmount.eq(maxAmount) : maxAmount.eq(zero)),
    [parsedAmount, maxAmount]
  )

  const amountInputError = useMemo(() => {
    if (ethAddress == null) {
      return 'Connect Wallet'
    }

    if (parsedAmount == null) {
      return typedValue === '' || typedValue === '0' ? 'Enter amount' : 'Invalid amount'
    }

    if (hasBalanceBeenFetched && parsedAmount.gt(maxAmount)) {
      return `Insufficient balance`
    }

    return void 0
  }, [ethAddress, parsedAmount, hasBalanceBeenFetched, maxAmount, typedValue])

  const [typedAddress, setTypedAddress] = useState('')
  const { ckbAddress } = useContext(GodwokenAccountContext)

  const { addressInputError, toPWAddress } = useMemo(() => {
    if (typedAddress === '') {
      return {
        addressInputError: 'Enter CKB address',
        toPWAddress: void 0,
      }
    }

    if (typedAddress === ckbAddress) {
      return {
        addressInputError: 'Self transfer is not allowed',
        toPWAddress: void 0,
      }
    }

    try {
      const lumosConfig =
        LumosConfigs[configChainId === ChainId.GWDEVNET || configChainId === ChainId.GWTESTNET ? 1 : 0]
      const snakeScript = parseAddress(typedAddress, {
        config: lumosConfig,
      })
      const innerToPWAddress = PWAddress.fromLockScript(
        new PWScript(snakeScript.code_hash, snakeScript.args, snakeScript.hash_type as PWHashType)
      )

      // if (
      //   AddressCodeHash !== lumosConfig.SCRIPTS.SECP256K1_BLAKE160.SCRIPT.code_hash ||
      //   AddressCodeHash !== lumosConfig.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT.code_hash
      // ) {
      // }
      return {
        addressInputError: void 0,
        toPWAddress: innerToPWAddress,
      }
    } catch (err: any) {
      console.warn('[warn] Failed to parse ckb address', err)
    }

    return {
      addressInputError: 'Invalid CKB address',
      toPWAddress: void 0,
    }
  }, [ckbAddress, typedAddress])

  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string>()
  useLayoutEffect(() => {
    setIsProcessing(false)
    setTxHash(void 0)
  }, [ethAddress])

  const { pwCore } = useContext(GodwokenBaseContext)

  const handleTransfer = useCallback(async () => {
    if (ethAddress == null || pwCore == null || parsedAmount == null || toPWAddress == null) {
      return
    }

    const stateNonce = stateNonceRef.current
    try {
      setIsProcessing(true)

      const amount = new PWAmount(parsedAmount.toString(), 0)
      let innerTxHash: string
      if (isCKB) {
        innerTxHash = await pwCore.send(toPWAddress, amount)
      } else {
        const sudt = new PWSUDT(selectedIssuerLockHash!)
        innerTxHash = await pwCore.sendSUDT(sudt, toPWAddress, amount, true)
      }

      const newTxHistory: ILayer1TxHistory = {
        type: Layer1TxType.transfer,
        txHash: innerTxHash,
        capacity: isCKB ? parsedAmount.toString() : '0',
        amount: !isCKB ? parsedAmount.toString() : '0',
        symbol: isCKB ? '' : symbol ?? '',
        decimals: isCKB ? 0 : decimals,
      }

      addTxnToHistory(newTxHistory)

      // address had changed, don't update state
      if (stateNonceRef.current !== stateNonce) {
        return
      }

      setTxHash(innerTxHash)
      setTxHistory((history) => [newTxHistory, ...history])
      addPendingTxn(newTxHistory)
    } catch (err: any) {
      if (err?.code !== 4001 && !err?.message?.includes('User denied')) {
        console.error('failed to deposit', err)
        if (stateNonceRef.current === stateNonce) {
          window.alert(`Failed to deposit:\n${err?.message || err}`)
        }
      }
    } finally {
      if (stateNonceRef.current === stateNonce) {
        setIsProcessing(false)
      }
    }
  }, [
    ethAddress,
    pwCore,
    parsedAmount,
    toPWAddress,
    isCKB,
    symbol,
    decimals,
    addTxnToHistory,
    setTxHistory,
    addPendingTxn,
    selectedIssuerLockHash,
  ])

  const [shouldShowSubmittedModal, setShouldShowSubmittedModal] = useState<boolean>(false)
  useLayoutEffect(() => {
    setShouldShowSubmittedModal(false)
  }, [ethAddress])

  useEffect(() => {
    if (txHash == null) {
      return
    }

    setShouldShowSubmittedModal(true)
  }, [txHash])

  const handleDismissSubmittedModal = useCallback(() => {
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setTypedValue('')
    }
    setTxHash(void 0)
    setShouldShowSubmittedModal(false)
  }, [txHash])

  return (
    <BridgeBodyWrapper>
      <CardNav activeIndex={2} />
      <AppBody>
        <Wrapper>
          <SubmittedModal
            isOpen={shouldShowSubmittedModal}
            onDismiss={handleDismissSubmittedModal}
            hash={txHash}
            chainId={chainId}
          />
          <PageHeader
            title="Transfer"
            description="Transfer layer 1 assets from Wallet Address"
            txHistory={txHistory}
            txStatuses={txStatuses}
            txStatusesStorageKey={txStatusesStorageKey}
          />
          <CardBody>
            <AutoColumn gap="20px">
              <L1CurrencyInputPanel
                value={typedValue}
                onUserInput={setTypedValue}
                showMaxButton={hasBalanceBeenFetched && !maxAmount.eq(zero) && !isAtMaxAmount}
                onMax={handleSetMaxAmount}
                label="Transfer"
                onCurrencySelect={handleCurrencySelect}
                selectedIssuerLockHash={selectedIssuerLockHash}
                id="bridge-transfer-input"
              />
              <CKBAddressInputPanel
                id="ckb-address-input"
                value={typedAddress}
                onChange={setTypedAddress}
                hasError={addressInputError != null && addressInputError !== 'Enter CKB address'}
              />

              {ethAddress == null ? (
                <ConnectWalletButton width="100%" />
              ) : (
                <Button
                  onClick={handleTransfer}
                  disabled={
                    isProcessing ||
                    !hasBalanceBeenFetched ||
                    amountInputError != null ||
                    typedAddress === '' ||
                    addressInputError != null
                  }
                  variant={
                    (amountInputError != null && parsedAmount != null) ||
                    (addressInputError != null && typedAddress !== '')
                      ? 'danger'
                      : 'primary'
                  }
                  width="100%"
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon spin color="currentColor" />
                      <Text ml="4px" color="currentColor">
                        Transfer
                      </Text>
                    </>
                  ) : (
                    amountInputError ?? addressInputError ?? 'Transfer'
                  )}
                </Button>
              )}
            </AutoColumn>
          </CardBody>
        </Wrapper>
      </AppBody>
    </BridgeBodyWrapper>
  )
}
