import styled from 'styled-components'
import Logo from '../Logo'

const CoinLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 24px;
`

export default CoinLogo
