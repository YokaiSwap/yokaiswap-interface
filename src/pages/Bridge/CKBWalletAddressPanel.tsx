import React, { useCallback, useContext, useState } from 'react'
import styled from 'styled-components'

import { Flex, Text } from '@yokaiswap/interface-uikit'
import { AutoColumn } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { ellipseString } from 'helpers/ellipseString'
import { GodwokenAccountContext } from 'contexts/Godwoken/contexts'
import CopyToClipboard from './CopyToClipboard'

const Address = styled(Text)`
  word-break: break-all;
`

const OutlineCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 16px;
  padding: 16px;
`

export function CKBWalletAddressPanel() {
  const { ckbAddress } = useContext(GodwokenAccountContext)
  const [shouldEllipseAddress, setShouldEllipseAddress] = useState(true)
  const handleDisableAddressEllipsis = useCallback(() => {
    if (!shouldEllipseAddress) {
      return
    }

    setShouldEllipseAddress(false)
  }, [shouldEllipseAddress])

  return (
    <OutlineCard>
      <AutoColumn gap="sm" justify="flex-start">
        <Flex>
          <Text>Wallet Address</Text>
          <QuestionHelper text="Layer 1 CKB address associated with your Ethereum wallet account." />
        </Flex>
        {ckbAddress == null ? (
          <ConnectWalletButton />
        ) : (
          <>
            <Address onDoubleClick={handleDisableAddressEllipsis} title={ckbAddress}>
              {shouldEllipseAddress ? ellipseString(ckbAddress) : ckbAddress}
            </Address>
            <CopyToClipboard toCopy={ckbAddress}>Copy Address</CopyToClipboard>
          </>
        )}
      </AutoColumn>
    </OutlineCard>
  )
}
