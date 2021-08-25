import { CardBody, Text, AddIcon, Button } from '@yokaiswap/interface-uikit'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { BridgeBodyWrapper } from 'components/Shared'
import { Link as HistoryLink, Redirect, RouteComponentProps } from 'react-router-dom'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components'
import { RowBetween } from 'components/Row'
import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import QuestionHelper from 'components/QuestionHelper'
import { WithdrawalRequestsContext } from 'contexts/WithdrawalRequestsContext'
import { useSUDTCurrency } from 'hooks/useSUDTCurrency'
import LoaderIcon from 'components/LoaderIcon'
import { parseAddress, LumosConfigs, AmountUnit } from '@lay2/pw-core'
import { chainId as configChainId } from 'config'
import { useActiveWeb3React } from 'hooks'
import { ChainId, ETHER } from '@yokaiswap/sdk'
import CKBAddressInputPanel from 'components/CKBAddressInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import { zero } from 'big-integer'
import { getDisplayAmount, getFullDisplayAmount } from 'helpers/formatTokenAmount'
import { GodwokenAccountContext, GodwokenBaseContext } from 'contexts/Godwoken/contexts'
import { ILayer1TxHistory, Layer1TxType, useLayer1TxHistory } from 'hooks/useLayer1TxHistory'
import { WithdrawalUnlockTXBuilder } from 'helpers/godwoken/WithdrawalUnlockTXBuilder'
import { PendingLayer1TxnsContext } from 'contexts/PendingLayer1TxnsContext'
import CardNav from './CardNav'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import { ProgressStepper } from './ProgressStepper'
import SubmittedModal from './SubmittedModal'

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

