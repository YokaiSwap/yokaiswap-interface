import { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { gwEstimateBlocktime } from 'config'
import { IntervalRefreshContext } from 'contexts/IntervalRefreshContext'
import { useActiveWeb3React } from '../../hooks'
import { useAddPopup } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { finalizeTransaction, removeTransaction } from './actions'

export function shouldCheck(tx: { addedTime: number; receipt?: any; lastCheckedBlockNumber?: number }): boolean {
  if (tx.receipt) return false

  return true
}

export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  const { transactionRefreshFactor: refreshFactor, refreshMulticall } = useContext(IntervalRefreshContext)

  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>((s) => s.transactions)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transactions = chainId ? state[chainId] ?? {} : {}

  // show popup on confirm
  const addPopup = useAddPopup()

  useEffect(() => {
    if (!chainId || !library) return

    Object.keys(transactions)
      .filter((hash) => shouldCheck(transactions[hash]))
      .forEach((hash) => {
        library
          .getTransactionReceipt(hash)
          .then((receipt) => {
            if (receipt) {
              dispatch(
                finalizeTransaction({
                  chainId,
                  hash,
                  receipt: {
                    blockHash: receipt.blockHash,
                    blockNumber: receipt.blockNumber,
                    contractAddress: receipt.contractAddress,
                    from: receipt.from,
                    status: receipt.status,
                    to: receipt.to,
                    transactionHash: receipt.transactionHash,
                    transactionIndex: receipt.transactionIndex,
                  },
                })
              )

              addPopup(
                {
                  txn: {
                    hash,
                    success: receipt.status === 1,
                    summary: transactions[hash]?.summary,
                  },
                },
                hash
              )

              if (receipt.status === 1) {
                refreshMulticall()
              }
            } else if (Date.now() - transactions[hash].addedTime > gwEstimateBlocktime * 10 * 1000) {
              library.getTransaction(hash).then((res) => {
                if (res != null) {
                  // dispatch(checkedTransaction({ chainId, hash, blockNumber: 0 }))
                  return
                }

                dispatch(removeTransaction({ chainId, hash }))
              })
            } else {
              // dispatch(checkedTransaction({ chainId, hash, blockNumber: 0 }))
            }
          })
          .catch((error) => {
            console.error(`failed to check transaction hash: ${hash}`, error)
          })
      })
  }, [chainId, library, transactions, dispatch, addPopup, refreshFactor, refreshMulticall])

  return null
}
