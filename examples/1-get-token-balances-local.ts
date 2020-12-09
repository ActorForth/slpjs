/***************************************************************************************
 *
 *  Example 1: Fetch token balances for an address
 *             using BCHD client and Local Validator
 *
 *  NOTE: See example file: "1a-get-token-balances-bchd-trusted.ts" for trusted validator
 *        using SLPDB.
 *
 *  Instructions:
 *      (1) - Select Network and Address by commenting/un-commenting the desired
 *              TESTNET or MAINNET section and providing valid BCH address.
 *      (2) - Run `ts-node <file-name.js>` just before script execution,
 *            or use vscode debugger w/ launch.json settings for "Current TS File"
 *
 * ************************************************************************************/

import * as BITBOXSDK from "bitbox-sdk";
const BITBOX = new BITBOXSDK.BITBOX();
import { GrpcClient } from "grpc-bchrpc-node";
import { LocalValidator, SlpBalancesResult } from "../index";
import { BchdNetwork } from "../lib/bchdnetwork";
import { GetRawTransactionsAsync } from "../lib/localvalidator";

// MAINNET NETWORK
const addr = "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu";
const testnet = false;

// TESTNET NETWORK
// const addr = "slptest:qrzp09cnyysvsjc0s63kflmdmewuuwvs4gc8h7uh86";
// const testnet = true;

// NOTE: you will want to override the "url" parameter with a local node in production use,
const client = new GrpcClient({testnet});

// VALIDATOR: FOR LOCAL VALIDATOR
const getRawTransactions: GetRawTransactionsAsync = async (txids: string[]) => {
    const getRawTransaction = async (txid: string) => {
        console.log(`Downloading: ${txid}`);
        return await client.getRawTransaction({hash: txid, reversedHashOrder: true});
    };
    return (await Promise.all(
        txids.map((txid) => getRawTransaction(txid))))
        .map((res) => Buffer.from(res.getTransaction_asU8()).toString("hex"));
};

const logger = console;
const validator = new LocalValidator(BITBOX, getRawTransactions, logger);
const network = new BchdNetwork({BITBOX, client, validator});

(async () => {
    console.log(`Checking balances for ${addr}`);
    const balances = (await network.getAllSlpBalancesAndUtxos(addr)) as SlpBalancesResult;
    let counter = 0;
    for (const key in balances.slpTokenBalances) {
        counter++;
        const tokenInfo = await network.getTokenInformation(key);
        console.log(`TokenId: ${key}, SLP Type: ${tokenInfo.versionType}, Balance: ${balances.slpTokenBalances[key].div(10 ** tokenInfo.decimals).toFixed(tokenInfo.decimals)}`);
    }
    for (const key in balances.nftParentChildBalances) {
        counter++;
        // TODO ...
    }
    if (counter === 0) {
        console.log("No tokens found for this address.");
    }
})();
