import React, { useState } from 'react'
import { JSBI, Pair, Percent } from '@yokaiswap/sdk'
import { Button, Card as UIKitCard, CardBody, Text } from '@yokaiswap/interface-uikit'
import { darken } from 'polished'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { IStablePool } from 'constants/stablePools'
import { Contract } from 'ethers'
import StablePoolLogo from 'components/StablePoolLogo'
import { useStablePoolWithdrawAmounts } from 'hooks/StablePools'
import { useStableSwapContract } from 'hooks/useContract'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import Card from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.invertedContrast};
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.colors.invertedContrast)};
  }
`

interface PositionCardProps {
  pair: Pair
  // eslint-disable-next-line react/no-unused-prop-types
  showUnwrapped?: boolean
}

export function MinimalPositionCard({ pair, showUnwrapped = false }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && (
        <UIKitCard>
          <CardBody>
            <AutoColumn gap="12px">
              <FixedHeightRow>
                <RowFixed>
                  <Text style={{ textTransform: 'uppercase', fontWeight: 600 }} fontSize="14px" color="textSubtle">
                    LP Tokens in your Wallet
                  </Text>
                </RowFixed>
              </FixedHeightRow>
              <FixedHeightRow onClick={() => setShowMore(!showMore)}>
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin size={20} />
                  <Text fontSize="14px">
                    {currency0.symbol}/{currency1.symbol}
                  </Text>
                </RowFixed>
                <RowFixed>
                  <Text fontSize="14px">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
                </RowFixed>
              </FixedHeightRow>
              <AutoColumn gap="4px">
                <FixedHeightRow>
                  <Text fontSize="14px">{currency0.symbol}:</Text>
                  {token0Deposited ? (
                    <RowFixed>
                      <Text ml="6px" fontSize="14px">
                        {token0Deposited?.toSignificant(6)}
                      </Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
                <FixedHeightRow>
                  <Text fontSize="14px">{currency1.symbol}:</Text>
                  {token1Deposited ? (
                    <RowFixed>
                      <Text ml="6px" fontSize="14px">
                        {token1Deposited?.toSignificant(6)}
                      </Text>
                    </RowFixed>
                  ) : (
                    '-'
                  )}
                </FixedHeightRow>
              </AutoColumn>
            </AutoColumn>
          </CardBody>
        </UIKitCard>
      )}
    </>
  )
}

export default function FullPositionCard({ pair }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow onClick={() => setShowMore(!showMore)} style={{ cursor: 'pointer' }}>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin size={20} />
            <Text>{!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}</Text>
          </RowFixed>
          <RowFixed>
            {showMore ? (
              <ChevronUp size="20" style={{ marginLeft: '10px' }} />
            ) : (
              <ChevronDown size="20" style={{ marginLeft: '10px' }} />
            )}
          </RowFixed>
        </FixedHeightRow>
        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <RowFixed>
                <Text>Pooled {currency0.symbol}:</Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text ml="6px">{token0Deposited?.toSignificant(6)}</Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <Text>Pooled {currency1.symbol}:</Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text ml="6px">{token1Deposited?.toSignificant(6)}</Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Your pool tokens:</Text>
              <Text>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Your pool share:</Text>
              <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(2)}%` : '-'}</Text>
            </FixedHeightRow>

            <RowBetween marginTop="10px">
              <Button
                as={Link}
                to={`/liquidity/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                style={{ width: '48%' }}
              >
                Add
              </Button>
              <Button
                as={Link}
                style={{ width: '48%' }}
                to={`/liquidity/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
              >
                Remove
              </Button>
            </RowBetween>
          </AutoColumn>
        )}
      </AutoColumn>
    </HoverCard>
  )
}

interface IMinimalStablePoolPositionCardProps {
  pool: IStablePool
  contract: Contract
}

export function MinimalStablePoolPositionCard({ pool, contract }: IMinimalStablePoolPositionCardProps) {
  const { account } = useActiveWeb3React()

  const userPoolBalance = useTokenBalance(account, pool.liquidityToken)

  const depositedAmounts = useStablePoolWithdrawAmounts(pool, contract, userPoolBalance)

  return (
    <>
      {userPoolBalance && (
        <UIKitCard>
          <CardBody>
            <AutoColumn gap="12px">
              <FixedHeightRow>
                <RowFixed>
                  <Text style={{ textTransform: 'uppercase', fontWeight: 600 }} fontSize="14px" color="textSubtle">
                    LP Tokens in your Wallet
                  </Text>
                </RowFixed>
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <StablePoolLogo pool={pool} size="20px" style={{ marginRight: 14.66666666666 }} />
                  <Text fontSize="14px">{pool.liquidityToken.symbol}</Text>
                </RowFixed>
                <RowFixed>
                  <Text fontSize="14px">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
                </RowFixed>
              </FixedHeightRow>
              <AutoColumn gap="4px">
                {depositedAmounts.length === pool.tokens.length
                  ? pool.tokens.map((token, i) => (
                      <FixedHeightRow key={token.address}>
                        <Text fontSize="14px">{token.symbol}:</Text>
                        <RowFixed>
                          <Text ml="6px" fontSize="14px">
                            {depositedAmounts[i].toSignificant(6)}
                          </Text>
                        </RowFixed>
                      </FixedHeightRow>
                    ))
                  : null}
              </AutoColumn>
            </AutoColumn>
          </CardBody>
        </UIKitCard>
      )}
    </>
  )
}

interface IStablePoolPositionCardProps {
  pool: IStablePool
}

export function FullStablePoolPositionCard({ pool }: IStablePoolPositionCardProps) {
  const { account } = useActiveWeb3React()

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account, pool.liquidityToken)
  const totalPoolTokens = useTotalSupply(pool.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const stableSwapContract = useStableSwapContract(pool.address)

  const depositedAmounts = useStablePoolWithdrawAmounts(pool, stableSwapContract, userPoolBalance)

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow onClick={() => setShowMore(!showMore)} style={{ cursor: 'pointer' }}>
          <RowFixed>
            <StablePoolLogo pool={pool} size="20px" style={{ marginRight: 14.66666666666 }} />
            <Text>{pool.name}</Text>
          </RowFixed>
          <RowFixed>
            {showMore ? (
              <ChevronUp size="20" style={{ marginLeft: '10px' }} />
            ) : (
              <ChevronDown size="20" style={{ marginLeft: '10px' }} />
            )}
          </RowFixed>
        </FixedHeightRow>
        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <Text>Your pool tokens:</Text>
              <Text>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Your pool share:</Text>
              <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(2)}%` : '-'}</Text>
            </FixedHeightRow>

            {depositedAmounts.length === pool.tokens.length
              ? pool.tokens.map((token, i) => (
                  <FixedHeightRow>
                    <RowFixed>
                      <Text>Pooled {token.symbol}:</Text>
                    </RowFixed>
                    <RowFixed>
                      <Text ml="6px">{depositedAmounts[i].toSignificant(6)}</Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={token} />
                    </RowFixed>
                  </FixedHeightRow>
                ))
              : null}

            <RowBetween marginTop="10px">
              <Button as={Link} to={`/liquidity/add/stable-pool/${pool.address}`} style={{ width: '48%' }}>
                Add
              </Button>
              <Button as={Link} style={{ width: '48%' }} to={`/liquidity/remove/stable-pool/${pool.address}`}>
                Remove
              </Button>
            </RowBetween>
          </AutoColumn>
        )}
      </AutoColumn>
    </HoverCard>
  )
}