export default function UnlockWithdrawal({
  history,
  match: {
    params: { withdrawalRequestOutPoint },
  },
}: RouteComponentProps<{ withdrawalRequestOutPoint?: string }>) {
  const { account: ethAddress, chainId } = useActiveWeb3React()
  const {
    withdrawalRequests: { data: withdrawalRequests },
  } = useContext(WithdrawalRequestsContext)

  const withdrawalRequest = useMemo(
    () => withdrawalRequests.find(({ outPoint }) => outPoint === withdrawalRequestOutPoint),
    [withdrawalRequestOutPoint, withdrawalRequests]
  )

  const { issuerLockHash, sudtAmount, ckbAmount } = useMemo(
    () => ({
      issuerLockHash: withdrawalRequest?.cell.type?.args,
      sudtAmount: withdrawalRequest?.amount,
      ckbAmount: withdrawalRequest?.capacity,
    }),
    [withdrawalRequest]
  )
  const { layer2Currency: sudtCurrency, decimals: sudtDecimals, symbol: sudtSymbol } = useSUDTCurrency(issuerLockHash)

  const [sudtAmountStr, sudtFullAmountStr] = useMemo(() => {
    if (sudtAmount == null || sudtAmount.eq(zero)) {
      return ['', '']
    }

    return [
      `${getDisplayAmount(sudtAmount, sudtDecimals)} ${sudtSymbol}`,
      `${getFullDisplayAmount(sudtAmount, sudtDecimals)} ${sudtSymbol}`,
    ]
  }, [sudtAmount, sudtDecimals, sudtSymbol])

  const [ckbAmountStr, ckbFullAmountStr] = useMemo(() => {
    if (ckbAmount == null) {
      return ['', '']
    }

    if (ckbAmount.eq(zero)) {
      console.error('[warn] a withdrawal request cell with zero capacity')
      return ['', '']
    }

    return [
      `${getDisplayAmount(ckbAmount, AmountUnit.ckb)} CKB`,
      `${getFullDisplayAmount(ckbAmount, AmountUnit.ckb)} CKB`,
    ]
  }, [ckbAmount])

  const [typedAddress, setTypedAddress] = useState('')

  const inputError: string | undefined = useMemo(() => {
    if (typedAddress === '') {
      return 'Enter CKB address'
    }

    try {
      const lumosConfig =
        LumosConfigs[configChainId === ChainId.GWDEVNET || configChainId === ChainId.GWTESTNET ? 1 : 0]
      parseAddress(typedAddress, {
        config: lumosConfig,
      })

      // if (
      //   AddressCodeHash !== lumosConfig.SCRIPTS.SECP256K1_BLAKE160.SCRIPT.code_hash ||
      //   AddressCodeHash !== lumosConfig.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT.code_hash
      // ) {
      // }
      return void 0
    } catch (err: any) {
      console.warn('[warn] Failed to parse ckb address', err)
    }

    return 'Invalid CKB address'
  }, [typedAddress])

  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string>()
  const [shouldShowSubmittedModal, setShouldShowSubmittedModal] = useState<boolean>(false)
  // for state invalidate after address changed
  const stateNonceRef = useRef<any>()
  useLayoutEffect(() => {
    setIsProcessing(false)
    setTxHash(void 0)
    setShouldShowSubmittedModal(false)
    stateNonceRef.current = {}
  }, [ethAddress])

  const { pwCore } = useContext(GodwokenBaseContext)
  const { pwAddress } = useContext(GodwokenAccountContext)

  const txHistoryStorageKey = useMemo(
    () => (chainId != null && ethAddress != null ? `@${chainId}@${ethAddress}/bridge-withdrawal-history` : undefined),
    [chainId, ethAddress]
  )
  const { addTxnToHistory } = useLayer1TxHistory(txHistoryStorageKey)
  const { addPendingTxn } = useContext(PendingLayer1TxnsContext)

  const handleUnlockWithdrawal = useCallback(async () => {
    if (ethAddress == null || pwCore == null || pwAddress == null || withdrawalRequest == null || typedAddress === '') {
      return
    }

    const stateNonce = stateNonceRef.current
    try {
      setIsProcessing(true)

      const builder = new WithdrawalUnlockTXBuilder({
        ownerAddress: pwAddress,
        toCKBAddress: typedAddress,
        withdrawalCell: withdrawalRequest.cell,
      })
      const inerrTxHash = await pwCore.sendTransaction(builder)

      const newTxHistory: ILayer1TxHistory = {
        type: Layer1TxType.withdrawal,
        txHash: inerrTxHash,
        capacity: ckbAmount?.toString() ?? '0',
        amount: sudtAmount?.toString() ?? '0',
        symbol: sudtSymbol ?? '',
        decimals: sudtDecimals,
        outPoint: withdrawalRequest.outPoint,
      }

      addTxnToHistory(newTxHistory)

      // address had changed, don't update state
      if (stateNonceRef.current !== stateNonce) {
        return
      }

      setTxHash(inerrTxHash)
      addPendingTxn(newTxHistory)
    } catch (err: any) {
      if (err?.code !== 4001 && !err?.message?.includes('User denied')) {
        console.error('failed to withdraw', err)
        if (stateNonceRef.current === stateNonce) {
          window.alert(`Failed to withdraw:\n${err?.message || err}`)
        }
      }
    } finally {
      if (stateNonceRef.current === stateNonce) {
        setIsProcessing(false)
      }
    }
  }, [
    addPendingTxn,
    addTxnToHistory,
    ckbAmount,
    ethAddress,
    pwAddress,
    pwCore,
    sudtAmount,
    sudtDecimals,
    sudtSymbol,
    typedAddress,
    withdrawalRequest,
  ])

  useEffect(() => {
    if (txHash == null) {
      return
    }

    setShouldShowSubmittedModal(true)
  }, [txHash])

  const handleDismissSubmittedModal = useCallback(() => {
    // if there was a tx hash, we want to clear the input
    setTxHash(void 0)
    setShouldShowSubmittedModal(false)
    if (txHash) {
      history.replace('/bridge/withdrawal')
    }
  }, [txHash, history])

  const withdrawalSteps = useMemo(() => ['Request Withdrawal', 'Withdraw to Wallet'], [])

  if (ethAddress == null || withdrawalRequest == null) {
    return <Redirect to="/bridge/withdrawal" />
  }

  return (
    <BridgeBodyWrapper>
      <CardNav activeIndex={1} />
      <AppBody>
        <Wrapper>
          <Tabs>
            <RowBetween style={{ padding: '24px' }}>
              <HistoryLink to="/bridge/withdrawal">
                <StyledArrowLeft />
              </HistoryLink>
              <ActiveText>Withdraw to Wallet</ActiveText>
              <QuestionHelper text="Withdrawals can often be dropped due to the fact that chain state is changing constantly, please be patient and keep trying." />
            </RowBetween>
          </Tabs>
          <SubmittedModal
            isOpen={shouldShowSubmittedModal}
            onDismiss={handleDismissSubmittedModal}
            hash={txHash}
            chainId={chainId}
          />
          <CardBody>
            <AutoColumn gap="20px">
              <AutoColumn gap="sm">
                {issuerLockHash != null ? (
                  <>
                    <ColumnCenter>
                      <CurrencyLogo currency={sudtCurrency} size="32px" />
                      <Text fontSize="24px" title={sudtFullAmountStr}>
                        {sudtAmountStr}
                      </Text>
                    </ColumnCenter>
                    <ColumnCenter>
                      <AddIcon color="textSubtle" />
                    </ColumnCenter>
                  </>
                ) : null}
                <ColumnCenter>
                  <CurrencyLogo currency={ETHER} size="32px" />
                  <Text fontSize="24px" title={ckbFullAmountStr}>
                    {ckbAmountStr}
                  </Text>
                </ColumnCenter>
              </AutoColumn>
              <CKBAddressInputPanel
                id="ckb-address-input"
                value={typedAddress}
                onChange={setTypedAddress}
                hasError={inputError != null && inputError !== 'Enter CKB address'}
              />
              <Button
                onClick={handleUnlockWithdrawal}
                disabled={isProcessing || typedAddress === '' || inputError != null}
                variant={inputError != null && typedAddress !== '' ? 'danger' : 'primary'}
                width="100%"
              >
                {isProcessing ? (
                  <>
                    <LoaderIcon spin color="currentColor" />
                    <Text ml="4px" color="currentColor">
                      Withdraw
                    </Text>
                  </>
                ) : (
                  inputError ?? 'Withdraw'
                )}
              </Button>
            </AutoColumn>
          </CardBody>
          <ProgressStepper currentStep={1} steps={withdrawalSteps} />
        </Wrapper>
      </AppBody>
    </BridgeBodyWrapper>
  )
}
