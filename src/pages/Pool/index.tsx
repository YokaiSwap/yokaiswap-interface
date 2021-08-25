import React, { useContext, useMemo } from 'react'
import { ThemeContext } from 'styled-components'
import { Pair } from '@yokaiswap/sdk'
import { Button, CardBody, Text } from '@yokaiswap/interface-uikit'
import { Link } from 'react-router-dom'
import CardNav from 'components/CardNav'
import Question from 'components/QuestionHelper'
import FullPositionCard, { FullStablePoolPositionCard } from 'components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { StyledInternalLink, TradeBodyWrapper } from 'components/Shared'
import { LightCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'

import { useActiveWeb3React } from 'hooks'
import { usePairs } from 'data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { Dots } from 'components/swap/styleds'
import useI18n from 'hooks/useI18n'
import PageHeader from 'components/PageHeader'
import { useStablePools } from 'hooks/StablePools'
import AppBody from '../AppBody'

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()
  const TranslateString = useI18n()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const stablePools = useStablePools()
  const liquidityTokens = useMemo(
    () =>
      tokenPairsWithLiquidityTokens
        .map((tpwlt) => tpwlt.liquidityToken)
        .concat(stablePools.map((stablePool) => stablePool.liquidityToken)),
    [tokenPairsWithLiquidityTokens, stablePools]
  )
  const [liquidityBalances, fetchingLiquidityBalances] = useTokenBalancesWithLoadingIndicator(account, liquidityTokens)

  // fetch the reserves for all V2 pools and stable pools in which the user has a balance
  const [v2PoolsWithBalances, stablePoolsWithBalances] = useMemo(
    () => [
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        liquidityBalances[liquidityToken.address]?.greaterThan('0')
      ),
      stablePools.filter(({ liquidityToken }) => liquidityBalances[liquidityToken.address]?.greaterThan('0')),
    ],
    [tokenPairsWithLiquidityTokens, liquidityBalances, stablePools]
  )

  const v2Pairs = usePairs(v2PoolsWithBalances.map(({ tokens }) => tokens))
  const isLoading =
    fetchingLiquidityBalances || v2Pairs?.length < v2PoolsWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  return (
    <TradeBodyWrapper>
      <CardNav activeIndex={1} />
      <AppBody>
        <PageHeader
          title={TranslateString(262, 'Liquidity')}
          description={TranslateString(1168, 'Add liquidity to receive LP tokens')}
        >
          <Button id="join-pool-button" as={Link} to="/liquidity/add/CKB">
            {TranslateString(168, 'Add Liquidity')}
          </Button>
        </PageHeader>
        <AutoColumn gap="lg" justify="center">
          <CardBody>
            <AutoColumn gap="12px" style={{ width: '100%' }}>
              <RowBetween padding="0 8px">
                <Text color={theme.colors.text}>{TranslateString(107, 'Your Liquidity')}</Text>
                <Question
                  text={TranslateString(
                    1170,
                    'When you add liquidity, you are given pool tokens that represent your share. If you don’t see a pool you joined in this list, try importing a pool below.'
                  )}
                />
              </RowBetween>

              {!account ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    {TranslateString(156, 'Connect to a wallet to view your liquidity.')}
                  </Text>
                </LightCard>
              ) : isLoading ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    <Dots>Loading</Dots>
                  </Text>
                </LightCard>
              ) : stablePoolsWithBalances.length + allV2PairsWithLiquidity?.length > 0 ? (
                <>
                  {stablePoolsWithBalances.map((stablePool) => (
                    <FullStablePoolPositionCard key={stablePool.address} pool={stablePool} />
                  ))}
                  {allV2PairsWithLiquidity.map((v2Pair) => (
                    <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
                  ))}
                </>
              ) : (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    {TranslateString(104, 'No liquidity found.')}
                  </Text>
                </LightCard>
              )}

              <div>
                <Text fontSize="14px" style={{ padding: '.5rem 0 .5rem 0' }}>
                  {TranslateString(106, "Don't see a pool you joined?")}{' '}
                  <StyledInternalLink id="import-pool-link" to="/find">
                    {TranslateString(108, 'Import it.')}
                  </StyledInternalLink>
                </Text>
                <Text fontSize="14px" style={{ padding: '.5rem 0 .5rem 0' }}>
                  {TranslateString(1172, 'Or, if you staked your LP tokens in a farm, unstake them to see them here.')}
                </Text>
              </div>
            </AutoColumn>
          </CardBody>
        </AutoColumn>
      </AppBody>
    </TradeBodyWrapper>
  )
}
