import React from 'react'
import styled from 'styled-components'
import { AdvancedStableSwapDetails, AdvancedStableSwapDetailsProps } from './AdvancedStableSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 20px;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.colors.textSubtle};
  z-index: 1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export default function AdvancedStableSwapDetailsDropdown(props: AdvancedStableSwapDetailsProps) {
  const { slippageAdjustedOutputAmount, realizedLPFee, priceImpact } = props
  return (
    <AdvancedDetailsFooter show={Boolean(slippageAdjustedOutputAmount && realizedLPFee && priceImpact)}>
      <AdvancedStableSwapDetails {...props} />
    </AdvancedDetailsFooter>
  )
}
