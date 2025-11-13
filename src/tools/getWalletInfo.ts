import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBalance } from "../functions/fetchBalanceTool.js";
import { getAccount } from "../config.js";

export function registerGetWalletInfo(server: McpServer) {
  server.tool("Get_Wallet_Info", "👛View detailed balance and holdings for any wallet address", {
      address: z.string().optional().describe("When querying the user's own wallet value, it is null"),
    },
    async ({ address }) => {
      try {
        if (address === '' || !address || address === 'null') {
          const account = await getAccount();
          address = account.address
        }
        const balance = await getBalance(address);

        return {
          content: [
            {
              type: "text",
              text: `Native Balance (BNB): ${balance.nativeBalance}\n\nToken Balances:\n${JSON.stringify(balance.tokenBalances)}\n\nWallet Address: ${address}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Failed to fetch balance: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
