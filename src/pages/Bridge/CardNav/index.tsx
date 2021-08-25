import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { ButtonMenu, ButtonMenuItem } from '@yokaiswap/interface-uikit'

const StyledNav = styled.div`
  margin-bottom: 40px;
`

function Nav({ activeIndex = 0 }: { activeIndex?: number }) {
  return (
    <StyledNav>
      <ButtonMenu activeIndex={activeIndex} scale="sm" variant="subtle">
        <ButtonMenuItem id="deposit-nav-link" to="/bridge/deposit" as={Link}>
          Deposit
        </ButtonMenuItem>
        <ButtonMenuItem id="withdrawal-nav-link" to="/bridge/withdrawal" as={Link}>
          Withdrawal
        </ButtonMenuItem>
        <ButtonMenuItem id="transfer-nav-link" to="/bridge/transfer" as={Link}>
          Transfer
        </ButtonMenuItem>
      </ButtonMenu>
    </StyledNav>
  )
}

export default Nav
