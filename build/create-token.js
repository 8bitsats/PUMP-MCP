import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { initializeSDK, createMcpResponse } from "./get-token-info.js";
import { getOrCreateKeypair, getSPLBalance, rootDir, safeStringify, } from "./utils.js";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Blob } from "buffer";
dotenv.config({ path: path.join(rootDir, ".env") });
const DEFAULT_SLIPPAGE_BASIS_POINTS = 100n;
const DEFAULT_PRIORITY_FEES = {
    unitLimit: 250000,
    unitPrice: 250000,
};
export async function createToken(name, symbol, description, imageUrl, initialBuyAmount, accountName = "default") {
    try {
        const { sdk, connection } = initializeSDK();
        const keysFolder = path.resolve(rootDir, ".keys");
        const account = getOrCreateKeypair(keysFolder, accountName);
        const balance = await connection.getBalance(account.publicKey);
        const requiredBalance = initialBuyAmount * LAMPORTS_PER_SOL + 0.003 * LAMPORTS_PER_SOL;
        if (balance < requiredBalance) {
            return {
                success: false,
                error: `Insufficient SOL balance. Account ${account.publicKey.toString()} has ${balance / LAMPORTS_PER_SOL} SOL, but needs at least ${requiredBalance / LAMPORTS_PER_SOL} SOL. Please send SOL to this address and try again.`,
            };
        }
        const mint = Keypair.generate();
        let fileBlob;
        if (imageUrl) {
            try {
                let imageData;
                if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                    const res = await fetch(imageUrl);
                    if (!res.ok) {
                        throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
                    }
                    const arrayBuffer = await res.arrayBuffer();
                    imageData = Buffer.from(arrayBuffer);
                }
                else {
                    imageData = fs.readFileSync(imageUrl);
                }
                fileBlob = new Blob([imageData], { type: "image/png" });
            }
            catch (error) {
                console.error(`Error loading image from ${imageUrl}:`, error);
                return { success: false, error: `Failed to load image from ${imageUrl}` };
            }
        }
        const tokenMetadata = {
            name,
            symbol,
            description,
            file: fileBlob,
        };
        const result = await sdk.createAndBuy(account, mint, tokenMetadata, BigInt(initialBuyAmount * LAMPORTS_PER_SOL), DEFAULT_SLIPPAGE_BASIS_POINTS, DEFAULT_PRIORITY_FEES);
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Unknown error",
            };
        }
        fs.writeFileSync(path.join(keysFolder, `mint-${mint.publicKey.toString()}.json`), safeStringify(Array.from(mint.secretKey)));
        const tokenBalance = await getSPLBalance(connection, mint.publicKey, account.publicKey);
        return {
            success: true,
            tokenAddress: mint.publicKey.toString(),
            tokenName: name,
            tokenSymbol: symbol,
            tokenBalance,
            signature: result.signature,
            pumpfunUrl: `https://pump.fun/${mint.publicKey.toString()}`,
        };
    }
    catch (error) {
        console.error("Error creating token:", error);
        return { success: false, error: error?.message || "Unknown error" };
    }
}
export function formatCreateTokenResult(result) {
    if (!result.success) {
        return `Error creating token: ${result.error}`;
    }
    return [
        `Successfully created token!`,
        `Token Address: ${result.tokenAddress}`,
        `Token Name: ${result.tokenName}`,
        `Token Symbol: ${result.tokenSymbol}`,
        `Your Balance: ${result.tokenBalance}`,
        `Transaction Signature: ${result.signature}`,
        `Pump.fun URL: ${result.pumpfunUrl}`,
    ].join("\n");
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.error("Usage: node create-token.js <name> <symbol> <description> <initial_buy_amount> [account_name] [image_url]");
        console.error("Example: node create-token.js MyToken MTK 'My first token' 0.1 default");
        process.exit(1);
    }
    const name = args[0];
    const symbol = args[1];
    const description = args[2];
    const initialBuyAmount = parseFloat(args[3]);
    const accountName = args[4] || "default";
    const imageUrl = args[5];
    if (isNaN(initialBuyAmount) || initialBuyAmount < 0.0001) {
        console.error("Initial buy amount must be a number greater than or equal to 0.0001");
        process.exit(1);
    }
    try {
        const result = await createToken(name, symbol, description, imageUrl, initialBuyAmount, accountName);
        console.log("\nResult:");
        const formattedResult = formatCreateTokenResult(result);
        console.log(formattedResult);
        const mcpResponse = createMcpResponse(formattedResult);
        console.log("\nMCP Response (for reference):");
        console.log(JSON.stringify(mcpResponse, null, 2));
    }
    catch (error) {
        console.error("Error in main:", error);
    }
}
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    main().catch(console.error);
}
export default {
    createToken,
    formatCreateTokenResult,
};
