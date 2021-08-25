"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GodwokenUtils = exports.Godwoken = exports.toBuffer = exports.hexToU32 = exports.u32ToHex = exports.UInt32LEToNumber = exports.numberToUInt32LE = exports.normalizer = exports.core = void 0;
const ckb_js_toolkit_1 = require("ckb-js-toolkit");
const base_1 = require("@ckb-lumos/base");
const normalizer_1 = require("./normalizer");
const keccak256_1 = __importDefault(require("keccak256"));
const core = __importStar(require("./schemas"));
exports.core = core;
const normalizer = __importStar(require("./normalizer"));
exports.normalizer = normalizer;
__exportStar(require("./types"), exports);
function numberToUInt32LE(value) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value);
    return `0x${buf.toString("hex")}`;
}
exports.numberToUInt32LE = numberToUInt32LE;
function UInt32LEToNumber(hex) {
    const buf = Buffer.from(hex.slice(2, 10), "hex");
    return buf.readUInt32LE(0);
}
exports.UInt32LEToNumber = UInt32LEToNumber;
function u32ToHex(value) {
    return `0x${value.toString(16)}`;
}
exports.u32ToHex = u32ToHex;
function hexToU32(hex) {
    // return parseInt(hex.slice(2), "hex");
    return +hex;
}
exports.hexToU32 = hexToU32;
function toBuffer(ab) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}
exports.toBuffer = toBuffer;
function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
class Godwoken {
    constructor(url) {
        this.rpc = new ckb_js_toolkit_1.RPC(url);
    }
    async rpcCall(method_name, ...args) {
        const name = "gw_" + method_name;
        const result = await this.rpc[name](...args);
        return result;
    }
    async _send(l2tx, method_name) {
        const data = new ckb_js_toolkit_1.Reader(core.SerializeL2Transaction(normalizer_1.NormalizeL2Transaction(l2tx))).serializeJson();
        return await this.rpcCall(method_name, data);
    }
    async executeL2Transaction(l2tx) {
        return this._send(l2tx, "execute_l2transaction");
    }
    async submitL2Transaction(l2tx) {
        return this._send(l2tx, "submit_l2transaction");
    }
    async executeRawL2Transaction(rawL2Tx) {
        const hex = new ckb_js_toolkit_1.Reader(core.SerializeRawL2Transaction(normalizer_1.NormalizeRawL2Transaction(rawL2Tx))).serializeJson();
        return await this.rpcCall("execute_raw_l2transaction", hex);
    }
    async submitWithdrawalRequest(request) {
        const data = new ckb_js_toolkit_1.Reader(core.SerializeWithdrawalRequest(normalizer_1.NormalizeWithdrawalRequest(request))).serializeJson();
        return await this.rpcCall("submit_withdrawal_request", data);
    }
    async getScriptHashByShortAddress(address) {
        return await this.rpcCall("get_script_hash_by_short_address", address);
    }
    // TODO: maybe swap params later?
    async getBalance(sudt_id, address) {
        const sudt_id_hex = `0x${(+sudt_id).toString(16)}`;
        const balance = await this.rpcCall("get_balance", address, sudt_id_hex);
        return BigInt(balance);
    }
    async getBalanceById(sudt_id, account_id) {
        const scriptHash = await this.getScriptHash(account_id);
        const address = scriptHash.slice(0, 42);
        const balance = await this.getBalance(sudt_id, address);
        return balance;
    }
    async getStorageAt(account_id, key) {
        const account_id_hex = `0x${account_id.toString(16)}`;
        return await this.rpcCall("get_storage_at", account_id_hex, key);
    }
    async getAccountIdByScriptHash(script_hash) {
        const id = await this.rpcCall("get_account_id_by_script_hash", script_hash);
        return id ? +id : undefined;
    }
    async getNonce(account_id) {
        const account_id_hex = `0x${account_id.toString(16)}`;
        const nonce = await this.rpcCall("get_nonce", account_id_hex);
        return parseInt(nonce);
    }
    async getScript(script_hash) {
        return await this.rpcCall("get_script", script_hash);
    }
    async getScriptHash(account_id) {
        const account_id_hex = `0x${account_id.toString(16)}`;
        return await this.rpcCall("get_script_hash", account_id_hex);
    }
    async getData(data_hash) {
        return await this.rpcCall("get_data", data_hash);
    }
    async hasDataHash(data_hash) {
        return await this.rpcCall("get_data_hash", data_hash);
    }
    async getTransactionReceipt(l2_tx_hash) {
        return await this.rpcCall("get_transaction_receipt", l2_tx_hash);
    }
}
exports.Godwoken = Godwoken;
class GodwokenUtils {
    constructor(rollup_type_hash) {
        this.rollup_type_hash = rollup_type_hash;
    }
    generateTransactionMessageWithoutPrefixToSign(raw_l2tx, sender_script_hash, receiver_script_hash) {
        const raw_tx_data = core.SerializeRawL2Transaction(normalizer_1.NormalizeRawL2Transaction(raw_l2tx));
        const rollup_type_hash = Buffer.from(this.rollup_type_hash.slice(2), "hex");
        const senderScriptHash = Buffer.from(sender_script_hash.slice(2), "hex");
        const receiverScriptHash = Buffer.from(receiver_script_hash.slice(2), "hex");
        const data = toArrayBuffer(Buffer.concat([
            rollup_type_hash,
            senderScriptHash,
            receiverScriptHash,
            toBuffer(raw_tx_data),
        ]));
        const message = base_1.utils.ckbHash(data).serializeJson();
        return message;
    }
    generateTransactionMessageToSign(raw_l2tx, sender_script_hash, receiver_script_hash) {
        const message = this.generateTransactionMessageWithoutPrefixToSign(raw_l2tx, sender_script_hash, receiver_script_hash);
        const prefix_buf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
        const buf = Buffer.concat([
            prefix_buf,
            Buffer.from(message.slice(2), "hex"),
        ]);
        return `0x${keccak256_1.default(buf).toString("hex")}`;
    }
    generateWithdrawalMessageWithoutPrefixToSign(raw_request) {
        const raw_request_data = core.SerializeRawWithdrawalRequest(normalizer_1.NormalizeRawWithdrawalRequest(raw_request));
        const rollup_type_hash = Buffer.from(this.rollup_type_hash.slice(2), "hex");
        const data = toArrayBuffer(Buffer.concat([rollup_type_hash, toBuffer(raw_request_data)]));
        const message = base_1.utils.ckbHash(data).serializeJson();
        return message;
    }
    generateWithdrawalMessageToSign(raw_request) {
        const message = this.generateWithdrawalMessageWithoutPrefixToSign(raw_request);
        const prefix_buf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
        const buf = Buffer.concat([
            prefix_buf,
            Buffer.from(message.slice(2), "hex"),
        ]);
        return `0x${keccak256_1.default(buf).toString("hex")}`;
    }
    static createAccountRawL2Transaction(from_id, nonce, script, sudt_id = 1, fee_amount = BigInt(0)) {
        const create_account = {
            script,
            fee: {
                sudt_id: "0x" + (+sudt_id).toString(16),
                amount: "0x" + BigInt(fee_amount).toString(16),
            },
        };
        const enum_tag = "0x00000000";
        const create_account_part = new ckb_js_toolkit_1.Reader(core.SerializeCreateAccount(normalizer_1.NormalizeCreateAccount(create_account))).serializeJson();
        const args = enum_tag + create_account_part.slice(2);
        return {
            from_id: u32ToHex(from_id),
            to_id: u32ToHex(0),
            nonce: u32ToHex(nonce),
            args,
        };
    }
    static createRawWithdrawalRequest(nonce, capacity, amount, sudt_script_hash, account_script_hash, sell_amount, sell_capacity, owner_lock_hash, payment_lock_hash, fee) {
        return {
            nonce: "0x" + BigInt(nonce).toString(16),
            capacity: "0x" + BigInt(capacity).toString(16),
            amount: "0x" + BigInt(amount).toString(16),
            sudt_script_hash: sudt_script_hash,
            account_script_hash: account_script_hash,
            sell_amount: "0x" + BigInt(sell_amount).toString(16),
            sell_capacity: "0x" + BigInt(sell_capacity).toString(16),
            owner_lock_hash: owner_lock_hash,
            payment_lock_hash: payment_lock_hash,
            fee,
        };
    }
}
exports.GodwokenUtils = GodwokenUtils;
//# sourceMappingURL=index.js.map
