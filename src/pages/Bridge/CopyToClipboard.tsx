import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Text, CopyIcon } from '@yokaiswap/interface-uikit'
import { copyTextToClipboard } from 'helpers/clipboard'

interface Props {
  toCopy: string
}

const StyleButton = styled(Text).attrs({ role: 'button' })`
  position: relative;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
`

const Tooltip = styled.div<{ isTooltipDisplayed: boolean }>`
  display: ${({ isTooltipDisplayed }) => (isTooltipDisplayed ? 'block' : 'none')};
  position: absolute;
  bottom: -22px;
  right: 0;
  left: 0;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.contrast};
  color: ${({ theme }) => theme.colors.invertedContrast};
  border-radius: 16px;
  opacity: 0.7;
`

const CopyToClipboard: React.FC<Props> = ({ toCopy, children, ...props }) => {
  const [isTooltipDisplayed, setIsTooltipDisplayed] = useState(false)

  const isUnmounted = useRef(false)
  useEffect(() => {
    return () => {
      isUnmounted.current = true
    }
  }, [])

  return (
    <StyleButton
      small
      bold
      onClick={useCallback(async () => {
        const isSuccessful = await copyTextToClipboard(toCopy)
        if (!isSuccessful) {
          window.prompt('Failed to copy, please copy manually:', toCopy)
          return
        }

        if (isUnmounted.current) {
          return
        }

        setIsTooltipDisplayed(true)
        setTimeout(() => {
          if (isUnmounted.current) {
            return
          }
          setIsTooltipDisplayed(false)
        }, 1000)
      }, [toCopy])}
      {...props}
    >
      {children}
      <CopyIcon width="20px" color="primary" ml="4px" />
      <Tooltip isTooltipDisplayed={isTooltipDisplayed}>Copied</Tooltip>
    </StyleButton>
  )
}

export default CopyToClipboard
