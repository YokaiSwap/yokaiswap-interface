import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChainId, ETHER } from '@yokaiswap/sdk'
import { Text, Button, CardBody, AddIcon, LinkExternal } from '@yokaiswap/interface-uikit'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import ConnectWalletButton from 'components/ConnectWalletButton'
import L1CurrencyInputPanel from 'components/L1CurrencyInputPanel'
import { emptyScriptHash } from 'helpers/ckb'
import { tryParseAmount } from 'helpers/tryParseAmount'
import { useSUDTTokens } from 'hooks/Tokens'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import { zero } from 'big-integer'
import {
  minDepositCKBAmountBI,
  MIN_DEPOSIT_CELL_CAPACITY,
  minWalletCapacity,
  USDC_MINT_AMOUNT,
  ckbUSDCIssuerLockHash,
  ckbUSDCIssuerPrivateKey,
} from 'config'
import { GodwokenAccountContext, GodwokenBalancesContext, GodwokenBaseContext } from 'contexts/Godwoken/contexts'
import { ethAddrToDepositAddr } from 'helpers/godwoken/deposit'
import { ILayer1TxHistory, Layer1TxType, useLayer1TxHistory } from 'hooks/useLayer1TxHistory'
import {
  Amount as PWAmount,
  AmountUnit,
  Builder as PWBuilder,
  SUDT as PWSUDT,
  RawProvider as PWRawProvider,
  DefaultSigner as PWDefaultSigner,
} from '@lay2/pw-core'
import { SUDTDepositTXBuilder } from 'helpers/godwoken/SUDTDepositTXBuilder'
import { getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { BridgeBodyWrapper } from 'components/Shared'
import { PendingLayer1TxnsContext } from 'contexts/PendingLayer1TxnsContext'
import styled from 'styled-components'
import { SUDTBuilder } from 'helpers/godwoken/SUDTTXBuilder'
import LoaderIcon from 'components/LoaderIcon'
import CardNav from './CardNav'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import PageHeader from './PageHeader'
import SubmittedModal from './SubmittedModal'
import { CKBWalletAddressPanel } from './CKBWalletAddressPanel'

const TestTokensInfo = styled(AutoColumn)`
  border-top: 1px solid ${({ theme }) => theme.colors.borderColor};
  padding: 24px;
`

const TextButton = styled.button`
  align-items: center;
  border: 0;
  outline: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: 16px;
  justify-content: center;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  width: fit-content;

  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }

  :disabled {
    text-decoration: none;
    opacity: 0.6;
    cursor: not-allowed;
  }
`

// TODO: remove
const usdcInfo = {
  name: 'Nervos-Peg USD Coin',
  symbol: 'USDC',
  decimals: 18,
}
const mintUSDCAmount = new PWAmount(USDC_MINT_AMOUNT, usdcInfo.decimals)
const usdc = new PWSUDT(ckbUSDCIssuerLockHash, usdcInfo)
const usdcIssuerProvider = new PWRawProvider(ckbUSDCIssuerPrivateKey)
// generate address
usdcIssuerProvider.init()
const usdcIssuerSinger = new PWDefaultSigner(usdcIssuerProvider)

export default function Deposit() {
  const { account: ethAddress, chainId } = useActiveWeb3React()

  // for state invalidate after address changed
  const stateNonceRef = useRef<any>()
  useLayoutEffect(() => {
    stateNonceRef.current = {}
  }, [ethAddress])

  const txHistoryStorageKey = useMemo(
    () => (chainId != null && ethAddress != null ? `@${chainId}@${ethAddress}/bridge-deposit-history` : undefined),
    [chainId, ethAddress]
  )
  const { txHistory, addTxnToHistory, setTxHistory } = useLayer1TxHistory(txHistoryStorageKey)
  const { addPendingTxn, txStatuses, txStatusesStorageKey } = useContext(PendingLayer1TxnsContext)

  const {
    ckbBalanceL1: { data: ckbBalanceL1, hasBeenFetched: hasL1CKBBalanceBeenFetched },
    setFetchCKBBalanceL1Config,
    setFetchL1SUDTBalancesConfig,
  } = useContext(GodwokenBalancesContext)

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

  const [typedCKBValue, setTypedCKBValue] = useState<string>('')
  const parsedCKBAmount = useMemo(() => tryParseAmount(typedCKBValue, ETHER.decimals), [typedCKBValue])

  const maxCKBAmount = useMemo(
    () => (ckbBalanceL1.gt(minWalletCapacity) ? ckbBalanceL1.minus(minWalletCapacity) : ckbBalanceL1),
    [ckbBalanceL1]
  )
  const handleSetMaxCKBAmount = useCallback(() => {
    setTypedCKBValue(getFullDisplayAmount(maxCKBAmount, AmountUnit.ckb))
  }, [maxCKBAmount])
  const isAtMaxCKBAmount = useMemo(
    () => (parsedCKBAmount != null ? parsedCKBAmount.eq(maxCKBAmount) : maxCKBAmount.eq(zero)),
    [parsedCKBAmount, maxCKBAmount]
  )

  const [selectedIssuerLockHash, setSelectedIssuerLockHash] = useState<string>()
  const handleSUDTCurrencySelect = useCallback((innerSelectedIssuerLockHash: string) => {
    setSelectedIssuerLockHash(innerSelectedIssuerLockHash)
  }, [])

  const {
    balance: sudtBalance,
    hasBalanceBeenFetched: hasSUDTBalanceBeenFetched,
    layer2Currency: sudtCurrency,
    decimals: sudtDecimals,
    symbol: sudtSymbol,
  } = useSUDTCurrency(selectedIssuerLockHash)

  const [typedSUDTValue, setTypedSUDTValue] = useState<string>('')
  const parsedSUDTAmount = useMemo(
    () => tryParseAmount(typedSUDTValue, sudtCurrency?.decimals),
    [typedSUDTValue, sudtCurrency]
  )

  const handleSetMaxSUDTAmount = useCallback(() => {
    setTypedSUDTValue(getFullDisplayAmount(sudtBalance, sudtDecimals))
  }, [sudtBalance, sudtDecimals])
  const isAtMaxSUDTAmount = useMemo(
    () => (parsedSUDTAmount != null ? parsedSUDTAmount.eq(sudtBalance) : sudtBalance.eq(zero)),
    [parsedSUDTAmount, sudtBalance]
  )

  const inputError = useMemo(() => {
    if (ethAddress == null) {
      return 'Connect Wallet'
    }

    if (parsedCKBAmount == null) {
      return typedCKBValue === '' || typedCKBValue === '0' ? 'Enter CKB amount' : 'Invalid CKB amount'
    }

    if (parsedCKBAmount.lesser(minDepositCKBAmountBI)) {
      return `Minimum ${MIN_DEPOSIT_CELL_CAPACITY} CKB`
    }

    if (hasL1CKBBalanceBeenFetched && parsedCKBAmount.gt(maxCKBAmount)) {
      return `Insufficient CKB balance`
    }

    if (selectedIssuerLockHash == null) {
      return void 0
    }

    if (typedSUDTValue !== '' && typedSUDTValue !== '0' && parsedSUDTAmount == null) {
      return `Invalid ${sudtSymbol} amount`
    }

    if (hasSUDTBalanceBeenFetched && Boolean(parsedSUDTAmount?.gt(sudtBalance))) {
      return `Insufficient ${sudtSymbol} balance`
    }

    return void 0
  }, [
    ethAddress,
    typedCKBValue,
    parsedCKBAmount,
    hasL1CKBBalanceBeenFetched,
    maxCKBAmount,
    selectedIssuerLockHash,
    typedSUDTValue,
    parsedSUDTAmount,
    hasSUDTBalanceBeenFetched,
    sudtBalance,
    sudtSymbol,
  ])

  const sudtTokens = useSUDTTokens()

  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string>()
  useLayoutEffect(() => {
    setIsProcessing(false)
    setTxHash(void 0)
  }, [ethAddress])

  const { pwCore } = useContext(GodwokenBaseContext)

  const handleDeposit = useCallback(async () => {
    if (ethAddress == null || pwCore == null || parsedCKBAmount == null) {
      return
    }

    const depositAddr = ethAddrToDepositAddr(ethAddress)
    const stateNonce = stateNonceRef.current
    try {
      setIsProcessing(true)

      const capacity = new PWAmount(parsedCKBAmount.toString(), 0)
      let innerTxHash: string
      if (parsedSUDTAmount == null) {
        innerTxHash = await pwCore.send(depositAddr, capacity)
      } else {
        const builder = new SUDTDepositTXBuilder({
          sudt: new PWSUDT(selectedIssuerLockHash!),
          toAddress: depositAddr,
          amount: new PWAmount(parsedSUDTAmount.toString(), 0),
          capacity,
        })

        innerTxHash = await pwCore.sendTransaction(builder)
      }

      const newTxHistory: ILayer1TxHistory = {
        type: Layer1TxType.deposit,
        txHash: innerTxHash,
        capacity: parsedCKBAmount.toString(),
        amount: parsedSUDTAmount?.toString() ?? '0',
        symbol: sudtSymbol ?? '',
        decimals: sudtDecimals,
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
    parsedCKBAmount,
    parsedSUDTAmount,
    sudtSymbol,
    sudtDecimals,
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
      setTypedCKBValue('')
      setTypedSUDTValue('')
    }
    setTxHash(void 0)
    setShouldShowSubmittedModal(false)
  }, [txHash])

  const [isMintingUSDC, setIsMintingUSDC] = useState(false)
  useLayoutEffect(() => {
    setIsMintingUSDC(false)
  }, [ethAddress])
  const { pwAddress } = useContext(GodwokenAccountContext)

  const handleMintUSDC = useCallback(async () => {
    if (pwAddress == null || pwCore == null) {
      return
    }

    const stateNonce = stateNonceRef.current
    try {
      setIsMintingUSDC(true)

      const builder = new SUDTBuilder(
        {
          sudt: usdc,
          toAddress: pwAddress,
          amount: mintUSDCAmount,
          provider: usdcIssuerProvider,
        },
        {
          witnessArgs: PWBuilder.WITNESS_ARGS.RawSecp256k1,
        }
      )
      const innerTxHash = await pwCore.sendTransaction(builder, usdcIssuerSinger)

      // address had changed, don't update state
      if (stateNonceRef.current !== stateNonce) {
        return
      }

      window.alert(`${Number(USDC_MINT_AMOUNT).toLocaleString('en')} USDC claimed, transaction hash: ${innerTxHash}`)
    } catch (err: any) {
      console.error('Failed to mint USDC', err)

      // address had changed, don't update state
      if (stateNonceRef.current !== stateNonce) {
        return
      }

      window.alert(`Failed to get USDC ${err?.message || err}`)
    } finally {
      setIsMintingUSDC(false)
    }
  }, [pwAddress, pwCore])

  return (
    <BridgeBodyWrapper>
      <CardNav />
      <AppBody>
        <Wrapper>
          <SubmittedModal
            isOpen={shouldShowSubmittedModal}
            onDismiss={handleDismissSubmittedModal}
            hash={txHash}
            chainId={chainId}
          />
          <PageHeader
            title="Deposit to Layer 2"
            description="To deposit, transfer CKB or supported sUDT tokens to your Wallet Address first"
            txHistory={txHistory}
            txStatuses={txStatuses}
            txStatusesStorageKey={txStatusesStorageKey}
          >
            <CKBWalletAddressPanel />
          </PageHeader>
          <CardBody>
            <AutoColumn gap="20px">
              <AutoColumn gap="sm">
                <L1CurrencyInputPanel
                  value={typedCKBValue}
                  onUserInput={setTypedCKBValue}
                  showMaxButton={hasL1CKBBalanceBeenFetched && !maxCKBAmount.eq(zero) && !isAtMaxCKBAmount}
                  onMax={handleSetMaxCKBAmount}
                  label="Deposit"
                  disableCurrencySelect
                  selectedIssuerLockHash={emptyScriptHash}
                  id="bridge-deposit-input-ckb"
                />
                <ColumnCenter>
                  <AddIcon color="textSubtle" />
                </ColumnCenter>
                <L1CurrencyInputPanel
                  value={typedSUDTValue}
                  onUserInput={setTypedSUDTValue}
                  showMaxButton={hasSUDTBalanceBeenFetched && !sudtBalance.eq(zero) && !isAtMaxSUDTAmount}
                  onMax={handleSetMaxSUDTAmount}
                  label="sUDT (optional)"
                  onCurrencySelect={handleSUDTCurrencySelect}
                  selectedIssuerLockHash={selectedIssuerLockHash}
                  tokens={sudtTokens}
                  id="bridge-deposit-input-sudt"
                />
              </AutoColumn>

              {ethAddress == null ? (
                <ConnectWalletButton width="100%" />
              ) : (
                <Button
                  onClick={handleDeposit}
                  disabled={
                    isProcessing ||
                    !hasL1CKBBalanceBeenFetched ||
                    (parsedSUDTAmount != null && !hasSUDTBalanceBeenFetched) ||
                    inputError != null
                  }
                  variant={inputError != null && parsedCKBAmount != null ? 'danger' : 'primary'}
                  width="100%"
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon spin color="currentColor" />
                      <Text ml="4px" color="currentColor">
                        Deposit
                      </Text>
                    </>
                  ) : (
                    inputError ?? 'Deposit'
                  )}
                </Button>
              )}
            </AutoColumn>
          </CardBody>

          {chainId === ChainId.GWTESTNET && (
            <TestTokensInfo>
              <Text>Need layer 1 test tokens?</Text>
              <LinkExternal href="https://faucet.nervos.org/">CKB Testnet Faucet</LinkExternal>
              <TextButton disabled={isMintingUSDC} onClick={handleMintUSDC}>
                Get {Number(USDC_MINT_AMOUNT).toLocaleString('en')} USDC
              </TextButton>
            </TestTokensInfo>
          )}
        </Wrapper>
      </AppBody>
    </BridgeBodyWrapper>
  )
}
