/// <reference types="node" />
import { Hash, HexString, Script } from "@ckb-lumos/base";
import { L2Transaction, RawL2Transaction, RawWithdrawalRequest, WithdrawalRequest, RunResult, Uint128, Uint32, Uint64, Fee } from "./types";
import * as core from "./schemas";
import * as normalizer from "./normalizer";
export { core, normalizer };
export * from "./types";
export declare function numberToUInt32LE(value: number): HexString;
export declare function UInt32LEToNumber(hex: HexString): number;
export declare function u32ToHex(value: number): HexString;
export declare function hexToU32(hex: HexString): number;
export declare function toBuffer(ab: ArrayBuffer): Buffer;
export declare class Godwoken {
    private rpc;
    constructor(url: string);
    private rpcCall;
    _send(l2tx: L2Transaction, method_name: string): Promise<any>;
    executeL2Transaction(l2tx: L2Transaction): Promise<RunResult>;
    submitL2Transaction(l2tx: L2Transaction): Promise<Hash>;
    executeRawL2Transaction(rawL2Tx: RawL2Transaction): Promise<RunResult>;
    submitWithdrawalRequest(request: WithdrawalRequest): Promise<void>;
    getScriptHashByShortAddress(address: HexString): Promise<Hash>;
    getBalance(sudt_id: Uint32, address: HexString): Promise<Uint128>;
    getBalanceById(sudt_id: Uint32, account_id: Uint32): Promise<Uint128>;
    getStorageAt(account_id: Uint32, key: Hash): Promise<Hash>;
    getAccountIdByScriptHash(script_hash: Hash): Promise<Uint32 | undefined>;
    getNonce(account_id: Uint32): Promise<Uint32>;
    getScript(script_hash: Hash): Promise<Script>;
    getScriptHash(account_id: Uint32): Promise<Hash>;
    getData(data_hash: Hash): Promise<HexString>;
    hasDataHash(data_hash: Hash): Promise<boolean>;
    getTransactionReceipt(l2_tx_hash: Hash): Promise<any>;
}
export declare class GodwokenUtils {
    private rollup_type_hash;
    constructor(rollup_type_hash: Hash);
    generateTransactionMessageWithoutPrefixToSign(raw_l2tx: RawL2Transaction, sender_script_hash: Hash, receiver_script_hash: Hash): Hash;
    generateTransactionMessageToSign(raw_l2tx: RawL2Transaction, sender_script_hash: Hash, receiver_script_hash: Hash): Hash;
    generateWithdrawalMessageWithoutPrefixToSign(raw_request: RawWithdrawalRequest): Hash;
    generateWithdrawalMessageToSign(raw_request: RawWithdrawalRequest): Hash;
    static createAccountRawL2Transaction(from_id: Uint32, nonce: Uint32, script: Script, sudt_id?: Uint32, fee_amount?: Uint128): RawL2Transaction;
    static createRawWithdrawalRequest(nonce: Uint32, capacity: Uint64, amount: Uint128, sudt_script_hash: Hash, account_script_hash: Hash, sell_amount: Uint128, sell_capacity: Uint64, owner_lock_hash: Hash, payment_lock_hash: Hash, fee: Fee): RawWithdrawalRequest;
}
