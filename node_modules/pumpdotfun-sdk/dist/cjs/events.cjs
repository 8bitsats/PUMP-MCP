'use strict';

var web3_js = require('@solana/web3.js');

function toCreateEvent(event) {
    return {
        name: event.name,
        symbol: event.symbol,
        uri: event.uri,
        mint: new web3_js.PublicKey(event.mint),
        bondingCurve: new web3_js.PublicKey(event.bondingCurve),
        user: new web3_js.PublicKey(event.user),
    };
}
function toCompleteEvent(event) {
    return {
        user: new web3_js.PublicKey(event.user),
        mint: new web3_js.PublicKey(event.mint),
        bondingCurve: new web3_js.PublicKey(event.bondingCurve),
        timestamp: Number(event.timestamp),
    };
}
function toTradeEvent(event) {
    return {
        mint: new web3_js.PublicKey(event.mint),
        solAmount: BigInt(event.solAmount),
        tokenAmount: BigInt(event.tokenAmount),
        isBuy: event.isBuy,
        user: new web3_js.PublicKey(event.user),
        timestamp: Number(event.timestamp),
        virtualSolReserves: BigInt(event.virtualSolReserves),
        virtualTokenReserves: BigInt(event.virtualTokenReserves),
        realSolReserves: BigInt(event.realSolReserves),
        realTokenReserves: BigInt(event.realTokenReserves),
    };
}
function toSetParamsEvent(event) {
    return {
        feeRecipient: new web3_js.PublicKey(event.feeRecipient),
        initialVirtualTokenReserves: BigInt(event.initialVirtualTokenReserves),
        initialVirtualSolReserves: BigInt(event.initialVirtualSolReserves),
        initialRealTokenReserves: BigInt(event.initialRealTokenReserves),
        tokenTotalSupply: BigInt(event.tokenTotalSupply),
        feeBasisPoints: BigInt(event.feeBasisPoints),
    };
}

exports.toCompleteEvent = toCompleteEvent;
exports.toCreateEvent = toCreateEvent;
exports.toSetParamsEvent = toSetParamsEvent;
exports.toTradeEvent = toTradeEvent;
//# sourceMappingURL=events.cjs.map
