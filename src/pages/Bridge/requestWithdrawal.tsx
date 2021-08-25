import React, { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Currency, CurrencyAmount, ETHER } from '@yokaiswap/sdk'
import { Button, CardBody, AddIcon, Text } from '@yokaiswap/interface-uikit'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { tryParseAmount } from 'helpers/tryParseAmount'
import { useSUDTTokens } from 'hooks/Tokens'
import bigInt, { zero } from 'big-integer'
import { minWalletCapacity, minWithdrawalCKBAmountBI, MIN_WITHDRAWAL_CELL_CAPACITY } from 'config'
import { GodwokenAccountContext } from 'contexts/Godwoken/contexts'
import { AmountUnit, SUDT as PWSUDT } from '@lay2/pw-core'
import { getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { BridgeBodyWrapper } from 'components/Shared'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { generateWithdrawalData } from 'helpers/godwoken/withdraw'
import { SUDTToken } from 'helpers/SUDTToken'
import { generateLayer1SUDTTypeHash } from 'helpers/godwoken/scripts'
import { polyjuiceHttpProvider } from 'helpers/godwoken/providers'
import type { WithdrawalRequest } from 'godwoken/types'
import { godwoken } from 'helpers/godwoken'
import { Link as HistoryLink, RouteComponentProps } from 'react-router-dom'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components'
import { RowBetween } from 'components/Row'
import QuestionHelper from 'components/QuestionHelper'
import { checkFinalizedCustodianCells } from 'helpers/godwoken/checkFinalizedCustodianCells'
import { useRollupGlobalState } from 'hooks/useRollupGlobalState'
import LoaderIcon from 'components/LoaderIcon'
import CardNav from './CardNav'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import SubmittedModal from './SubmittedModal'
import { ProgressStepper } from './ProgressStepper'

const Tabs = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.colors.text};
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const minWalletCapacityCA = CurrencyAmount.ether(minWalletCapacity.toString())

