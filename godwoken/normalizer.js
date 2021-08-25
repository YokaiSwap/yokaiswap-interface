"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizeUnlockWithdrawalViaFinalize = exports.NormalizeWithdrawalLockArgs = exports.NormalizeSUDTTransfer = exports.NormalizeSUDTQuery = exports.NormalizeCreateAccount = exports.NormalizeFee = exports.NormalizeWithdrawalRequest = exports.NormalizeRawWithdrawalRequest = exports.NormalizeL2Transaction = exports.NormalizeRawL2Transaction = exports.NormalizeCustodianLockArgs = exports.NormalizeHeaderInfo = exports.NormalizeDepositLockArgs = exports.NormalizeDepositRequest = void 0;
const ckb_js_toolkit_1 = require("ckb-js-toolkit");
// Taken for now from https://github.com/xxuejie/ckb-js-toolkit/blob/68f5ff709f78eb188ee116b2887a362123b016cc/src/normalizers.js#L17-L69,
// later we can think about exposing those functions directly.
function normalizeHexNumber(length) {
    return function (debugPath, value) {
        if (!(value instanceof ArrayBuffer)) {
            let intValue = BigInt(value).toString(16);
            if (intValue.length % 2 !== 0) {
                intValue = "0" + intValue;
            }
            if (intValue.length / 2 > length) {
                throw new Error(`${debugPath} is ${intValue.length / 2} bytes long, expected length is ${length}!`);
            }
            const view = new DataView(new ArrayBuffer(length));
            for (let i = 0; i < intValue.length / 2; i++) {
                const start = intValue.length - (i + 1) * 2;
                view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
            }
            value = view.buffer;
        }
        if (value.byteLength < length) {
            const array = new Uint8Array(length);
            array.set(new Uint8Array(value), 0);
            value = array.buffer;
        }
        return value;
    };
}
function normalizeRawData(length) {
    return function (debugPath, value) {
        value = new ckb_js_toolkit_1.Reader(value).toArrayBuffer();
        if (length > 0 && value.byteLength !== length) {
            throw new Error(`${debugPath} has invalid length ${value.byteLength}, required: ${length}`);
        }
        return value;
    };
}
function normalizeObject(debugPath, obj, keys) {
    const result = {};
    for (const [key, f] of Object.entries(keys)) {
        const value = obj[key];
        if (value === undefined || value === null) {
            throw new Error(`${debugPath} is missing ${key}!`);
        }
        result[key] = f(`${debugPath}.${key}`, value);
    }
    return result;
}
function toNormalize(normalize) {
    return function (debugPath, value) {
        return normalize(value, {
            debugPath,
        });
    };
}
function NormalizeDepositRequest(request, { debugPath = "deposit_request" } = {}) {
    return normalizeObject(debugPath, request, {
        capacity: normalizeHexNumber(8),
        amount: normalizeHexNumber(16),
        sudt_script_hash: normalizeRawData(32),
        script: toNormalize(ckb_js_toolkit_1.normalizers.NormalizeScript),
    });
}
exports.NormalizeDepositRequest = NormalizeDepositRequest;
function NormalizeDepositLockArgs(args, { debugPath = "deposit_lock_args" } = {}) {
    return normalizeObject(debugPath, args, {
        owner_lock_hash: normalizeRawData(32),
        layer2_lock: toNormalize(ckb_js_toolkit_1.normalizers.NormalizeScript),
        cancel_timeout: normalizeHexNumber(8),
    });
}
exports.NormalizeDepositLockArgs = NormalizeDepositLockArgs;
function NormalizeHeaderInfo(headerInfo, { debugPath = "header_info" } = {}) {
    return normalizeObject(debugPath, headerInfo, {
        number: normalizeHexNumber(8),
        block_hash: normalizeRawData(32),
    });
}
exports.NormalizeHeaderInfo = NormalizeHeaderInfo;
function NormalizeCustodianLockArgs(args, { debugPath = "custondian_lock_args" } = {}) {
    return normalizeObject(debugPath, args, {
        owner_lock_hash: normalizeRawData(32),
        deposit_block_hash: normalizeRawData(32),
        deposit_block_number: normalizeHexNumber(8),
    });
}
exports.NormalizeCustodianLockArgs = NormalizeCustodianLockArgs;
function NormalizeRawL2Transaction(rawL2Transaction, { debugPath = "raw_l2_transaction" } = {}) {
    return normalizeObject(debugPath, rawL2Transaction, {
        from_id: normalizeHexNumber(4),
        to_id: normalizeHexNumber(4),
        nonce: normalizeHexNumber(4),
        args: normalizeRawData(-1),
    });
}
exports.NormalizeRawL2Transaction = NormalizeRawL2Transaction;
function NormalizeL2Transaction(l2Transaction, { debugPath = "l2_transaction" } = {}) {
    return normalizeObject(debugPath, l2Transaction, {
        raw: toNormalize(NormalizeRawL2Transaction),
        signature: normalizeRawData(-1),
    });
}
exports.NormalizeL2Transaction = NormalizeL2Transaction;
function NormalizeRawWithdrawalRequest(raw_request, { debugPath = "raw_withdrawal_request" } = {}) {
    return normalizeObject(debugPath, raw_request, {
        nonce: normalizeHexNumber(4),
        capacity: normalizeHexNumber(8),
        amount: normalizeHexNumber(16),
        sudt_script_hash: normalizeRawData(32),
        account_script_hash: normalizeRawData(32),
        sell_amount: normalizeHexNumber(16),
        sell_capacity: normalizeHexNumber(8),
        owner_lock_hash: normalizeRawData(32),
        payment_lock_hash: normalizeRawData(32),
        fee: toNormalize(NormalizeFee),
    });
}
exports.NormalizeRawWithdrawalRequest = NormalizeRawWithdrawalRequest;
function NormalizeWithdrawalRequest(request, { debugPath = "withdrawal_request" } = {}) {
    return normalizeObject(debugPath, request, {
        raw: toNormalize(NormalizeRawWithdrawalRequest),
        signature: normalizeRawData(65),
    });
}
exports.NormalizeWithdrawalRequest = NormalizeWithdrawalRequest;
function NormalizeFee(fee, { debugPath = "fee" } = {}) {
    return normalizeObject(debugPath, fee, {
        sudt_id: normalizeHexNumber(4),
        amount: normalizeHexNumber(16),
    });
}
exports.NormalizeFee = NormalizeFee;
function NormalizeCreateAccount(createAccount, { debugPath = "create_account" } = {}) {
    return normalizeObject(debugPath, createAccount, {
        script: toNormalize(ckb_js_toolkit_1.normalizers.NormalizeScript),
        fee: toNormalize(NormalizeFee),
    });
}
exports.NormalizeCreateAccount = NormalizeCreateAccount;
function NormalizeSUDTQuery(sudt_query, { debugPath = "sudt_query" } = {}) {
    return normalizeObject(debugPath, sudt_query, {
        short_address: normalizeRawData(20),
    });
}
exports.NormalizeSUDTQuery = NormalizeSUDTQuery;
function NormalizeSUDTTransfer(sudt_transfer, { debugPath = "sudt_transfer" } = {}) {
    return normalizeObject(debugPath, sudt_transfer, {
        to: normalizeRawData(20),
        amount: normalizeHexNumber(16),
        fee: normalizeHexNumber(16),
    });
}
exports.NormalizeSUDTTransfer = NormalizeSUDTTransfer;
function NormalizeWithdrawalLockArgs(withdrawal_lock_args, { debugPath = "withdrawal_lock_args" } = {}) {
    return normalizeObject(debugPath, withdrawal_lock_args, {
        // the original deposit info
        // used for helping programs generate reverted custodian cell
        // deposit_block_hash: normalizeRawData(32),
        // deposit_block_number: normalizeHexNumber(8),
        account_script_hash: normalizeRawData(32),
        // the original custodian lock hash
        withdrawal_block_hash: normalizeRawData(32),
        withdrawal_block_number: normalizeHexNumber(8),
        // buyer can pay sell_amount token to unlock
        sudt_script_hash: normalizeRawData(32),
        sell_amount: normalizeHexNumber(16),
        sell_capacity: normalizeHexNumber(8),
        // layer1 lock to withdraw after challenge period
        owner_lock_hash: normalizeRawData(32),
        // layer1 lock to receive the payment, must exists on the chain
        payment_lock_hash: normalizeRawData(32),
    });
}
exports.NormalizeWithdrawalLockArgs = NormalizeWithdrawalLockArgs;
function NormalizeUnlockWithdrawalViaFinalize(unlock_withdrawal_finalize, { debugPath = "unlock_withdrawal_finalize" } = {}) {
    return normalizeObject(debugPath, unlock_withdrawal_finalize, {});
}
exports.NormalizeUnlockWithdrawalViaFinalize = NormalizeUnlockWithdrawalViaFinalize;
//# sourceMappingURL=normalizer.js.map