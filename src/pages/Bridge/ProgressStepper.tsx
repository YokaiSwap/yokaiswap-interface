import React from 'react'
import styled from 'styled-components'
import { Text, Flex } from '@yokaiswap/interface-uikit'
import { Check } from 'react-feather'

const Wrapper = styled(Flex)`
  border-top: 1px solid ${({ theme }) => theme.colors.borderColor};
  padding: 24px;
`

const Circle = styled.div<{ disabled?: boolean; isActive?: boolean }>`
  min-width: 20px;
  min-height: 20px;
  background-color: ${({ theme, disabled, isActive }) =>
    disabled ? '#68667B' : isActive ? theme.colors.primary : theme.colors.success};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 8px;
  font-size: 12px;
  color: ${({ theme, disabled }) => (disabled ? '#9F9EA6' : theme.colors.text)};
`

const CircleRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;

  &:not(:last-of-type) {
    margin-bottom: 20px;
    &::after {
      content: '';
      width: 1px;
      height: 12px;
      background: white;
      position: absolute;
      left: 10px;
      bottom: -4px;
      transform: translateY(100%);
    }
  }
`

const StepText = styled(Text)<{ disabled?: boolean; isActive?: boolean }>`
  color: ${({ theme, disabled }) => (disabled ? '#68667B' : theme.colors.text)};
  font-weight: ${({ isActive }) => (isActive ? 500 : 400)};
`

interface IProgressStepperProps {
  currentStep: number
  steps: string[]
}

export function ProgressStepper({ currentStep, steps }: IProgressStepperProps) {
  if (steps.length === 0) {
    return null
  }

  return (
    <Wrapper justifyContent="center">
      <Flex flexDirection="column">
        {steps.map((step, i) => {
          return (
            <CircleRow key={step}>
              <Circle disabled={i > currentStep} isActive={i === currentStep}>
                {i < currentStep ? <Check size="12px" /> : i + 1}
              </Circle>
              <StepText ml="8px" disabled={i > currentStep} isActive={i === currentStep}>
                {steps[i]}
              </StepText>
            </CircleRow>
          )
        })}
      </Flex>
    </Wrapper>
  )
}
