/**
 * Fetch tokens from PancakeSwap token list
 * @returns Array of token data
 */

import { Address } from "viem";

export interface TokenInfo {
  address: Address;
  decimals: number;
  symbol?: string;
  name?: string;
}
