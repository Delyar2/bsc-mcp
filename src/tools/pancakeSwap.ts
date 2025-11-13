import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pancakeSwap } from "../functions/pancakeSwapTool.js";
import { getAccount, publicClient } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export function registerPancakeSwap(server: McpServer) {
  server.tool("PancakeSwap_Token_Exchange", "💱Exchange tokens on BNBChain using PancakeSwap DEX", {
      inputToken: z.string(),
      outputToken: z.string(),
      amount: z.string(),
    },
    async ({ inputToken, outputToken, amount }) => {
      let txHash = undefined;
      try {
        const account = await getAccount();
        txHash = await pancakeSwap({
          account,
          inputToken,
          outputToken,
          amount,
        });
        const txUrl = await checkTransactionHash(txHash)
        
        return {
          content: [
            {
              type: "text",
              text: `PancakeSwap transaction sent successfully. ${txUrl}`,
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
