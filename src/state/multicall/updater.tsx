import { Contract } from '@ethersproject/contracts'
import { useContext, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IntervalRefreshContext } from 'contexts/IntervalRefreshContext'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import chunkArray from '../../utils/chunkArray'
import { CancelledError, retry } from '../../utils/retry'
import { AppDispatch, AppState } from '../index'
import {
  Call,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  parseCallKey,
  updateMulticallResults,
} from './actions'

// chunk calls so we do not exceed the gas limit
const CALL_CHUNK_SIZE = 500

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicallContract multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param minBlockNumber minimum block number of the result set
 */
async function fetchChunk(
  multicallContract: Contract,
  chunk: Call[]
): Promise<{ results: string[]; blockNumber: number }> {
  let resultsBlockNumber
  let returnData
  try {
    ;[resultsBlockNumber, returnData] = await multicallContract.callStatic.aggregate(
      chunk.map((obj) => [obj.address, obj.callData]),
      {
        from: '0x3089EA87cD8dc04E0985E0C0DA272E399a7C289A',
      }
    )
  } catch (error) {
    console.info('Failed to fetch chunk inside retry', error)
    throw error
  }
  // if (resultsBlockNumber.toNumber() < minBlockNumber) {
  //   throw new RetryableError('Fetched for old block number')
  // }
  return { results: returnData, blockNumber: resultsBlockNumber.toNumber() }
}

/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
export function activeListeningKeys(
  allListeners: AppState['multicall']['callListeners'],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {}
  const listeners = allListeners[chainId]
  if (!listeners) return {}

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>((memo, callKey) => {
    const keyListeners = listeners[callKey]

    memo[callKey] = Object.keys(keyListeners)
      .filter((key) => {
        const blocksPerFetch = parseInt(key)
        if (blocksPerFetch <= 0) return false
        return keyListeners[blocksPerFetch] > 0
      })
      .reduce((previousMin, current) => {
        return Math.min(previousMin, parseInt(current))
      }, Infinity)
    return memo
  }, {})
}

/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
export function outdatedListeningKeys(
  callResults: AppState['multicall']['callResults'],
  listeningKeys: { [callKey: string]: number },
  chainId: number | undefined,
  refreshFactor: number
): string[] {
  if (!chainId) return []
  const results = callResults[chainId]
  // no results at all, load everything
  if (!results) return Object.keys(listeningKeys)

  return Object.keys(listeningKeys).filter((callKey) => {
    const data = callResults[chainId][callKey]
    // no data, must fetch
    if (!data) return true

    // const minDataBlockNumber = latestBlockNumber - (blocksPerFetch - 1)

    // already fetching
    if (data.fetchingRefreshFactor != null && data.fetchingRefreshFactor === refreshFactor) return false

    return true
  })
}

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>(
    (s) => s.multicall,
    (left, right) => left.updatedAt === right.updatedAt
  )
  // wait for listeners to settle before triggering updates
  const debouncedListeners = useDebounce(state.callListeners, 100)
  const { multicallRefreshFactor: refreshFactor } = useContext(IntervalRefreshContext)
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()
  const cancellations = useRef<{ refreshFactor: typeof refreshFactor; cancellations: (() => void)[] }>()

  const listeningKeys: { [callKey: string]: number } = useMemo(() => {
    return activeListeningKeys(debouncedListeners, chainId)
  }, [debouncedListeners, chainId])

  const unserializedOutdatedCallKeys = useMemo(() => {
    return outdatedListeningKeys(state.callResults, listeningKeys, chainId, refreshFactor)
  }, [chainId, state, listeningKeys, refreshFactor])

  const serializedOutdatedCallKeys = useMemo(
    () => JSON.stringify(unserializedOutdatedCallKeys.sort()),
    [unserializedOutdatedCallKeys]
  )

  useEffect(() => {
    if (!chainId || !multicallContract) return

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map((key) => parseCallKey(key))
    // .filter(item => item.address.toLowerCase() !== '0xBCfCcbde45cE874adCB698cC183deBcF17952812'.toLowerCase())

    const chunkedCalls = chunkArray(calls, CALL_CHUNK_SIZE)

    if (cancellations.current?.refreshFactor !== refreshFactor) {
      cancellations.current?.cancellations?.forEach((c) => c())
    }

    dispatch(
      fetchingMulticallResults({
        calls,
        chainId,
        refreshFactor,
      })
    )

    cancellations.current = {
      refreshFactor,
      cancellations: chunkedCalls.map((chunk, index) => {
        const { cancel, promise } = retry(() => fetchChunk(multicallContract, chunk), {
          n: Infinity,
          minWait: 2500,
          maxWait: 3500,
        })
        promise
          .then(({ results: returnData }) => {
            cancellations.current = { cancellations: [], refreshFactor }

            // accumulates the length of all previous indices
            const firstCallKeyIndex = chunkedCalls.slice(0, index).reduce<number>((memo, curr) => memo + curr.length, 0)
            const lastCallKeyIndex = firstCallKeyIndex + returnData.length

            dispatch(
              updateMulticallResults({
                chainId,
                results: outdatedCallKeys
                  .slice(firstCallKeyIndex, lastCallKeyIndex)
                  .reduce<{ [callKey: string]: string | null }>((memo, callKey, i) => {
                    memo[callKey] = returnData[i] ?? null
                    return memo
                  }, {}),
                refreshFactor,
              })
            )
          })
          .catch((error: any) => {
            if (error instanceof CancelledError) {
              console.error('Cancelled fetch')
              return
            }
            console.error('Failed to fetch multicall chunk', chunk, chainId, error)
            dispatch(
              errorFetchingMulticallResults({
                calls: chunk,
                chainId,
                refreshFactor,
              })
            )
          })
        return cancel
      }),
    }
  }, [chainId, multicallContract, dispatch, serializedOutdatedCallKeys, refreshFactor])

  return null
}
