import React, { useContext } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'
import { Text, LinkExternal } from '@yokaiswap/interface-uikit'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { getCKBExplorerLink } from 'utils'
import { ellipseString } from 'helpers/ellipseString'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function Layer1TransactionPopup({
  hash,
  success,
  summary,
}: {
  hash: string
  success?: boolean
  summary?: string
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {success ? (
          <CheckCircle color={theme.colors.success} size={24} />
        ) : (
          <AlertCircle color={theme.colors.failure} size={24} />
        )}
      </div>
      <AutoColumn gap="8px">
        <Text title={hash}>{summary ?? `Hash: ${ellipseString(hash, 8)}`}</Text>
        {chainId != null && (
          <LinkExternal href={getCKBExplorerLink(chainId, hash, 'transaction')}>View on Explorer</LinkExternal>
        )}
      </AutoColumn>
    </RowNoFlex>
  )
}
