import PWCore, {
  Address,
  Amount,
  AmountUnit,
  Builder,
  BuilderOption,
  Cell,
  RawTransaction,
  SimpleSUDTBuilder,
  SUDT,
  SUDTCollector,
  Transaction,
} from '@lay2/pw-core'

export interface ISUDTDepositTXBuilderConfig {
  sudt: SUDT
  toAddress: Address
  amount: Amount
  capacity: Amount
}

export class SUDTDepositTXBuilder extends SimpleSUDTBuilder {
  private address_: Address
  private amount_: Amount
  private sudt_: SUDT
  private capacity: Amount
  constructor(
    { toAddress, sudt, amount, capacity }: ISUDTDepositTXBuilderConfig,
    protected options: BuilderOption = {}
  ) {
    super(sudt, toAddress, amount, options)
    this.sudt_ = sudt
    this.address_ = toAddress
    this.amount_ = amount
    this.capacity = capacity
  }

  async buildSudtCells(): Promise<{
    tx: Transaction
    neededCKB: Amount
  }> {
    let senderInputSUDTSum = Amount.ZERO
    let senderInputCKBSum = Amount.ZERO
    let minSenderOccupiedCKBSum = Amount.ZERO

    const receiverAmount = this.capacity
    const receiverOutputCell = new Cell(
      receiverAmount,
      this.address_.toLockScript(),
      this.sudt_.toTypeScript(),
      undefined,
      this.amount_.toUInt128LE()
    )

    // acp cell with zero sudt
    if (this.amount_.eq(Amount.ZERO)) {
      this.outputCells.push(receiverOutputCell)
      return { tx: null as unknown as Transaction, neededCKB: receiverAmount }
    }

    let restNeededSUDT = new Amount(this.amount_.toHexString(), AmountUnit.shannon)

    if (!(this.collector instanceof SUDTCollector)) {
      throw new Error('this.collector is not a SUDTCollector instance')
    }

    const unspentSUDTCells = await this.collector.collectSUDT(this.sudt_, PWCore.provider.address, {
      neededAmount: this.amount_,
    })

    // build a tx including sender and receiver sudt cell only
    for (const inputCell of unspentSUDTCells) {
      const outputCell = inputCell.clone()

      const inputSUDTAmount = inputCell.getSUDTAmount()
      senderInputSUDTSum = senderInputSUDTSum.add(inputSUDTAmount)
      senderInputCKBSum = senderInputCKBSum.add(inputCell.capacity)

      minSenderOccupiedCKBSum = minSenderOccupiedCKBSum.add(outputCell.occupiedCapacity())

      if (inputSUDTAmount.lt(restNeededSUDT)) {
        restNeededSUDT = restNeededSUDT.sub(inputSUDTAmount)
        outputCell.setSUDTAmount(Amount.ZERO)
      } else {
        outputCell.setSUDTAmount(inputSUDTAmount.sub(restNeededSUDT))
        restNeededSUDT = Amount.ZERO
      }

      this.inputCells.push(inputCell)
      this.outputCells.unshift(outputCell)

      if (senderInputSUDTSum.gte(this.amount_)) break
    }

    if (senderInputSUDTSum.lt(this.amount_)) {
      throw new Error(
        `input sudt amount not enough, need ${this.amount_.toString(AmountUnit.ckb)}, got ${senderInputSUDTSum.toString(
          AmountUnit.ckb
        )}`
      )
    }

    this.outputCells.unshift(receiverOutputCell)
    this.rectifyTx_()

    const availableCKB = senderInputCKBSum.sub(minSenderOccupiedCKBSum)

    if (receiverAmount.add(this.fee).lt(availableCKB)) {
      const tx = this.extractCKBFromOutputs_(receiverAmount.add(this.fee))
      return { tx, neededCKB: Amount.ZERO }
    }
    this.extractCKBFromOutputs_(receiverAmount)
    return {
      tx: null as unknown as Transaction,
      neededCKB: receiverAmount.sub(availableCKB),
    }
  }

  private extractCKBFromOutputs_(ckbAmount: Amount) {
    for (const cell of this.outputCells.slice(1)) {
      if (ckbAmount.gt(cell.availableFee())) {
        ckbAmount = ckbAmount.sub(cell.availableFee())
        cell.capacity = cell.occupiedCapacity()
      } else {
        cell.capacity = cell.capacity.sub(ckbAmount)
        break
      }
    }
    return this.rectifyTx_()
  }

  private rectifyTx_() {
    const sudtCellDeps = [
      PWCore.config.defaultLock.cellDep,
      PWCore.config.pwLock.cellDep,
      PWCore.config.sudtType.cellDep,
    ]
    const tx = new Transaction(new RawTransaction(this.inputCells, this.outputCells, sudtCellDeps), [this.witnessArgs])

    this.fee = Builder.calcFee(tx, this.feeRate)
    return tx
  }
}
