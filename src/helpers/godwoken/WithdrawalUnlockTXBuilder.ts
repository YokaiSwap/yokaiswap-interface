import PWCore, {
  Address,
  AddressType,
  Builder,
  BuilderOption,
  Transaction,
  Cell,
  Amount,
  WitnessArgs,
  AmountUnit,
  CellDep,
  DepType,
  RawTransaction,
  SUDT,
} from '@lay2/pw-core'

import { fetchRollupCell } from '../../hooks/useRollupCell'
import { withdrawalLockDep } from './scripts'

export interface IWithdrawalUnlockTXBuilderConfig {
  ownerAddress: Address
  withdrawalCell: Cell
  toCKBAddress: string
}

// function getWitnessArgs() {
//   const withdrawalViaFinalizeWitnessLock =
//     "0x00000000" +
//     new Reader(
//       godwokenCore.SerializeUnlockWithdrawalViaFinalize(
//         godwokenNormalizer.NormalizeUnlockWithdrawalViaFinalize({}),
//       ),
//     )
//       .serializeJson()
//       .slice(2);
//   const withdrawalWitnessArgs: WitnessArgs = {
//     lock: withdrawalViaFinalizeWitnessLock,
//     input_type: "",
//     output_type: "",
//   };
//   const witnessArgs: WitnessArgs[] = [
//     withdrawalWitnessArgs,
//     Builder.WITNESS_ARGS.Secp256k1,
//   ];

//   return witnessArgs;
// }

const witnessArgs: WitnessArgs[] = [
  {
    lock: '0x0000000004000000',
    input_type: '',
    output_type: '',
  },
  Builder.WITNESS_ARGS.Secp256k1,
]

const minSUDTOutputCellCapacity = new Amount('142')

export class WithdrawalUnlockTXBuilder extends Builder {
  constructor(private config: IWithdrawalUnlockTXBuilderConfig, protected options: BuilderOption = {}) {
    super(options.feeRate, options.collector, options.witnessArgs)
  }

  async build(fee: Amount = Amount.ZERO): Promise<Transaction> {
    const { feeInputCells, changeCell } = await this.getFeeInputOutputCells(fee)
    const { inputCellsWithoutFee, outputCells } = await this.getInputOutputCells(changeCell)

    const inputCells = [...inputCellsWithoutFee, ...feeInputCells]

    const cellDeps = await this.getCellDeps()

    const txWithoutActualFee = new Transaction(new RawTransaction(inputCells, outputCells, cellDeps), witnessArgs)

    const actualFee = Builder.calcFee(txWithoutActualFee, this.feeRate)

    if (changeCell.capacity.gte(actualFee.add(Builder.MIN_CHANGE))) {
      changeCell.capacity = changeCell.capacity.sub(actualFee)
    } else {
      return this.build(actualFee)
    }

    const tx = new Transaction(new RawTransaction(inputCells, outputCells, cellDeps), witnessArgs)

    return tx
  }

  private async getFeeInputOutputCells(fee: Amount): Promise<{
    feeInputCells: Cell[]
    changeCell: Cell
  }> {
    const { ownerAddress } = this.config

    const neededAmount = fee.add(Builder.MIN_CHANGE)

    let inputSum = Amount.ZERO
    const feeInputCells: Cell[] = []

    // fill the fee inputs
    const cells = await this.collector.collect(ownerAddress, {
      neededAmount,
    })
    for (const cell of cells) {
      feeInputCells.push(cell)
      inputSum = inputSum.add(cell.capacity)
      if (inputSum.gt(neededAmount)) {
        break
      }
    }

    if (inputSum.lt(neededAmount)) {
      throw new Error(
        `input capacity not enough, need ${neededAmount.toString(AmountUnit.ckb)}, got ${inputSum.toString(
          AmountUnit.ckb
        )}`
      )
    }

    const ownerLock = ownerAddress.toLockScript()
    const changeCell = new Cell(inputSum, ownerLock)

    return {
      feeInputCells,
      changeCell,
    }
  }

