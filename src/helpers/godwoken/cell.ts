import {
  Amount,
  Cell,
  IndexerCell,
  Script,
  OutPoint,
  HashType,
  AmountUnit,
} from "@lay2/pw-core";

export function indexerCellToPWCell(indexerCell: IndexerCell): Cell {
  const capacity = new Amount(indexerCell.output.capacity, AmountUnit.shannon);
  const cellLock = indexerCell.output.lock;
  const cellLockPW = new Script(
    cellLock.code_hash,
    cellLock.args,
    cellLock.hash_type,
  );
  const cellType = indexerCell.output.type;
  const cellTypePW =
    cellType != null
      ? new Script(cellType.code_hash, cellType.args, cellType.hash_type)
      : undefined;
  const outPoint = indexerCell.out_point;
  const outPointPW = new OutPoint(outPoint.tx_hash, outPoint.index);
  return new Cell(
    capacity,
    cellLockPW,
    cellTypePW,
    outPointPW,
    indexerCell.output_data,
  );
}

export const emptyCell = new Cell(
  new Amount("7"),
  new Script("", "", HashType.type),
);
