import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseUnits, getContract, Address, publicActions } from "viem"; 
import { bep20abi } from "../lib/bep20Abi.js";
import { getAccount, walletClient } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export function registerTransferBEP20Token(server: McpServer) {
  server.tool("Send_BEP20_Token", "📤Send any BEP-20 token to another wallet (requires wallet check first)", {
      recipientAddress: z.string(),
      amount: z.string(),
      address: z.string(),
    },
    async ({ recipientAddress, amount, address }) => {
      let txHash = undefined;
      try {
        // Get token details including address and decimals

        const account = await getAccount();
        const client = walletClient(account).extend(publicActions)

        const contract = getContract({
          address: address as Address,
          abi: bep20abi,
          client,
        });

        const decimals = await contract.read.decimals();
        // Parse the amount based on token decimals
        const parsedAmount = parseUnits(amount, decimals);

        txHash = await contract.write.transfer([
          `0x${recipientAddress.replace("0x", "")}`,
          parsedAmount,
        ], {
          gas: BigInt(100000),
        });
        const txUrl = await checkTransactionHash(txHash)
        

        return {
          content: [
            {
              type: "text",
              text: `BEP-20 token transfer sent successfully. ${txUrl}`,
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
