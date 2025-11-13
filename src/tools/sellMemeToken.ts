
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    parseUnits,
    type Hex,
} from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

const tokenAbi = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },

]

export function registerSellMemeToken(server: McpServer) {

    server.tool("Sell_Meme_Token", "💰Sell meme tokens for other currencies", {
            token: z.string(),
            tokenValue: z.string(),
        },
        async ({ token, tokenValue }) => {

            let txHash = undefined;
            try {

                const account = await getAccount();
                const allowanceAmount = await publicClient.readContract({
                    address: token as Hex,
                    abi: tokenAbi,
                    functionName: 'allowance',
                    args: [account.address, AddressConfig.FourMemeSellTokenAMAPContract],
                }) as bigint;
                if (allowanceAmount < parseUnits(tokenValue, 18)) {

                    const hash = await walletClient(account).writeContract({
                        account,
                        address: token as Hex,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: [AddressConfig.FourMemeSellTokenAMAPContract, parseUnits(tokenValue, 18)],
                    });

                    await publicClient.waitForTransactionReceipt({
                        hash: hash,
                        retryCount: 300,
                        retryDelay: 100,
                    });
                }


                txHash = await walletClient(account).writeContract({
                    account,
                    address: AddressConfig.FourMemeSellTokenAMAPContract,
                    abi: [{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                            }
                        ],
                        "name": "sellToken",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }],
                    functionName: 'sellToken',
                    args: [token as Hex, parseUnits(tokenValue, 18)],
                });

                const txUrl = await checkTransactionHash(txHash)
        
                return {
                    content: [
                        {
                            type: "text",
                            text: `sell meme token successfully. ${txUrl}`,
                            url: txUrl,
                        },
                    ],
                };
            } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                const txUrl = buildTxUrl(txHash);
                return {
                  content: [
                    {
                      type: "text",
                      text: `transaction failed: ${errorMessage}`,
                      url: txUrl,
                    },
                  ],
                  isError: true,
                };
            }
        }
    );
}