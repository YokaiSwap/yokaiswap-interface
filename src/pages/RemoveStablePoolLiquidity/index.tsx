import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, Percent, Token, TokenAmount } from '@yokaiswap/sdk'
import { Button, Checkbox, Flex, Text } from '@yokaiswap/interface-uikit'
import { ArrowDown } from 'react-feather'
import { RouteComponentProps } from 'react-router'

import { TradeBodyWrapper } from 'components/Shared'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useI18n from 'hooks/useI18n'
import { useStablePool, useStablePoolSingleWithdrawAmount, useStablePoolWithdrawAmounts } from 'hooks/StablePools'
import { useTokenBalance } from 'state/wallet/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import StablePoolLogo from 'components/StablePoolLogo'
import LoaderIcon from 'components/LoaderIcon'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalStablePoolPositionCard } from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useActiveWeb3React } from '../../hooks'
import { useStableSwapContract } from '../../hooks/useContract'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { calculateSlippageAmount } from '../../utils'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { useUserSlippageTolerance } from '../../state/user/hooks'

const OutlineCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 16px;
  padding: 24px;
`

const Body = styled.div`
  padding-left: 24px;
  padding-right: 24px;
`

enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
}

export default function RemoveStablePoolLiquidity({
  history,
  match: {
    params: { poolAddress },
  },
}: RouteComponentProps<{ poolAddress: string }>) {
  const stablePool = useStablePool(poolAddress)
  const stableSwapContract = useStableSwapContract(poolAddress)
  const liquidityToken = stablePool?.liquidityToken
  const currencies = stablePool?.tokens
  const currencyA = currencies?.[0]
  const currencyB = currencies?.[1]
  const currencyC = currencies?.[2]
  const currencyD = currencies?.[3]
  const { account, chainId, library } = useActiveWeb3React()
  const userLiquidity = useTokenBalance(account, stablePool?.liquidityToken)
  const TranslateString = useI18n()

  const [isWithdrawingMultipleAssets, setIsWithdrawingMultipleAssets] = useState<boolean>(false)
  const handleIsWithdrawingMultipleAssetsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsWithdrawingMultipleAssets(event.target.checked)
  }, [])

  const [independentField, setIndependentField] = useState<Field>(Field.LIQUIDITY_PERCENT)
  const [percentageTypedValue, setPercentageTypedValue] = useState<string>('')
  const [typedValue, setTypedValue] = useState<string>('')
  const [toCurrency, setToCurrency] = useState<Currency | undefined>()
  const toCurrencyIndex = useMemo(
    () => currencies?.findIndex((token) => token.address === (toCurrency as Token | undefined)?.address),
    [currencies, toCurrency]
  )
  const percentToRemove = useMemo(() => {
    if (independentField === Field.LIQUIDITY_PERCENT) {
      return new Percent(percentageTypedValue, '100')
    }

    const amount = tryParseAmount(typedValue, liquidityToken)
    if (amount != null && userLiquidity != null && !amount.greaterThan(userLiquidity)) {
      return new Percent(amount.raw, userLiquidity.raw)
    }

    return new Percent('0', '100')
  }, [independentField, typedValue, liquidityToken, userLiquidity, percentageTypedValue])
  const parsedLiquidityAmount = useMemo(() => {
    if (userLiquidity == null || percentToRemove.equalTo('0')) {
      return undefined
    }

    return new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
  }, [percentToRemove, userLiquidity])

  const formattedAmounts = {
    percentage: percentToRemove.equalTo('0')
      ? '0'
      : percentToRemove.lessThan(new Percent('1', '100'))
      ? '<1'
      : percentToRemove.toFixed(0),
    liquidity: independentField === Field.LIQUIDITY ? typedValue : parsedLiquidityAmount?.toSignificant(6) ?? '',
  }

  const withdrawAmounts = useStablePoolWithdrawAmounts(stablePool, stableSwapContract, parsedLiquidityAmount)
  const singleWithdrawAmount = useStablePoolSingleWithdrawAmount(
    stablePool,
    stableSwapContract,
    parsedLiquidityAmount,
    toCurrencyIndex === -1 ? undefined : toCurrencyIndex
  )

  const currencyASymbol = currencies?.[0]?.symbol
  const currencyBSymbol = currencies?.[1]?.symbol
  const currencyCSymbol = currencies?.[2]?.symbol
  const currencyDSymbol = currencies?.[3]?.symbol
  const currencyAAmountAndSymbol = `${withdrawAmounts[0]?.toSignificant(6) ?? '0'} ${currencyASymbol}`
  const currencyBAmountAndSymbol = `${withdrawAmounts[1]?.toSignificant(6) ?? '0'} ${currencyBSymbol}`
  const currencyCAmountAndSymbol = `${withdrawAmounts[2]?.toSignificant(6) ?? '0'} ${currencyCSymbol}`
  const currencyDAmountAndSymbol = `${withdrawAmounts[3]?.toSignificant(6) ?? '0'} ${currencyDSymbol}`
  const pendingText = isWithdrawingMultipleAssets
    ? `Removing ${currencyAAmountAndSymbol}${
        currencies?.length === 2
          ? ` and ${currencyBAmountAndSymbol}`
          : `, ${currencyBAmountAndSymbol}, ${
              currencies?.length === 3
                ? `and ${currencyCAmountAndSymbol}`
                : `, ${currencyCAmountAndSymbol}, and ${currencyDAmountAndSymbol}`
            } `
      }`
    : `Removing ${singleWithdrawAmount?.toSignificant(6) ?? '0'} ${toCurrency?.symbol}`

  let error: string | undefined
  const isValid = !error
  if (!account) {
    error = 'Connect Wallet'
  }
  if (parsedLiquidityAmount == null) {
    error = error ?? 'Enter an amount'
  }

  const theme = useContext(ThemeContext)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [allowedSlippage] = useUserSlippageTolerance()

  const atMaxAmount = percentToRemove.equalTo(new Percent('1'))

  // allowance handling
  const [approval, approveCallback] = useApproveCallback(parsedLiquidityAmount, poolAddress)

  const onLiquidityInput = useCallback((val: string): void => {
    setIndependentField(Field.LIQUIDITY)
    setTypedValue(val)
  }, [])

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !stablePool || !stableSwapContract) {
      return
    }

    if (parsedLiquidityAmount == null) {
      throw new Error('missing liquidity amount')
    }

    // let estimate = stableSwapContract.estimateGas.remove_liquidity_one_coin
    let method: (...args: any) => Promise<TransactionResponse> = stableSwapContract.remove_liquidity_one_coin
    let args: Array<string | string[] | number> = [
      parsedLiquidityAmount.raw.toString(),
      toCurrencyIndex ?? 0,
      singleWithdrawAmount ? calculateSlippageAmount(singleWithdrawAmount, allowedSlippage)[0].toString() : '0',
    ]
    if (isWithdrawingMultipleAssets) {
      if (withdrawAmounts.length !== stablePool.tokens.length) {
        throw new Error('invalid withdraw amounts')
      }

      // estimate = stableSwapContract.estimateGas.remove_liquidity
      method = stableSwapContract.remove_liquidity
      args = [
        parsedLiquidityAmount.raw.toString(),
        withdrawAmounts.map((withdrawAmount) => calculateSlippageAmount(withdrawAmount, allowedSlippage)[0].toString()),
      ]
    }

    setAttemptingTxn(true)
    // estimate(...args)
    //   .then((estimatedGasLimit) =>
    method(...args, {
      // gasLimit: calculateGasMargin(estimatedGasLimit),
      gasLimit: 12_500_000,
      gasPrice: 0,
    })
      .then((response: TransactionResponse) => {
        setAttemptingTxn(false)

        addTransaction(response, {
          summary: `Remove liquidity from ${stablePool.name}`,
        })

        setTxHash(response.hash)
      })
      // )
      .catch((e: Error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        console.error(e)
      })
  }

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        {isWithdrawingMultipleAssets ? (
          <>
            <RowBetween align="flex-end">
              <Text fontSize="24px">{withdrawAmounts[0]?.toSignificant(6)}</Text>
              <RowFixed gap="4px">
                <CurrencyLogo currency={currencyA} size="24px" />
                <Text fontSize="24px" style={{ marginLeft: '10px' }}>
                  {currencyASymbol}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween align="flex-end">
              <Text fontSize="24px">{withdrawAmounts[1]?.toSignificant(6)}</Text>
              <RowFixed gap="4px">
                <CurrencyLogo currency={currencyB} size="24px" />
                <Text fontSize="24px" style={{ marginLeft: '10px' }}>
                  {currencyBSymbol}
                </Text>
              </RowFixed>
            </RowBetween>
            {currencyC && (
              <RowBetween align="flex-end">
                <Text fontSize="24px">{withdrawAmounts[2]?.toSignificant(6)}</Text>
                <RowFixed gap="4px">
                  <CurrencyLogo currency={currencyC} size="24px" />
                  <Text fontSize="24px" style={{ marginLeft: '10px' }}>
                    {currencyC.symbol}
                  </Text>
                </RowFixed>
              </RowBetween>
            )}
            {currencyD && (
              <RowBetween align="flex-end">
                <Text fontSize="24px">{withdrawAmounts[3]?.toSignificant(6)}</Text>
                <RowFixed gap="4px">
                  <CurrencyLogo currency={currencyD} size="24px" />
                  <Text fontSize="24px" style={{ marginLeft: '10px' }}>
                    {currencyD.symbol}
                  </Text>
                </RowFixed>
              </RowBetween>
            )}
          </>
        ) : (
          <RowBetween align="flex-end">
            <Text fontSize="24px">{singleWithdrawAmount?.toSignificant(6)}</Text>
            <RowFixed gap="4px">
              <CurrencyLogo currency={toCurrency} size="24px" />
              <Text fontSize="24px" style={{ marginLeft: '10px' }}>
                {toCurrency?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        )}

        <Text small color="textSubtle" textAlign="left" padding="12px 0 0 0" style={{ fontStyle: 'italic' }}>
          {`Output is estimated. If the price changes by more than ${
            allowedSlippage / 100
          }% your transaction will revert.`}
        </Text>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color="textSubtle">{`LP ${liquidityToken?.symbol}`} Burned</Text>
          <RowFixed>
            <StablePoolLogo pool={stablePool ?? undefined} size="16px" style={{ marginRight: 13.333333 }} />
            <Text>{parsedLiquidityAmount?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        <Button disabled={approval !== ApprovalState.APPROVED} onClick={onRemove}>
          {TranslateString(1136, 'Confirm')}
        </Button>
      </>
    )
  }

  const handleSelectCurrency = useCallback((currency: Currency) => {
    setToCurrency(currency)
  }, [])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setPercentageTypedValue('0')
    }
    setTxHash('')
  }, [txHash])

  const liquidityPercentChangeCallback = useCallback((value: number) => {
    setIndependentField(Field.LIQUIDITY_PERCENT)
    setPercentageTypedValue(value.toString())
  }, [])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(percentToRemove.toFixed(0)),
    liquidityPercentChangeCallback
  )

  useEffect(() => {
    if (stablePool == null) {
      history.push(`/liquidity`)
    }
  }, [history, stablePool])

  return (
    <TradeBodyWrapper>
      <AppBody>
        <AddRemoveTabs adding={false} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash || ''}
            content={() => (
              <ConfirmationModalContent
                title={TranslateString(1156, 'You will receive')}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="md">
            <Body>
              <OutlineCard>
                <AutoColumn>
                  <RowBetween>
                    <Text>Amount</Text>
                  </RowBetween>
                  <Flex justifyContent="start">
                    <Text fontSize="64px">{formattedAmounts.percentage}%</Text>
                  </Flex>
                  <Flex mb="8px">
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                  </Flex>
                  <Flex justifyContent="space-around">
                    <Button
                      variant="tertiary"
                      scale="sm"
                      onClick={() => {
                        setIndependentField(Field.LIQUIDITY_PERCENT)
                        setPercentageTypedValue('25')
                      }}
                    >
                      25%
                    </Button>
                    <Button
                      variant="tertiary"
                      scale="sm"
                      onClick={() => {
                        setIndependentField(Field.LIQUIDITY_PERCENT)
                        setPercentageTypedValue('50')
                      }}
                    >
                      50%
                    </Button>
                    <Button
                      variant="tertiary"
                      scale="sm"
                      onClick={() => {
                        setIndependentField(Field.LIQUIDITY_PERCENT)
                        setPercentageTypedValue('75')
                      }}
                    >
                      75%
                    </Button>
                    <Button
                      variant="tertiary"
                      scale="sm"
                      onClick={() => {
                        setIndependentField(Field.LIQUIDITY_PERCENT)
                        setPercentageTypedValue('100')
                      }}
                    >
                      {TranslateString(166, 'Max')}
                    </Button>
                  </Flex>
                </AutoColumn>
              </OutlineCard>
            </Body>
            <Body>
              <CurrencyInputPanel
                value={formattedAmounts.liquidity}
                onUserInput={onLiquidityInput}
                onMax={() => {
                  setIndependentField(Field.LIQUIDITY_PERCENT)
                  setPercentageTypedValue('100')
                }}
                showMaxButton={!atMaxAmount}
                disableCurrencySelect
                currency={liquidityToken}
                id="liquidity-amount"
              />
              <label htmlFor="checkbox" style={{ display: 'block', cursor: 'pointer', marginTop: 12 }}>
                <Flex alignItems="center">
                  <div style={{ flex: 'none' }}>
                    <Checkbox
                      id="checkbox"
                      scale="sm"
                      checked={isWithdrawingMultipleAssets}
                      onChange={handleIsWithdrawingMultipleAssetsChange}
                    />
                  </div>
                  <Text ml="8px">{TranslateString(1096, 'Withdraw multiple assets')}</Text>
                </Flex>
              </label>
            </Body>
            <ColumnCenter>
              <ArrowDown size="16" color={theme.colors.textSubtle} />
            </ColumnCenter>
            <Body style={{ paddingBottom: '24px' }}>
              {isWithdrawingMultipleAssets ? (
                <OutlineCard>
                  <AutoColumn gap="10px">
                    <RowBetween>
                      <Text fontSize="24px">{withdrawAmounts[0]?.toSignificant(6) ?? '-'}</Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
                        <Text fontSize="24px" id="remove-liquidity-token-a-symbol">
                          {currencyASymbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <Text fontSize="24px">{withdrawAmounts[1]?.toSignificant(6) ?? '-'}</Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
                        <Text fontSize="24px" id="remove-liquidity-token-b-symbol">
                          {currencyBSymbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    {currencyC && (
                      <RowBetween>
                        <Text fontSize="24px">{withdrawAmounts[2]?.toSignificant(6) ?? '-'}</Text>
                        <RowFixed>
                          <CurrencyLogo currency={currencyC} style={{ marginRight: '12px' }} />
                          <Text fontSize="24px" id="remove-liquidity-token-c-symbol">
                            {currencyCSymbol}
                          </Text>
                        </RowFixed>
                      </RowBetween>
                    )}
                    {currencyD && (
                      <RowBetween>
                        <Text fontSize="24px">{withdrawAmounts[3]?.toSignificant(6) ?? '-'}</Text>
                        <RowFixed>
                          <CurrencyLogo currency={currencyD} style={{ marginRight: '12px' }} />
                          <Text fontSize="24px" id="remove-liquidity-token-d-symbol">
                            {currencyDSymbol}
                          </Text>
                        </RowFixed>
                      </RowBetween>
                    )}
                  </AutoColumn>
                </OutlineCard>
              ) : (
                <CurrencyInputPanel
                  disabled
                  hideBalance
                  value={singleWithdrawAmount?.toSignificant(6) ?? ''}
                  onMax={() => {
                    setIndependentField(Field.LIQUIDITY_PERCENT)
                    setPercentageTypedValue('100')
                  }}
                  onUserInput={() => {
                    // ignored
                  }}
                  showMaxButton={false}
                  currency={toCurrency}
                  label="Output (estimated)"
                  onCurrencySelect={handleSelectCurrency}
                  id="remove-liquidity-token-a"
                  tokens={currencies ?? []}
                  disableAddTokenByAddress
                />
              )}
              <div style={{ position: 'relative', marginTop: 12 }}>
                {!account ? (
                  <ConnectWalletButton width="100%" />
                ) : (
                  <RowBetween>
                    <Button
                      onClick={approveCallback}
                      variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                      disabled={approval !== ApprovalState.NOT_APPROVED}
                      mr="8px"
                    >
                      {approval === ApprovalState.PENDING ? (
                        <>
                          <LoaderIcon spin color="currentColor" />
                          <Text ml="4px" color="currentColor">
                            Approve
                          </Text>
                        </>
                      ) : approval === ApprovalState.APPROVED ? (
                        'Approved'
                      ) : (
                        'Approve'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      disabled={
                        !isValid ||
                        approval !== ApprovalState.APPROVED ||
                        (!isWithdrawingMultipleAssets && toCurrency == null)
                      }
                      variant={
                        !isValid &&
                        (isWithdrawingMultipleAssets
                          ? withdrawAmounts.length === stablePool?.tokens.length
                          : singleWithdrawAmount != null)
                          ? 'danger'
                          : 'primary'
                      }
                    >
                      {error || 'Remove'}
                    </Button>
                  </RowBetween>
                )}
              </div>
            </Body>
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {stablePool != null && stableSwapContract != null ? (
        <AutoColumn style={{ minWidth: '20rem', marginTop: '1rem' }}>
          <MinimalStablePoolPositionCard pool={stablePool} contract={stableSwapContract} />
        </AutoColumn>
      ) : null}
    </TradeBodyWrapper>
  )
}
