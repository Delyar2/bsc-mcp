import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { memeTokenDetail } from "../functions/memeTokenDetails.js";

export function registerQueryMemeTokenDetails(server: McpServer) {
    server.tool(
        "QueryMemeTokenDetails",
        "Fetches token details for a given meme token using the four.meme API. Default price in USDT.",
        {
            tokenName: z.string().describe("The name of the token to query (e.g., HGUSDT)")
        },
        async ({ tokenName }) => {
            try {
                const data = await memeTokenDetail(tokenName);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Token details for "${tokenName}": ${JSON.stringify(data, null, 2)}`
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to fetch token details: ${errorMessage}`
                        }
                    ],
                    isError: true
                };
            }
        }
    );
}