export default function RequestWithdrawal({ history }: RouteComponentProps) {
  const { account: ethAddress } = useActiveWeb3React()

  // for state invalidate after address changed
  const stateNonceRef = useRef<any>()
  useLayoutEffect(() => {
    stateNonceRef.current = {}
  }, [ethAddress])

  const ckbBalanceL2 = useCurrencyBalance(ethAddress, ETHER)

  const [typedCKBValue, setTypedCKBValue] = useState<string>('')
  const parsedCKBAmount = useMemo(() => tryParseAmount(typedCKBValue, ETHER.decimals), [typedCKBValue])

  const maxCKBAmount = useMemo(
    () =>
      ckbBalanceL2 != null && ckbBalanceL2.greaterThan(minWalletCapacityCA)
        ? ckbBalanceL2.subtract(minWalletCapacityCA)
        : ckbBalanceL2,
    [ckbBalanceL2]
  )
  const handleSetMaxCKBAmount = useCallback(() => {
    if (maxCKBAmount == null) {
      return
    }
    setTypedCKBValue(maxCKBAmount.toExact())
  }, [maxCKBAmount])
  const isAtMaxCKBAmount = useMemo(
    () =>
      parsedCKBAmount != null
        ? parsedCKBAmount.eq(bigInt(maxCKBAmount?.raw.toString() ?? '0'))
        : maxCKBAmount == null || maxCKBAmount.equalTo('0'),
    [parsedCKBAmount, maxCKBAmount]
  )

  const [selectedSUDTToken, setSelectedSUDTToken] = useState<SUDTToken>()
  const handleSUDTCurrencySelect = useCallback((sudtToken: Currency) => {
    if (!(sudtToken instanceof SUDTToken)) {
      console.warn('[warn] invalid sudt token', sudtToken)
    }

    setSelectedSUDTToken(sudtToken as SUDTToken)
  }, [])

  const sudtBalance = useCurrencyBalance(ethAddress, selectedSUDTToken)
  const hasSUDTBalanceBeenFetched = useMemo(() => sudtBalance != null, [sudtBalance])

  const [typedSUDTValue, setTypedSUDTValue] = useState<string>('')
  const parsedSUDTAmount = useMemo(
    () => tryParseAmount(typedSUDTValue, selectedSUDTToken?.decimals),
    [typedSUDTValue, selectedSUDTToken]
  )

  const handleSetMaxSUDTAmount = useCallback(() => {
    setTypedSUDTValue(sudtBalance?.toExact() ?? '')
  }, [sudtBalance])
  const isAtMaxSUDTAmount = useMemo(
    () =>
      parsedSUDTAmount != null
        ? parsedSUDTAmount.eq(bigInt(sudtBalance?.raw.toString() ?? '0'))
        : (sudtBalance?.raw.toString() ?? '0') === '0',
    [parsedSUDTAmount, sudtBalance]
  )

  const inputError = useMemo(() => {
    if (ethAddress == null) {
      return 'Connect Wallet'
    }

    if (parsedCKBAmount == null) {
      return typedCKBValue === '' || typedCKBValue === '0' ? 'Enter CKB amount' : 'Invalid CKB amount'
    }

    if (parsedCKBAmount.lesser(minWithdrawalCKBAmountBI)) {
      return `Minimum ${MIN_WITHDRAWAL_CELL_CAPACITY} CKB`
    }

    if (maxCKBAmount != null && parsedCKBAmount.gt(bigInt(maxCKBAmount.raw.toString()))) {
      return `Insufficient CKB balance`
    }

    if (selectedSUDTToken == null) {
      return void 0
    }

    if (typedSUDTValue !== '' && typedSUDTValue !== '0' && parsedSUDTAmount == null) {
      return `Invalid ${selectedSUDTToken.symbol} amount`
    }

    if (hasSUDTBalanceBeenFetched && Boolean(parsedSUDTAmount?.gt(bigInt(sudtBalance?.raw.toString() ?? '0')))) {
      return `Insufficient ${selectedSUDTToken.symbol} balance`
    }

    return void 0
  }, [
    ethAddress,
    parsedCKBAmount,
    maxCKBAmount,
    selectedSUDTToken,
    typedSUDTValue,
    parsedSUDTAmount,
    hasSUDTBalanceBeenFetched,
    sudtBalance,
    typedCKBValue,
  ])

  const sudtTokens = useSUDTTokens()

  const [isProcessing, setIsProcessing] = useState(false)
  const [shouldShowSubmittedModal, setShouldShowSubmittedModal] = useState<boolean>(false)
  useLayoutEffect(() => {
    setIsProcessing(false)
    setShouldShowSubmittedModal(false)
  }, [ethAddress])

  const { ckbAddress } = useContext(GodwokenAccountContext)
  const {
    data: { lastFinalizedBlockNumber },
    hasBeenFetched: hasLastFinalizedBlockNumberBeenFetched,
  } = useRollupGlobalState()
  const handleRequestWithdrawal = useCallback(async () => {
    if (ethAddress == null || ckbAddress == null || parsedCKBAmount == null) {
      return
    }

    const stateNonce = stateNonceRef.current
    try {
      setIsProcessing(true)

      if (lastFinalizedBlockNumber === 0) {
        throw new Error('Layer 2 vault withdrawable CKB balance not enough.')
      }

      const { hasEnoughCKB, hasEnoughSUDT, collectedCKB, collectedSUDT } = await checkFinalizedCustodianCells(
        {
          ckb: parsedCKBAmount,
          sudt:
            selectedSUDTToken != null && parsedSUDTAmount != null
              ? {
                  type: new PWSUDT(selectedSUDTToken.issuerLockHash),
                  amount: parsedSUDTAmount,
                }
              : undefined,
        },
        lastFinalizedBlockNumber
      )

      if (!hasEnoughCKB) {
        throw new Error(
          `Layer 2 vault withdrawable CKB balance not enough, currently available: ${getFullDisplayAmount(
            collectedCKB,
            AmountUnit.ckb
          )} CKB`
        )
      }

      if (selectedSUDTToken != null && !hasEnoughSUDT) {
        throw new Error(
          `Layer 2 vault withdrawable ${
            selectedSUDTToken.symbol
          } balance not enough, currently available: ${getFullDisplayAmount(
            collectedSUDT,
            selectedSUDTToken.decimals
          )} ${selectedSUDTToken.symbol}`
        )
      }

      const { messageToSign, rawWithdrawalRequest } = await generateWithdrawalData({
        fromETHAddr: ethAddress,
        toCKBAddr: ckbAddress,
        capacity: parsedCKBAmount,
        amount: parsedSUDTAmount ?? zero,
        sudtScriptHash:
          selectedSUDTToken != null && parsedSUDTAmount != null
            ? generateLayer1SUDTTypeHash(new PWSUDT(selectedSUDTToken.issuerLockHash))
            : undefined,
      })
      let signature = await polyjuiceHttpProvider.signer.sign_with_metamask(messageToSign, ethAddress)
      let v = Number.parseInt(signature.slice(-2), 16)
      if (v >= 27) {
        v -= 27
      }
      signature = `${signature.slice(0, -2)}${v.toString(16).padStart(2, '0')}`

      const withdrawalRequest: WithdrawalRequest = {
        raw: rawWithdrawalRequest,
        signature,
      }

      const err = (await godwoken.submitWithdrawalRequest(withdrawalRequest)) as unknown as Error
      if (err != null && err?.message != null) {
        throw new Error(err.message)
      }

      // address had changed, don't update state
      if (stateNonceRef.current !== stateNonce) {
        return
      }

      setShouldShowSubmittedModal(true)
    } catch (err: any) {
      if (err?.code !== 4001 && !err?.message?.includes('User denied')) {
        console.error('failed to deposit', err)
        if (stateNonceRef.current === stateNonce) {
          window.alert(`Failed to request withdrawal:\n${err?.message || err}`)
        }
      }
    } finally {
      if (stateNonceRef.current === stateNonce) {
        setIsProcessing(false)
      }
    }
  }, [ethAddress, ckbAddress, parsedCKBAmount, parsedSUDTAmount, selectedSUDTToken, lastFinalizedBlockNumber])

  const handleDismissSubmittedModal = useCallback(() => {
    setTypedCKBValue('')
    setTypedSUDTValue('')
    setIsProcessing(false)
    setShouldShowSubmittedModal(false)
    history.replace('/bridge/withdrawal')
  }, [history])

  const withdrawalSteps = useMemo(() => ['Request Withdrawal', 'Withdraw to Wallet'], [])

  return (
    <BridgeBodyWrapper>
      <CardNav activeIndex={1} />
      <AppBody>
        <Tabs>
          <RowBetween style={{ padding: '24px' }}>
            <HistoryLink to="/bridge/withdrawal">
              <StyledArrowLeft />
            </HistoryLink>
            <ActiveText>Request Withdrawal</ActiveText>
            <QuestionHelper text="Layer 2 assets will be locked in Withdrawal Request, available to withdraw to layer 1 after maturity." />
          </RowBetween>
        </Tabs>
        <Wrapper>
          <SubmittedModal
            isOpen={shouldShowSubmittedModal}
            onDismiss={handleDismissSubmittedModal}
            title="Request submitted"
          >
            <Text>Request has been sent.</Text>
          </SubmittedModal>
          <CardBody>
            <AutoColumn gap="20px">
              <AutoColumn gap="sm">
                <CurrencyInputPanel
                  value={typedCKBValue}
                  onUserInput={setTypedCKBValue}
                  showMaxButton={maxCKBAmount != null && !maxCKBAmount.equalTo('0') && !isAtMaxCKBAmount}
                  onMax={handleSetMaxCKBAmount}
                  label="Withdraw"
                  currency={ETHER}
                  disableCurrencySelect
                  id="add-liquidity-input-ckb"
                />
                <ColumnCenter>
                  <AddIcon color="textSubtle" />
                </ColumnCenter>
                <CurrencyInputPanel
                  value={typedSUDTValue}
                  onUserInput={setTypedSUDTValue}
                  showMaxButton={
                    hasSUDTBalanceBeenFetched && sudtBalance != null && !sudtBalance.equalTo('0') && !isAtMaxSUDTAmount
                  }
                  onMax={handleSetMaxSUDTAmount}
                  label="sUDT (optional)"
                  currency={selectedSUDTToken}
                  onCurrencySelect={handleSUDTCurrencySelect}
                  tokens={sudtTokens}
                  disableAddTokenByAddress
                  id="add-liquidity-input-sudt"
                />
              </AutoColumn>

              {ethAddress == null ? (
                <ConnectWalletButton width="100%" />
              ) : (
                <Button
                  onClick={handleRequestWithdrawal}
                  disabled={
                    isProcessing ||
                    ckbBalanceL2 == null ||
                    !hasLastFinalizedBlockNumberBeenFetched ||
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
                        Request Withdrawal
                      </Text>
                    </>
                  ) : (
                    inputError ?? 'Request Withdrawal'
                  )}
                </Button>
              )}
            </AutoColumn>
          </CardBody>
          <ProgressStepper currentStep={0} steps={withdrawalSteps} />
        </Wrapper>
      </AppBody>
    </BridgeBodyWrapper>
  )
}
