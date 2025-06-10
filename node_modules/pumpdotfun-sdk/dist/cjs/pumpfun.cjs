'use strict';

var web3_js = require('@solana/web3.js');
var anchor = require('@coral-xyz/anchor');
var globalAccount = require('./globalAccount.cjs');
var events = require('./events.cjs');
var splToken = require('@solana/spl-token');
var bondingCurveAccount = require('./bondingCurveAccount.cjs');
var bn = require('./_virtual/bn.cjs');
var util = require('./util.cjs');
var pumpFun = require('./IDL/pump-fun.json.cjs');

const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const GLOBAL_ACCOUNT_SEED = "global";
const MINT_AUTHORITY_SEED = "mint-authority";
const BONDING_CURVE_SEED = "bonding-curve";
const METADATA_SEED = "metadata";
const DEFAULT_DECIMALS = 6;
class PumpFunSDK {
    program;
    connection;
    constructor(provider) {
        this.program = new anchor.Program(pumpFun.default, provider);
        this.connection = this.program.provider.connection;
    }
    async createAndBuy(creator, mint, createTokenMetadata, buyAmountSol, slippageBasisPoints = 500n, priorityFees, commitment = util.DEFAULT_COMMITMENT, finality = util.DEFAULT_FINALITY) {
        let tokenMetadata = await this.createTokenMetadata(createTokenMetadata);
        let createTx = await this.getCreateInstructions(creator.publicKey, createTokenMetadata.name, createTokenMetadata.symbol, tokenMetadata.metadataUri, mint);
        let newTx = new web3_js.Transaction().add(createTx);
        if (buyAmountSol > 0) {
            const globalAccount = await this.getGlobalAccount(commitment);
            const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
            const buyAmountWithSlippage = util.calculateWithSlippageBuy(buyAmountSol, slippageBasisPoints);
            const buyTx = await this.getBuyInstructions(creator.publicKey, mint.publicKey, globalAccount.feeRecipient, buyAmount, buyAmountWithSlippage);
            newTx.add(buyTx);
        }
        let createResults = await util.sendTx(this.connection, newTx, creator.publicKey, [creator, mint], priorityFees, commitment, finality);
        return createResults;
    }
    async buy(buyer, mint, buyAmountSol, slippageBasisPoints = 500n, priorityFees, commitment = util.DEFAULT_COMMITMENT, finality = util.DEFAULT_FINALITY) {
        let buyTx = await this.getBuyInstructionsBySolAmount(buyer.publicKey, mint, buyAmountSol, slippageBasisPoints, commitment);
        let buyResults = await util.sendTx(this.connection, buyTx, buyer.publicKey, [buyer], priorityFees, commitment, finality);
        return buyResults;
    }
    async sell(seller, mint, sellTokenAmount, slippageBasisPoints = 500n, priorityFees, commitment = util.DEFAULT_COMMITMENT, finality = util.DEFAULT_FINALITY) {
        let sellTx = await this.getSellInstructionsByTokenAmount(seller.publicKey, mint, sellTokenAmount, slippageBasisPoints, commitment);
        let sellResults = await util.sendTx(this.connection, sellTx, seller.publicKey, [seller], priorityFees, commitment, finality);
        return sellResults;
    }
    //create token instructions
    async getCreateInstructions(creator, name, symbol, uri, mint) {
        const mplTokenMetadata = new web3_js.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
        const [metadataPDA] = web3_js.PublicKey.findProgramAddressSync([
            Buffer.from(METADATA_SEED),
            mplTokenMetadata.toBuffer(),
            mint.publicKey.toBuffer(),
        ], mplTokenMetadata);
        const associatedBondingCurve = await splToken.getAssociatedTokenAddress(mint.publicKey, this.getBondingCurvePDA(mint.publicKey), true);
        return this.program.methods
            .create(name, symbol, uri, creator)
            .accounts({
            mint: mint.publicKey,
            associatedBondingCurve: associatedBondingCurve,
            metadata: metadataPDA,
            user: creator,
        })
            .signers([mint])
            .transaction();
    }
    async getBuyInstructionsBySolAmount(buyer, mint, buyAmountSol, slippageBasisPoints = 500n, commitment = util.DEFAULT_COMMITMENT) {
        let bondingCurveAccount = await this.getBondingCurveAccount(mint, commitment);
        if (!bondingCurveAccount) {
            throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
        }
        let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
        let buyAmountWithSlippage = util.calculateWithSlippageBuy(buyAmountSol, slippageBasisPoints);
        let globalAccount = await this.getGlobalAccount(commitment);
        return await this.getBuyInstructions(buyer, mint, globalAccount.feeRecipient, buyAmount, buyAmountWithSlippage);
    }
    //buy
    async getBuyInstructions(buyer, mint, feeRecipient, amount, solAmount, commitment = util.DEFAULT_COMMITMENT) {
        const associatedBondingCurve = await splToken.getAssociatedTokenAddress(mint, this.getBondingCurvePDA(mint), true);
        const associatedUser = await splToken.getAssociatedTokenAddress(mint, buyer, false);
        let transaction = new web3_js.Transaction();
        try {
            await splToken.getAccount(this.connection, associatedUser, commitment);
        }
        catch (e) {
            transaction.add(splToken.createAssociatedTokenAccountInstruction(buyer, associatedUser, buyer, mint));
        }
        transaction.add(await this.program.methods
            .buy(new bn.bnExports.BN(amount.toString()), new bn.bnExports.BN(solAmount.toString()))
            .accounts({
            feeRecipient: feeRecipient,
            mint: mint,
            associatedBondingCurve: associatedBondingCurve,
            associatedUser: associatedUser,
            user: buyer,
        })
            .transaction());
        return transaction;
    }
    //sell
    async getSellInstructionsByTokenAmount(seller, mint, sellTokenAmount, slippageBasisPoints = 500n, commitment = util.DEFAULT_COMMITMENT) {
        let bondingCurveAccount = await this.getBondingCurveAccount(mint, commitment);
        if (!bondingCurveAccount) {
            throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
        }
        let globalAccount = await this.getGlobalAccount(commitment);
        let minSolOutput = bondingCurveAccount.getSellPrice(sellTokenAmount, globalAccount.feeBasisPoints);
        let sellAmountWithSlippage = util.calculateWithSlippageSell(minSolOutput, slippageBasisPoints);
        return await this.getSellInstructions(seller, mint, globalAccount.feeRecipient, sellTokenAmount, sellAmountWithSlippage);
    }
    async getSellInstructions(seller, mint, feeRecipient, amount, minSolOutput) {
        const associatedBondingCurve = await splToken.getAssociatedTokenAddress(mint, this.getBondingCurvePDA(mint), true);
        const associatedUser = await splToken.getAssociatedTokenAddress(mint, seller, false);
        let transaction = new web3_js.Transaction();
        transaction.add(await this.program.methods
            .sell(new bn.bnExports.BN(amount.toString()), new bn.bnExports.BN(minSolOutput.toString()))
            .accounts({
            feeRecipient: feeRecipient,
            mint: mint,
            associatedBondingCurve: associatedBondingCurve,
            associatedUser: associatedUser,
            user: seller,
        })
            .transaction());
        return transaction;
    }
    async getBondingCurveAccount(mint, commitment = util.DEFAULT_COMMITMENT) {
        const tokenAccount = await this.connection.getAccountInfo(this.getBondingCurvePDA(mint), commitment);
        if (!tokenAccount) {
            return null;
        }
        return bondingCurveAccount.BondingCurveAccount.fromBuffer(tokenAccount.data);
    }
    async getGlobalAccount(commitment = util.DEFAULT_COMMITMENT) {
        const [globalAccountPDA] = web3_js.PublicKey.findProgramAddressSync([Buffer.from(GLOBAL_ACCOUNT_SEED)], new web3_js.PublicKey(PROGRAM_ID));
        const tokenAccount = await this.connection.getAccountInfo(globalAccountPDA, commitment);
        return globalAccount.GlobalAccount.fromBuffer(tokenAccount.data);
    }
    getBondingCurvePDA(mint) {
        return web3_js.PublicKey.findProgramAddressSync([Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()], this.program.programId)[0];
    }
    async createTokenMetadata(create) {
        // Validate file
        if (!(create.file instanceof Blob)) {
            throw new Error('File must be a Blob or File object');
        }
        let formData = new FormData();
        formData.append("file", create.file, 'image.png'); // Add filename
        formData.append("name", create.name);
        formData.append("symbol", create.symbol);
        formData.append("description", create.description);
        formData.append("twitter", create.twitter || "");
        formData.append("telegram", create.telegram || "");
        formData.append("website", create.website || "");
        formData.append("showName", "true");
        try {
            const request = await fetch("https://pump.fun/api/ipfs", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
                credentials: 'same-origin'
            });
            if (request.status === 500) {
                // Try to get more error details
                const errorText = await request.text();
                throw new Error(`Server error (500): ${errorText || 'No error details available'}`);
            }
            if (!request.ok) {
                throw new Error(`HTTP error! status: ${request.status}`);
            }
            const responseText = await request.text();
            if (!responseText) {
                throw new Error('Empty response received from server');
            }
            try {
                return JSON.parse(responseText);
            }
            catch (e) {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
        }
        catch (error) {
            console.error('Error in createTokenMetadata:', error);
            throw error;
        }
    }
    //EVENTS
    addEventListener(eventType, callback) {
        return this.program.addEventListener(eventType, (event, slot, signature) => {
            let processedEvent;
            switch (eventType) {
                case "createEvent":
                    processedEvent = events.toCreateEvent(event);
                    callback(processedEvent, slot, signature);
                    break;
                case "tradeEvent":
                    processedEvent = events.toTradeEvent(event);
                    callback(processedEvent, slot, signature);
                    break;
                case "completeEvent":
                    processedEvent = events.toCompleteEvent(event);
                    callback(processedEvent, slot, signature);
                    break;
                case "setParamsEvent":
                    processedEvent = events.toSetParamsEvent(event);
                    callback(processedEvent, slot, signature);
                    break;
                default:
                    console.error("Unhandled event type:", eventType);
            }
        });
    }
    removeEventListener(eventId) {
        this.program.removeEventListener(eventId);
    }
}

exports.BONDING_CURVE_SEED = BONDING_CURVE_SEED;
exports.DEFAULT_DECIMALS = DEFAULT_DECIMALS;
exports.GLOBAL_ACCOUNT_SEED = GLOBAL_ACCOUNT_SEED;
exports.METADATA_SEED = METADATA_SEED;
exports.MINT_AUTHORITY_SEED = MINT_AUTHORITY_SEED;
exports.PumpFunSDK = PumpFunSDK;
//# sourceMappingURL=pumpfun.cjs.map
