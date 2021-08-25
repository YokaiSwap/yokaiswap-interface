import { Hash, HexString, HexNumber, Script } from "@ckb-lumos/base";
export declare type Uint32 = number;
export declare type Uint64 = bigint;
export declare type Uint128 = bigint;
export declare type Uint256 = bigint;
export interface RunResult {
    read_values: Map<Hash, Hash>;
    write_values: Map<Hash, Hash>;
    return_data: HexString;
    account_count?: HexNumber;
    new_scripts: Map<Hash, HexString>;
    write_data: Map<Hash, HexString>;
    read_data: Map<Hash, HexNumber>;
}
export interface RawL2Transaction {
    from_id: HexNumber;
    to_id: HexNumber;
    nonce: HexNumber;
    args: HexString;
}
export interface L2Transaction {
    raw: RawL2Transaction;
    signature: HexString;
}
export interface CreateAccount {
    script: Script;
}
export interface Fee {
    sudt_id: Uint32;
    amount: Uint128;
}
export interface RawWithdrawalRequest {
    nonce: HexNumber;
    capacity: HexNumber;
    amount: HexNumber;
    sudt_script_hash: Hash;
    account_script_hash: Hash;
    sell_amount: HexNumber;
    sell_capacity: HexNumber;
    owner_lock_hash: Hash;
    payment_lock_hash: Hash;
    fee: Fee;
}
export interface WithdrawalRequest {
    raw: RawWithdrawalRequest;
    signature: HexString;
}
export interface WithdrawalLockArgs {
    account_script_hash: Hash;
    withdrawal_block_hash: Hash;
    withdrawal_block_number: HexNumber;
    sudt_script_hash: Hash;
    sell_amount: HexNumber;
    sell_capacity: HexNumber;
    owner_lock_hash: Hash;
    payment_lock_hash: Hash;
}
export interface UnlockWithdrawalViaFinalize {
    block_proof: HexString;
}
export declare enum Status {
    Running = "running",
    Halting = "halting"
}