  private async getInputOutputCells(changeCell: Cell): Promise<{
    inputCellsWithoutFee: Cell[]
    outputCells: Cell[]
  }> {
    const { withdrawalCell, toCKBAddress } = this.config

    const outputCellData = withdrawalCell.getHexData()
    const toAddressPW = new Address(toCKBAddress, AddressType.ckb)
    const toLock = toAddressPW.toLockScript()
    // clone withdrawal cell as output cell, only change lock(owner)
    const outputCell = new Cell(withdrawalCell.capacity, toLock, withdrawalCell.type, undefined, outputCellData)

    const isCKBOnlyOutput = outputCell.type == null && outputCellData === '0x'
    const ownerLock = changeCell.lock
    const isSelfWithdrawal = toLock.toHash() === ownerLock.toHash()
    if (isCKBOnlyOutput && isSelfWithdrawal) {
      // merge output cell into change cell
      changeCell.capacity = changeCell.capacity.add(outputCell.capacity)

      return {
        inputCellsWithoutFee: [withdrawalCell],
        outputCells: [changeCell],
      }
    }

    // is not sudt, do not modify output cell
    if (outputCell.type == null || outputCell.type.codeHash !== PWCore.config.sudtType.script.codeHash) {
      return {
        inputCellsWithoutFee: [withdrawalCell],
        outputCells: [outputCell, changeCell],
      }
    }

    const isAcpReceiver = toAddressPW.isAcp()

    let capacityLeft = outputCell.capacity
    // set output cell to sudt minimum capacity
    outputCell.capacity = minSUDTOutputCellCapacity
    capacityLeft = capacityLeft.sub(minSUDTOutputCellCapacity)

    const sudtInputCells = [withdrawalCell]
    if (isAcpReceiver) {
      // find sudt acp cells
      const sudtACPCells = await this.collector.collectSUDT(new SUDT(outputCell.type.args), toAddressPW, {
        neededAmount: new Amount('1', AmountUnit.shannon),
      })

      if (sudtACPCells.length > 0) {
        const sudtACPInputCell = sudtACPCells[0]
        sudtInputCells.push(sudtACPInputCell)

        // merge sudt ouput cell to sudt acp cell
        outputCell.capacity = sudtACPInputCell.capacity
        outputCell.setHexData(
          Amount.fromUInt128LE(sudtACPInputCell.getHexData()).add(Amount.fromUInt128LE(outputCellData)).toUInt128LE()
        )

        // add back sudt ouput cell capacity
        capacityLeft = capacityLeft.add(minSUDTOutputCellCapacity)
      }
    }

    // start handle extra capacity

    if (capacityLeft.eq(Amount.ZERO)) {
      return {
        inputCellsWithoutFee: sudtInputCells,
        outputCells: [outputCell, changeCell],
      }
    }

    if (isSelfWithdrawal) {
      // put left capacity to change cell
      changeCell.capacity = changeCell.capacity.add(capacityLeft)
      return {
        inputCellsWithoutFee: sudtInputCells,
        outputCells: [outputCell, changeCell],
      }
    }

    if (capacityLeft.gt(Builder.MIN_CHANGE)) {
      // put left capacity to a new cell
      const ckbOutputCell = new Cell(capacityLeft, toLock)

      return {
        inputCellsWithoutFee: sudtInputCells,
        outputCells: [outputCell, ckbOutputCell, changeCell],
      }
    }

    if (isAcpReceiver) {
      const ckbOnlyACPCells = await this.collector.collect(toAddressPW, {
        neededAmount: new Amount('1', AmountUnit.shannon),
      })
      if (ckbOnlyACPCells.length > 0) {
        // put left capacity to a ckb acp cell
        const ckbOnlyACPInputCell = ckbOnlyACPCells[0]
        const ckbACPOutputCell = new Cell(ckbOnlyACPInputCell.capacity.add(capacityLeft), ckbOnlyACPInputCell.lock)
        return {
          inputCellsWithoutFee: [...sudtInputCells, ckbOnlyACPInputCell],
          outputCells: [outputCell, ckbACPOutputCell, changeCell],
        }
      }
    }

    // put left capacity back to sudt output cell
    outputCell.capacity = outputCell.capacity.add(capacityLeft)
    return {
      inputCellsWithoutFee: sudtInputCells,
      outputCells: [outputCell, changeCell],
    }
  }

  private async getCellDeps() {
    const rollupCell = await fetchRollupCell()
    if (rollupCell === null) {
      throw new Error('can not find rollup cell')
    }
    if (rollupCell.outPoint == null) {
      throw new Error('roll up cell has no out point')
    }
    const rollupCellDep = new CellDep(DepType.code, rollupCell.outPoint)
    const cellDeps: CellDep[] = [
      PWCore.config.pwLock.cellDep,
      withdrawalLockDep,
      rollupCellDep,
      PWCore.config.defaultLock.cellDep,
    ]
    if (this.config.withdrawalCell.type != null) {
      cellDeps.push(PWCore.config.sudtType.cellDep)
    }

    return cellDeps
  }
}
