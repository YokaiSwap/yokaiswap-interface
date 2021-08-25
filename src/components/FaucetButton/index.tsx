import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Text } from '@yokaiswap/interface-uikit'
import { ChainId } from '@yokaiswap/sdk'
import throttle from 'lodash/throttle'

import { IntervalRefreshContext } from 'contexts/IntervalRefreshContext'
import { useFaucetContract } from '../../hooks/useContract'
import { useActiveWeb3React } from '../../hooks'
import LoaderIcon from '../LoaderIcon'

export const FaucetButton = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const { account } = useActiveWeb3React()
  const faucet = useFaucetContract(
    Number(process.env.REACT_APP_CHAIN_ID) === ChainId.GWTESTNET
      ? '0x69d8E415f5df596571F343be4F5919909875A304'
      : '0xD4AD5D1a02deB15A1ADa87E76B111A25eAfE5582'
  )

  const [show, setShow] = useState(true)
  const refPrevOffset = useRef(window.pageYOffset)

  useEffect(() => {
    const handleScroll = () => {
      const currentOffset = window.pageYOffset
      const isBottomOfPage = window.document.body.clientHeight === currentOffset + window.innerHeight
      const isTopOfPage = currentOffset === 0
      // Always show the menu when user reach the top
      if (isTopOfPage) {
        setShow(true)
      }
      // Avoid triggering anything at the bottom because of layout shift
      else if (!isBottomOfPage) {
        if (currentOffset < refPrevOffset.current) {
          // Has scroll up
          setShow(true)
        } else {
          // Has scroll down
          setShow(false)
        }
      }
      refPrevOffset.current = currentOffset
    }
    const throttledHandleScroll = throttle(handleScroll, 200)

    window.addEventListener('scroll', throttledHandleScroll)
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [])

  const { refreshMulticall } = useContext(IntervalRefreshContext)

  if (account == null) {
    return null
  }

  return (
    <Button
      disabled={isProcessing}
      style={{
        position: 'fixed',
        top: show ? 15 : -64,
        right: 150,
        zIndex: 20,
        transition: 'top 0.2s ease 0s',
        transform: 'translate3d(0px, 0px, 0px)',
      }}
      scale="sm"
      variant="tertiary"
      onClick={async () => {
        if (account == null || faucet == null) {
          return
        }

        setIsProcessing(true)
        try {
          const res = await faucet.mint(
            Number(process.env.REACT_APP_CHAIN_ID) === ChainId.GWTESTNET
              ? [
                  '0xc5e133E6B01b2C335055576C51A53647B1b9b624', // YOK
                  '0x3380EA6631D4Aa6C6fE0E4eF7600896ad530093A', // USDT
                  '0xeC8bF93B774a353Fd7244A7e427C021287779b77', // ethUSDT
                  '0x1A0E713d9c91e23c891BDd9e59Db2f1A307417fb', // solUSDT

                  // '0xfF313383879C1214F7AeCfE2E3174274339218c3', // ETH
                ]
              : [
                  '0x37D8a33814eBC6BB300a734237DA60730c91d0a8', // YOK
                  '0xC72d93A333E13cFe3364Abc70157b39147957a92', // USDT
                  '0x106fDEc8EC9250f93d38182Ea917B75f51246b02', // ethUSDT
                  '0x490827E53Cf0cE4aBCECd152394eF2df0631F955', // solUSDT

                  // '0x897F8be9456c84C24044B88A5af4ec6534D2DEAA', // ETH
                ],
            '10000000000000000000000',
            {
              gasLimit: 12_500_000,
              gasPrice: 0,
            }
          )
          await res.wait()
          window.alert('Got test tokens successfully!')
          refreshMulticall()
        } catch (err) {
          if (err?.message?.includes('unable to fetch account id')) {
            window.alert(`You need to initialize Godwoken account first, use asset bridge to deposit some CKB.`)
          } else if (err?.code !== 4001 && !err?.message?.includes('User denied')) {
            window.alert(`Failed to get test tokens: ${err.message || err}`)
          }
        } finally {
          setIsProcessing(false)
        }
      }}
    >
      {isProcessing ? (
        <>
          <LoaderIcon spin color="currentColor" />
          <Text ml="4px" color="currentColor">
            Processing
          </Text>
        </>
      ) : (
        'Get Test Tokens'
      )}
    </Button>
  )
}

export default FaucetButton
