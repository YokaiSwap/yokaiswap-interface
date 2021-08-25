import { CurrencyAmount, JSBI, Percent, Price, Token, TokenAmount, Trade } from '@yokaiswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { CardBody, ArrowDownIcon, Button, IconButton, Text } from '@yokaiswap/interface-uikit'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from 'components/AddressInputPanel'
import Card, { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CardNav from 'components/CardNav'
import { AutoRow, RowBetween } from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from 'components/swap/styleds'
import TradePrice from 'components/swap/TradePrice'
import TokenWarningModal from 'components/TokenWarningModal'
import SyrupWarningModal from 'components/SyrupWarningModal'
import ProgressSteps from 'components/ProgressSteps'

import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { LinkStyledButton, TradeBodyWrapper } from 'components/Shared'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/prices'
import Loader from 'components/Loader'
import useI18n from 'hooks/useI18n'
import PageHeader from 'components/PageHeader'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { getPairKey, getStablePoolByPairKey } from 'constants/stablePools'
import { useStableSwapContract } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'
import { BigNumber } from 'ethers'
import { calculateSlippageAmount } from 'utils'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from 'state/transactions/hooks'
import ConfirmStableSwapModal from 'components/swap/ConfirmStableSwapModal'
import AdvancedStableSwapDetailsDropdown from 'components/swap/AdvancedStableSwapDetailsDropdown'
import AppBody from '../AppBody'

const Swap = () => {
  const loadedUrlParams = useDefaultsFromURLSearch()
  const TranslateString = useI18n()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmSyrupWarning = useCallback(() => {
    setIsSyrup(false)
    setSyrupTransactionType('')
  }, [])

  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo()
  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const [stablePool, sorted] = useMemo(() => {
    const inputToken = currencies[Field.INPUT]
    const outputToken = currencies[Field.OUTPUT]
    if (
      inputToken == null ||
      outputToken == null ||
      !(inputToken instanceof Token) ||
      !(outputToken instanceof Token)
    ) {
      return [undefined, true]
    }

    return [getStablePoolByPairKey(chainId, getPairKey(inputToken, outputToken)), inputToken.sortsBefore(outputToken)]
  }, [chainId, currencies])

  const swapContract = useStableSwapContract(stablePool?.address)
  const stableSwapOutputAmount: BigNumber | undefined = useSingleCallResult(swapContract, 'get_dy', [
    (sorted ? stablePool?.tokenIndexes[0] : stablePool?.tokenIndexes[1]) ?? 0,
    (sorted ? stablePool?.tokenIndexes[1] : stablePool?.tokenIndexes[0]) ?? 1,
    parsedAmount?.raw.toString(),
  ])?.result?.[0]

  const stableSwapOutputAmountFor100: BigNumber | undefined = useSingleCallResult(swapContract, 'get_dy', [
    (sorted ? stablePool?.tokenIndexes[0] : stablePool?.tokenIndexes[1]) ?? 0,
    (sorted ? stablePool?.tokenIndexes[1] : stablePool?.tokenIndexes[0]) ?? 1,
    '100',
  ])?.result?.[0]

  const outputToken = currencies[Field.OUTPUT]
  const realizedLPFee = useMemo(
    () =>
      outputToken && stableSwapOutputAmount
        ? new TokenAmount(outputToken as Token, stableSwapOutputAmount.mul(4).div(9996).toString())
        : undefined,
    [outputToken, stableSwapOutputAmount]
  )

  const stableSwapPriceImpact = useMemo(() => {
    if (
      outputToken == null ||
      parsedAmount == null ||
      stableSwapOutputAmount == null ||
      stableSwapOutputAmountFor100 == null
    ) {
      return undefined
    }

    const dy = JSBI.BigInt(stableSwapOutputAmount.mul(10000).div(9996).toString())
    const quote = JSBI.divide(
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(JSBI.BigInt(stableSwapOutputAmountFor100.toString()), parsedAmount.raw),
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(outputToken.decimals))
        ),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(parsedAmount.currency.decimals))
      ),
      JSBI.BigInt(100)
    )

    return new Percent(JSBI.subtract(quote, dy), quote)
  }, [outputToken, parsedAmount, stableSwapOutputAmount, stableSwapOutputAmountFor100])

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]:
              independentField === Field.OUTPUT
                ? parsedAmount
                : stablePool != null && outputToken instanceof Token && stableSwapOutputAmount != null
                ? new TokenAmount(outputToken, stableSwapOutputAmount.toString())
                : trade?.outputAmount,
          },
    [
      independentField,
      outputToken,
      parsedAmount,
      showWrap,
      stablePool,
      stableSwapOutputAmount,
      trade?.inputAmount,
      trade?.outputAmount,
    ]
  )

  const stableSwapExecutionPrice = useMemo(() => {
    if (stablePool == null) {
      return undefined
    }
    const inputAmount = parsedAmounts[Field.INPUT]
    const outputAmount = parsedAmounts[Field.OUTPUT]
    if (inputAmount == null || outputAmount == null) {
      return undefined
    }

    return new Price(inputAmount.currency, outputAmount.currency, inputAmount.raw, outputAmount.raw)
  }, [stablePool, parsedAmounts])

  const stableSwapSlippageAdjustedOutputAmount = useMemo(() => {
    const outputAmount = parsedAmounts[Field.OUTPUT]
    if (stablePool == null || outputAmount == null) {
      return undefined
    }

    return new TokenAmount(outputAmount.currency as Token, calculateSlippageAmount(outputAmount, allowedSlippage)[0])
  }, [allowedSlippage, parsedAmounts, stablePool])

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  useEffect(() => {
    if (stablePool == null || parsedAmount == null || typedValue === '' || typedValue === '0') {
      return
    }

    if (independentField === Field.INPUT) {
      return
    }

    onUserInput(Field.INPUT, typedValue)
  }, [parsedAmount, typedValue, independentField, stablePool, onUserInput])

  // modal and loading
  const [
    {
      showConfirm,
      tradeToConfirm,
      swapErrorMessage,
      attemptingTxn,
      txHash,
      showStableSwapConfirm,
      stableSwapOutputAmountToConfirm,
    },
    setSwapState,
  ] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
    showStableSwapConfirm: boolean
    stableSwapOutputAmountToConfirm: CurrencyAmount | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
    showStableSwapConfirm: false,
    stableSwapOutputAmountToConfirm: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const noRoute = !route && !stablePool

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const [stableApproval, stableApproveCallback] = useApproveCallback(parsedAmount, stablePool?.address, true)

  const [stableApprovalSubmitted, setStableApprovalSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (stableApproval === ApprovalState.PENDING) {
      setStableApprovalSubmitted(true)
    }
  }, [stableApproval, stableApprovalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    deadline,
    recipient
  )

  let { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  if (stablePool) {
    priceImpactWithoutFee = stableSwapPriceImpact
  }

  const addTransaction = useTransactionAdder()
  const handleStableSwap = useCallback(() => {
    if (stablePool == null || swapContract == null) {
      return
    }
    const inputAmount = parsedAmounts[Field.INPUT]
    const outputAmount = parsedAmounts[Field.OUTPUT]
    if (inputAmount == null || outputAmount == null) {
      return
    }

    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }

    const minimalOutputAmount = calculateSlippageAmount(outputAmount, allowedSlippage)[0]

    // const estimate = swapContract.estimateGas.exchange
    const method: (...args: any) => Promise<TransactionResponse> = swapContract.exchange
    const args: Array<string | string[] | number> = [
      sorted ? stablePool.tokenIndexes[0] : stablePool.tokenIndexes[1],
      sorted ? stablePool.tokenIndexes[1] : stablePool.tokenIndexes[0],
      inputAmount.raw.toString(),
      minimalOutputAmount.toString(),
    ]
    const value = null

    setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: undefined, txHash: undefined }))

    // estimate(...args, value ? { value } : {})
    //   .then((estimatedGasLimit) =>
    method(...args, {
      ...(value ? { value } : {}),
      // gasLimit: calculateGasMargin(estimatedGasLimit),
      gasLimit: 12_500_000,
      gasPrice: 0,
    })
      // )
      .then((response) => {
        const inputSymbol = inputAmount.currency.symbol
        const outputSymbol = outputAmount.currency.symbol
        const inputAmountFormatted = inputAmount.toSignificant(3)
        const outputAmountFormatted = outputAmount.toSignificant(3)

        addTransaction(response, {
          summary: `Swap ${inputAmountFormatted} ${inputSymbol} for ${outputAmountFormatted} ${outputSymbol}`,
        })
        return response.hash
      })
      .then((hash) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: undefined,
          txHash: hash,
        }))
      })
      .catch((error) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: error.message,
          txHash: undefined,
        }))
      })
  }, [stablePool, swapContract, parsedAmounts, priceImpactWithoutFee, allowedSlippage, sorted, addTransaction])

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: undefined, txHash: undefined }))
    swapCallback()
      .then((hash) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: undefined,
          txHash: hash,
        }))
      })
      .catch((error) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: error.message,
          txHash: undefined,
        }))
      })
  }, [priceImpactWithoutFee, swapCallback, setSwapState])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (stablePool
      ? stableApproval === ApprovalState.NOT_APPROVED ||
        stableApproval === ApprovalState.PENDING ||
        (stableApprovalSubmitted && stableApproval === ApprovalState.APPROVED)
      : approval === ApprovalState.NOT_APPROVED ||
        approval === ApprovalState.PENDING ||
        (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showConfirm: false }))

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash, setSwapState])

  const handleStableSwapConfirmDismiss = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showStableSwapConfirm: false }))

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash, setSwapState])

  const handleAcceptChanges = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, tradeToConfirm: trade }))
  }, [trade])

  const handleAcceptStableSwapChanges = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, stableSwapOutputAmountToConfirm: parsedAmounts[Field.OUTPUT] }))
  }, [parsedAmounts])

  // This will check to see if the user has selected Syrup to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForSyrup = useCallback(
    (selected: string, purchaseType: string) => {
      if (selected === 'syrup') {
        setIsSyrup(true)
        setSyrupTransactionType(purchaseType)
      }
    },
    [setIsSyrup, setSyrupTransactionType]
  )

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      if (inputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(inputCurrency.symbol.toLowerCase(), 'Selling')
      }
    },
    [onCurrencySelection, setApprovalSubmitted, checkForSyrup]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      if (outputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(outputCurrency.symbol.toLowerCase(), 'Buying')
      }
    },
    [onCurrencySelection, checkForSyrup]
  )

  return (
    <TradeBodyWrapper>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <SyrupWarningModal
        isOpen={isSyrup}
        transactionType={syrupTransactionType}
        onConfirm={handleConfirmSyrupWarning}
      />
      <CardNav />
      <AppBody>
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />
          <ConfirmStableSwapModal
            inputAmount={parsedAmounts[Field.INPUT]}
            outputAmount={parsedAmounts[Field.OUTPUT]}
            slippageAdjustedOutputAmount={stableSwapSlippageAdjustedOutputAmount}
            priceImpact={stableSwapPriceImpact}
            originalOutputAmount={stableSwapOutputAmountToConfirm}
            isOpen={showStableSwapConfirm}
            onAcceptChanges={handleAcceptStableSwapChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            onConfirm={handleStableSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleStableSwapConfirmDismiss}
            executionPrice={stableSwapExecutionPrice}
            realizedLPFee={realizedLPFee}
          />
          <PageHeader
            title={TranslateString(8, 'Exchange')}
            description={TranslateString(1192, 'Trade tokens in an instant')}
          />
          <CardBody>
            <AutoColumn gap="md">
              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT && !showWrap && trade
                    ? TranslateString(194, 'From (estimated)')
                    : TranslateString(76, 'From')
                }
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={!atMaxAmountInput}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between">
                <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <IconButton
                      disabled={stablePool != null}
                      variant="tertiary"
                      onClick={() => {
                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                        onSwitchTokens()
                      }}
                      style={{ borderRadius: '50%' }}
                      scale="sm"
                    >
                      <ArrowDownIcon color="primary" width="24px" />
                    </IconButton>
                  </ArrowWrapper>
                  {recipient === null && !showWrap && isExpertMode && stablePool == null ? (
                    <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                      + Add a send (optional)
                    </LinkStyledButton>
                  ) : null}
                </AutoRow>
              </AutoColumn>
              <CurrencyInputPanel
                disabled={stablePool != null}
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                label={
                  independentField === Field.INPUT && !showWrap && (trade != null || stablePool != null)
                    ? TranslateString(196, 'To (estimated)')
                    : TranslateString(80, 'To')
                }
                showMaxButton={false}
                currency={currencies[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                id="swap-currency-output"
              />

              {recipient !== null && !showWrap && stablePool != null ? (
                <>
                  <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                    <ArrowWrapper clickable={false}>
                      <ArrowDown size="16" color={theme.colors.textSubtle} />
                    </ArrowWrapper>
                    <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                      - Remove send
                    </LinkStyledButton>
                  </AutoRow>
                  <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                </>
              ) : null}

              {showWrap ? null : (
                <Card padding=".25rem .75rem 0 .75rem" borderRadius="20px">
                  <AutoColumn gap="4px">
                    {Boolean(trade || (stablePool != null && stableSwapExecutionPrice != null)) && (
                      <RowBetween align="center">
                        <Text fontSize="14px">{TranslateString(1182, 'Price')}</Text>
                        <TradePrice
                          price={stableSwapExecutionPrice || trade?.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </RowBetween>
                    )}
                    {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                      <RowBetween align="center">
                        <Text fontSize="14px">{TranslateString(88, 'Slippage Tolerance')}</Text>
                        <Text fontSize="14px">{allowedSlippage / 100}%</Text>
                      </RowBetween>
                    )}
                  </AutoColumn>
                </Card>
              )}
            </AutoColumn>
            <BottomGrouping>
              {!account ? (
                <ConnectWalletButton width="100%" />
              ) : showWrap ? (
                <Button disabled={Boolean(wrapInputError)} onClick={onWrap} width="100%">
                  {wrapInputError ??
                    (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                </Button>
              ) : noRoute && userHasSpecifiedInputOutput ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <Text mb="4px">{TranslateString(1194, 'Insufficient liquidity for this trade.')}</Text>
                </GreyCard>
              ) : showApproveFlow ? (
                <RowBetween>
                  <Button
                    onClick={stablePool ? stableApproveCallback : approveCallback}
                    disabled={
                      stablePool
                        ? stableApproval !== ApprovalState.NOT_APPROVED || stableApprovalSubmitted
                        : approval !== ApprovalState.NOT_APPROVED || approvalSubmitted
                    }
                    style={{ width: '48%' }}
                    variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                  >
                    {(stablePool ? stableApproval === ApprovalState.PENDING : approval === ApprovalState.PENDING) ? (
                      <AutoRow gap="6px" justify="center">
                        Approving <Loader stroke="white" />
                      </AutoRow>
                    ) : (
                        stablePool
                          ? stableApprovalSubmitted && stableApproval === ApprovalState.APPROVED
                          : approvalSubmitted && approval === ApprovalState.APPROVED
                      ) ? (
                      'Approved'
                    ) : (
                      `Approve ${currencies[Field.INPUT]?.symbol}`
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (stablePool != null) {
                        if (isExpertMode) {
                          handleStableSwap()
                        } else {
                          setSwapState({
                            tradeToConfirm: undefined,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: false,
                            txHash: undefined,
                            showStableSwapConfirm: true,
                            stableSwapOutputAmountToConfirm: parsedAmounts[Field.OUTPUT],
                          })
                        }
                        return
                      }

                      if (isExpertMode) {
                        handleSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined,
                          showStableSwapConfirm: false,
                          stableSwapOutputAmountToConfirm: undefined,
                        })
                      }
                    }}
                    style={{ width: '48%' }}
                    id="swap-button"
                    disabled={
                      !isValid ||
                      (stablePool ? stableApproval !== ApprovalState.APPROVED : approval !== ApprovalState.APPROVED) ||
                      (priceImpactSeverity > 3 && !isExpertMode)
                    }
                    variant={isValid && priceImpactSeverity > 2 ? 'danger' : 'primary'}
                  >
                    {priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Button>
                </RowBetween>
              ) : (
                <Button
                  onClick={() => {
                    if (stablePool != null) {
                      if (isExpertMode) {
                        handleStableSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: undefined,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: false,
                          txHash: undefined,
                          showStableSwapConfirm: true,
                          stableSwapOutputAmountToConfirm: parsedAmounts[Field.OUTPUT],
                        })
                      }
                      return
                    }

                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                        showStableSwapConfirm: false,
                        stableSwapOutputAmountToConfirm: undefined,
                      })
                    }
                  }}
                  id="swap-button"
                  disabled={
                    !isValid ||
                    (priceImpactSeverity > 3 && !isExpertMode) ||
                    (stablePool == null && !!swapCallbackError)
                  }
                  variant={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'danger' : 'primary'}
                  width="100%"
                >
                  {swapInputError ||
                    (priceImpactSeverity > 3 && !isExpertMode
                      ? priceImpactWithoutFee == null
                        ? 'Calculating Price...'
                        : `Price Impact Too High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`)}
                </Button>
              )}
              {showApproveFlow && (
                <ProgressSteps
                  steps={[approval === ApprovalState.APPROVED || stableApproval === ApprovalState.APPROVED]}
                />
              )}
              {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
            </BottomGrouping>
          </CardBody>
        </Wrapper>
      </AppBody>
      {stablePool == null ? (
        <AdvancedSwapDetailsDropdown trade={trade} />
      ) : (
        <AdvancedStableSwapDetailsDropdown
          slippageAdjustedOutputAmount={stableSwapSlippageAdjustedOutputAmount}
          realizedLPFee={realizedLPFee}
          priceImpact={stableSwapPriceImpact}
        />
      )}
    </TradeBodyWrapper>
  )
}

export default Swap
