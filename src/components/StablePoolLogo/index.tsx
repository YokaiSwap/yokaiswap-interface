import { IStablePool } from 'constants/stablePools'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import Logo from '../Logo'

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function StablePoolLogo({
  pool,
  size = '24px',
  style,
}: {
  pool?: IStablePool
  size?: string
  style?: React.CSSProperties
}) {
  const srcs: string[] = useMemo(() => {
    return [`/images/pools/${pool?.address ?? 'pool'}.png`]
  }, [pool])

  return <StyledLogo size={size} srcs={srcs} alt={`${pool?.name ?? 'token'} logo`} style={style} />
}
