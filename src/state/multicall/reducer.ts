import { createReducer } from '@reduxjs/toolkit'
import {
  addMulticallListeners,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  removeMulticallListeners,
  toCallKey,
  updateMulticallResults,
} from './actions'

export interface MulticallState {
  callListeners?: {
    // on a per-chain basis
    [chainId: number]: {
      // stores for each call key the listeners' preferences
      [callKey: string]: {
        // stores how many listeners there are per each blocks per fetch preference
        [blocksPerFetch: number]: number
      }
    }
  }

  callResults: {
    [chainId: number]: {
      [callKey: string]: {
        data?: string | null
        refreshFactor?: number
        fetchingRefreshFactor?: number
      }
    }
  }

  updatedAt: number
}

const initialState: MulticallState = {
  callResults: {},
  updatedAt: Date.now(),
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(addMulticallListeners, (state, { payload: { calls, chainId, options: { blocksPerFetch = 1 } = {} } }) => {
      const listeners: MulticallState['callListeners'] = state.callListeners
        ? state.callListeners
        : (state.callListeners = {})
      listeners[chainId] = listeners[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        listeners[chainId][callKey] = listeners[chainId][callKey] ?? {}
        listeners[chainId][callKey][blocksPerFetch] = (listeners[chainId][callKey][blocksPerFetch] ?? 0) + 1
      })

      state.updatedAt = Date.now()
    })
    .addCase(
      removeMulticallListeners,
      (state, { payload: { chainId, calls, options: { blocksPerFetch = 1 } = {} } }) => {
        const listeners: MulticallState['callListeners'] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {})

        if (!listeners[chainId]) return

        let hasUpdated = false
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          if (!listeners[chainId][callKey]) return
          if (!listeners[chainId][callKey][blocksPerFetch]) return

          hasUpdated = true
          if (listeners[chainId][callKey][blocksPerFetch] === 1) {
            delete listeners[chainId][callKey][blocksPerFetch]
          } else {
            listeners[chainId][callKey][blocksPerFetch]--
          }
        })

        if (hasUpdated) {
          state.updatedAt = Date.now()
        }
      }
    )
    .addCase(fetchingMulticallResults, (state, { payload: { chainId, refreshFactor, calls } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        const current = state.callResults[chainId][callKey]
        if (!current) {
          state.callResults[chainId][callKey] = {
            fetchingRefreshFactor: refreshFactor,
          }
        } else {
          state.callResults[chainId][callKey].fetchingRefreshFactor = refreshFactor
        }
      })
    })
    .addCase(errorFetchingMulticallResults, (state, { payload: { refreshFactor, chainId, calls } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        const current = state.callResults[chainId][callKey]
        if (!current) return // only should be dispatched if we are already fetching
        if (current.fetchingRefreshFactor === refreshFactor) {
          delete current.fetchingRefreshFactor
          current.data = null
          current.refreshFactor = refreshFactor
        }
      })

      state.updatedAt = Date.now()
    })
    .addCase(updateMulticallResults, (state, { payload: { chainId, results, refreshFactor } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      Object.keys(results).forEach((callKey) => {
        const current = state.callResults[chainId][callKey]
        if (current.fetchingRefreshFactor !== refreshFactor) return
        state.callResults[chainId][callKey] = {
          data: results[callKey],
          refreshFactor,
        }
      })

      state.updatedAt = Date.now()
    })
)
