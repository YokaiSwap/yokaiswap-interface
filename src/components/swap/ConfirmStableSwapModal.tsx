import { CurrencyAmount, currencyEquals, Percent, Price } from '@yokaiswap/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'
import StableSwapModalFooter from './StableSwapModalFooter'
import StableSwapModalHeader from './StableSwapModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(outputAmount: CurrencyAmount, originalOutputAmount: CurrencyAmount): boolean {
  return (
    !currencyEquals(outputAmount.currency, originalOutputAmount.currency) || !outputAmount.equalTo(originalOutputAmount)
  )
}

export default function ConfirmStableSwapModal({
  inputAmount,
  outputAmount,
  originalOutputAmount,
  slippageAdjustedOutputAmount,
  priceImpact,
  onAcceptChanges,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  executionPrice,
  realizedLPFee,
}: {
  isOpen: boolean
  inputAmount: CurrencyAmount | undefined
  outputAmount: CurrencyAmount | undefined
  originalOutputAmount: CurrencyAmount | undefined
  slippageAdjustedOutputAmount: CurrencyAmount | undefined
  priceImpact: Percent | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  executionPrice: Price | undefined
  realizedLPFee: CurrencyAmount | undefined
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(outputAmount && originalOutputAmount && tradeMeaningfullyDiffers(outputAmount, originalOutputAmount)),
    [originalOutputAmount, outputAmount]
  )

  const modalHeader = useCallback(() => {
    if (inputAmount == null || outputAmount == null || slippageAdjustedOutputAmount == null || priceImpact == null) {
      return null
    }

    return (
      <StableSwapModalHeader
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        slippageAdjustedOutputAmount={slippageAdjustedOutputAmount}
        priceImpact={priceImpact}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    )
  }, [
    inputAmount,
    outputAmount,
    slippageAdjustedOutputAmount,
    priceImpact,
    onAcceptChanges,
    recipient,
    showAcceptChanges,
  ])

  const modalBottom = useCallback(() => {
    if (
      inputAmount == null ||
      slippageAdjustedOutputAmount == null ||
      priceImpact == null ||
      executionPrice == null ||
      realizedLPFee == null
    ) {
      return null
    }

    return (
      <StableSwapModalFooter
        inputAmount={inputAmount}
        slippageAdjustedOutputAmount={slippageAdjustedOutputAmount}
        onConfirm={onConfirm}
        executionPrice={executionPrice}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        realizedLPFee={realizedLPFee}
        priceImpact={priceImpact}
      />
    )
  }, [
    executionPrice,
    inputAmount,
    onConfirm,
    priceImpact,
    realizedLPFee,
    showAcceptChanges,
    slippageAdjustedOutputAmount,
    swapErrorMessage,
  ])

  // text to show while loading
  const pendingText = `Swapping ${inputAmount?.toSignificant(6)} ${
    inputAmount?.currency?.symbol
  } for ${outputAmount?.toSignificant(6)} ${outputAmount?.currency?.symbol}`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm Swap"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
    />
  )
}
