
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { removeLiquidityV3 } from "../functions/pancakeRemoveLiquidityTool.js";
import { getAccount } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export function registerPancakeRemovePosition(server: McpServer) {

    server.tool("Remove_PancakeSwap_Liquidity", "🔄Withdraw your liquidity from PancakeSwap pools", {
            positionId: z.string(),
            percent: z.number().max(100).min(1),
        },
        async ({ positionId, percent }) => {

            let txHash = undefined;
            try {

                const account = await getAccount();
                txHash = await removeLiquidityV3(account, BigInt(positionId), percent);
                const txUrl = await checkTransactionHash(txHash)
                
                return {
                    content: [
                        {
                            type: "text",
                            text: `remove liquidity position on panceke successfully. ${txUrl}`,
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