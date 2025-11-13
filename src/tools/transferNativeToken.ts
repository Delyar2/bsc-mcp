import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseEther } from "viem";
import { getAccount, walletClient } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export function registerTransferNativeToken(server: McpServer) {
  server.tool("Send_BNB", "💎Transfer native token (BNB), Before execution, check the wallet information first", {
      recipientAddress: z.string(),
      amount: z.string(),
    },
    async ({ recipientAddress, amount }) => {
      let txHash = undefined;
      try {

        const account = await getAccount();
        txHash = await walletClient(account).sendTransaction({
          to: recipientAddress as `0x${string}`,
          value: parseEther(amount),
        });

        const txUrl = await checkTransactionHash(txHash)
        
        return {
          content: [
            {
              type: "text",
              text: `Transaction sent successfully. ${txUrl}`,
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
