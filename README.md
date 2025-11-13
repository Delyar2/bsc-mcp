# BNBChain MCP

> A comprehensive Model Context Protocol (MCP) server for interacting with Binance Smart Chain (BSC), providing secure and efficient tools for token transfers, DEX operations, and smart contract interactions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ESM-green.svg)](https://nodejs.org/)

## Overview

BNBChain MCP is a production-ready MCP server that enables AI agents and applications to interact with the Binance Smart Chain ecosystem. It provides a secure, type-safe interface for blockchain operations including token transfers, PancakeSwap integration, meme token trading, and comprehensive wallet management.

## Key Features

### 🔐 Security
- **AES-256 encryption** for private key storage
- **bcrypt password protection** for wallet credentials
- **GoPlus security integration** for token verification
- Secure configuration management

### 💱 DeFi Operations
- **PancakeSwap V2/V3 integration** for token swaps
- **Liquidity management** (add/remove positions)
- **Position tracking** and portfolio management
- Gas-optimized transaction routing

### 🪙 Token Management
- Native BNB transfers
- BEP-20 token transfers via symbol or address
- Meme token creation and trading (Four.Meme platform)
- Token security analysis and verification

### 🤖 AI-Ready
- **Model Context Protocol (MCP)** compliant
- Seamless Claude Desktop integration
- Structured tool APIs for AI agents
- Type-safe TypeScript implementation

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Blockchain** | Binance Smart Chain (BSC) |
| **Web3 Library** | Viem 2.23.11 |
| **DEX SDK** | PancakeSwap SDK 5.8.8 |
| **Protocol** | Model Context Protocol SDK 1.4.0 |
| **Language** | TypeScript (ESM) |
| **Security** | AES-256, bcrypt |
| **Data Provider** | Moralis SDK 2.27.2 |
| **Token Security** | GoPlus SDK 1.0.12 |

## Supported Networks

### BNB Smart Chain Mainnet
- **Chain ID**: 56
- **Default RPC**: `https://bsc-dataseed.binance.org`
- **Custom RPC**: Configurable via environment settings

## Installation

### Prerequisites
- Node.js 18+ (ESM support required)
- npm or yarn package manager

### Global Installation

```bash
npm install -g bnbchain-mcp
```

### Local Development

```bash
git clone <repository-url>
cd bsc-mcp
npm install
npm run build
```

## Quick Start

### 1. Initial Configuration

Run the interactive setup wizard:

```bash
bnbchain-mcp --init
```

The wizard will prompt you for:
- **BSC Wallet Private Key** (required) - Your wallet's private key
- **Wallet Password** (required) - Minimum 6 characters for encryption
- **Custom RPC URL** (optional) - Defaults to Binance public RPC

### 2. Verify Installation

```bash
bnbchain-mcp --version
```

### 3. Start MCP Server

```bash
npm start
# or
node build/index.js
```

## Claude Desktop Integration

After initial configuration, the tool automatically configures Claude Desktop integration.

**Configuration File Location:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

The MCP server will be automatically detected and available for use with Claude Desktop.

## Available Tools

### Wallet Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `transferNativeToken` | Transfer BNB to a wallet address | `to`, `amount` |
| `transferBEP20Token` | Transfer BEP-20 tokens by symbol or address | `token`, `to`, `amount` |
| `getWalletInfo` | Retrieve comprehensive wallet information | `address` |
| `getBalance` | Get token and native balance for an address | `address`, `token` (optional) |

### PancakeSwap Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `pancakeSwap` | Execute token swaps via PancakeSwap | `tokenIn`, `tokenOut`, `amount`, `slippage` |
| `pancakeAddLiquidity` | Add liquidity to PancakeSwap pools | `tokenA`, `tokenB`, `amountA`, `amountB` |
| `pancakeMyPosition` | View your PancakeSwap liquidity positions | `poolAddress` (optional) |
| `pancakeRemovePosition` | Remove liquidity from PancakeSwap | `poolAddress`, `liquidity` |

### Meme Token Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `buyMemeToken` | Purchase meme tokens on Four.Meme | `tokenAddress`, `amount` |
| `sellMemeToken` | Sell meme tokens on Four.Meme | `tokenAddress`, `amount` |
| `queryMemeTokenDetails` | Get detailed information about meme tokens | `tokenAddress` |

### Security & Analysis

| Tool | Description | Parameters |
|------|-------------|------------|
| `securityCheck` | Perform GoPlus security analysis on tokens | `tokenAddress` |

## Contract Addresses

| Contract Type | Address | Description |
|--------------|---------|-------------|
| **Four.Meme Try Buy** | `0xF251F83e40a78868FcfA3FA4599Dad6494E46034` | Token purchase contract |
| **Four.Meme Buy/Sell AMAP** | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` | Auto-market-adjusted pricing |
| **Four.Meme Create Token** | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` | Token factory contract |
| **PancakeSwap Router V2** | Integrated via SDK | DEX routing and swaps |
| **PancakeSwap V3 Pools** | Accessed via SDK | Liquidity pools management |

## Development

### Build Project

```bash
npm run build
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:privateAES
```

### Reconfigure

To update your configuration:

```bash
bnbchain-mcp --init
```

### Development Scripts

```bash
# Build and initialize
npm run init:build

# Auto-publish (for maintainers)
npm run publish:auto
```

## Architecture

### Project Structure

```
bsc-mcp/
├── src/
│   ├── cli/              # CLI command handlers
│   ├── functions/        # Core business logic
│   ├── tools/            # MCP tool implementations
│   ├── lib/              # Shared libraries and ABIs
│   ├── types/            # TypeScript type definitions
│   ├── config.ts         # Configuration management
│   ├── main.ts           # MCP server entry point
│   └── index.ts          # CLI entry point
├── build/                # Compiled JavaScript output
└── scripts/              # Build and deployment scripts
```

### Security Architecture

- **Private Key Encryption**: AES-256 encryption with user-provided password
- **Password Hashing**: bcrypt for secure password storage
- **Configuration Storage**: Encrypted local configuration files
- **Token Verification**: GoPlus SDK integration for security checks

## Model Context Protocol (MCP)

This project implements the [Model Context Protocol](https://modelcontextprotocol.io/), a standardized protocol for AI agents to interact with external tools and data sources.

### MCP Benefits

- ✅ **Structured Communication**: Type-safe request/response patterns
- ✅ **AI Agent Compatibility**: Works with Claude, OpenAI, and other MCP-compatible agents
- ✅ **Secure Architecture**: Server-based execution with encrypted credentials
- ✅ **Extensible Design**: Easy to add new tools and capabilities

## Configuration

Configuration is stored in an encrypted format at:
- **macOS/Linux**: `~/.bnbchain-mcp/config.json`
- **Windows**: `%USERPROFILE%\.bnbchain-mcp\config.json`

### Environment Variables

Optional environment variables can be set:
- `BSC_RPC_URL`: Custom RPC endpoint
- `MORALIS_API_KEY`: Moralis API key for enhanced data access

## Roadmap

### Completed ✅
- [x] CLI configuration wizard
- [x] Claude Desktop integration
- [x] Token deployment and transfers
- [x] PancakeSwap V2/V3 integration
- [x] Meme token trading support
- [x] Security analysis tools

### In Progress 🚧
- [ ] Enhanced error handling and retry logic
- [ ] Multi-wallet support
- [ ] Transaction history tracking

### Planned 📋
- [ ] Token charting integration (DEXTools, CoinGecko)
- [ ] Telegram bot integration
- [ ] Advanced AI trading strategies
- [ ] Cross-chain bridge support

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow TypeScript best practices** and maintain type safety
3. **Add tests** for new features
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd bsc-mcp
npm install

# Make changes and test
npm run build
npm test

# Submit PR
```

## Security Considerations

⚠️ **Important Security Notes:**

- **Never share your private keys** or wallet passwords
- **Use strong passwords** (minimum 6 characters, but longer is recommended)
- **Keep your configuration files secure** and never commit them to version control
- **Verify token addresses** before executing transactions
- **Test with small amounts** before large transactions
- **Review security check results** before trading unknown tokens

## Troubleshooting

### Common Issues

**Issue**: MCP server not connecting
- **Solution**: Verify configuration with `bnbchain-mcp --init`

**Issue**: Transaction failures
- **Solution**: Check BNB balance for gas fees and verify RPC endpoint

**Issue**: Claude Desktop not detecting server
- **Solution**: Ensure configuration file path is correct and restart Claude Desktop

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Review existing documentation
- Check the troubleshooting section

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Powered by [Viem](https://viem.sh/) and [PancakeSwap SDK](https://github.com/pancakeswap)
- Security analysis by [GoPlus](https://gopluslabs.io/)

---

**Built for the next generation of Web3 AI agents** 🤖⚡
