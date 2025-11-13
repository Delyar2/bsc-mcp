
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    parseUnits,
    type Hex,
} from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";


export function registerBuyMemeToken(server: McpServer) {

    server.tool("Buy_Meme_Token", "🚀Purchase meme tokens on BNBChain", {
            token: z.string(),
            tokenValue: z.string().default("0"),
            bnbValue: z.string().default("0"),
        },
        async ({ token, tokenValue, bnbValue }) => {

            let txHash = undefined;
            try {
                

                const account = await getAccount();
                
                const [,,estimatedAmount,,,amountMsgValue,,] = await publicClient.readContract({
                        address: AddressConfig.FourMemeTryBuyContract,
                        abi: [
                            {
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
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "funds",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "tryBuy",
                                "outputs": [
                                    {
                                        "internalType": "address",
                                        "name": "tokenManager",
                                        "type": "address"
                                    },
                                    {
                                        "internalType": "address",
                                        "name": "quote",
                                        "type": "address"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedAmount",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedCost",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedFee",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountMsgValue",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountApproval",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountFunds",
                                        "type": "uint256"
                                    }
                                ],
                                "stateMutability": "view",
                                "type": "function"
                            }],
                        functionName: 'tryBuy',
                        args: [token as Hex, parseUnits(tokenValue, 18), parseUnits(bnbValue, 18)],
                    });

                let outputAmount;
                let inputAmount;
                if (tokenValue == "0") {
                    outputAmount = (BigInt(estimatedAmount) * BigInt(100 - 20)) / 100n
                    inputAmount = amountMsgValue
                } else {
                    outputAmount = estimatedAmount;
                    inputAmount =  (BigInt(amountMsgValue) * BigInt(100 + 5)) / 100n
                }

                txHash = await walletClient(account).writeContract({
                    account,
                    address: AddressConfig.FourMemeBuyTokenAMAPContract,
                    abi: [{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "funds",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "minAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "buyTokenAMAP",
                        "outputs": [],
                        "stateMutability": "payable",
                        "type": "function"
                    }],
                    functionName: 'buyTokenAMAP',
                    args: [token as Hex, BigInt(inputAmount), outputAmount],
                    value: BigInt(inputAmount),
                });

                const txUrl = await checkTransactionHash(txHash)
                return {
                    content: [
                        {
                            type: "text",
                            text: `buy meme token successfully. ${txUrl}`,
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