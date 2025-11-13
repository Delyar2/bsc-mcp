

---

## 📦 BNBChain MCP – Binance Smart Chain Tool Server (MCP + CLI Ready)

> A comprehensive blockchain tool server for BNB, BEP-20 tokens, smart contract deployment and interaction built on BNB Smart Chain (BSC) and compatible with other EVM networks.

---

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)  
- **Web3 Libraries**: Viem 2.23.11, PancakeSwap SDK 5.8.8  
- **CLI/Backend**: TypeScript, Node.js (ESM)  
- **Protocol**: Model Context Protocol (MCP) SDK 1.4.0  
- **Security**: AES encryption with bcrypt for private key protection
- **Token Security**: GoPlus SDK for security checks
- **Data Provider**: Moralis SDK 2.27.2 for blockchain data

---

## Supported Networks

- **BNB Smart Chain Mainnet** (Chain ID: 56)  
  - RPC: https://bsc-dataseed.binance.org (default)
  - Custom RPC supported via environment configuration

---

## Contract Addresses

| Contract Type | Address | Description |
|--------------|---------|-------------|
| Four.Meme Try Buy | 0xF251F83e40a78868FcfA3FA4599Dad6494E46034 | Four.Meme token purchase contract |
| Four.Meme Buy/Sell AMAP | 0x5c952063c7fc8610FFDB798152D69F0B9550762b | Four.Meme auto-market-adjusted pricing |
| Four.Meme Create Token | 0x5c952063c7fc8610FFDB798152D69F0B9550762b | Four.Meme token factory |
| PancakeSwap Router V2 | Integrated via SDK | DEX routing and swaps |
| PancakeSwap V3 Pools | Accessed via SDK | Liquidity pools management |

---

## Features

- **Low-cost BNB & BEP-20 transfers** - Optimized for BSC's low gas fees
- **PancakeSwap V2/V3 integration** - Automated swaps, liquidity management, and position tracking
- **Four.Meme platform support** - Create, buy, and sell meme tokens directly
- **Security-first architecture** - AES-256 encrypted private keys with bcrypt password protection
- **Token security analysis** - Built-in GoPlus security checks for token verification
- **Gas-efficient operations** - Smart routing for optimal gas usage on BSC
- **AI-ready MCP protocol** - Seamless integration with Claude Desktop and AI agents
- **Real-time wallet monitoring** - Track balances and positions across multiple tokens

---

## 🛠 Installation & Setup

### 1. Install

```bash
npm install -g bnbchain-mcp
```

### 2. Run the CLI Setup Wizard

```bash
bnbchain-mcp --init
```

You’ll be prompted to enter:

- ✅ **BSC Wallet Private Key** *(required)* 
- ✅ **Wallet Password** *(required, must be 6 characters)*
- ✅ **Custom RPC URL** *(optional, defaults to:* `https://bsc-dataseed.binance.org` *)

---

## 🧠 Claude Desktop Integration

After CLI setup, the tool can **auto-configure itself into Claude Desktop**.

📍 File modified:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Claude will detect and run this MCP server with your selected tools.

---

## 🔨 Supported MCP Tools

| Tool Name             | Description                              |
|----------------------|------------------------------------------|
| `transferNativeToken` | Send BNB to a wallet                     |
| `transferBEP20Token`  | Transfer BEP-20 token via symbol/address |
| `pancakeSwap`         | Swap tokens via PancakeSwap              |
| `createFourMeme`      | Create meme token on Four.Meme           |
| `createBEP20Token`    | Deploy a BEP-20 contract                 |
| `getBalance`          | Get token + native balance               |
| `callContractFunction`| Custom contract calls via ABI            |
| `getWalletInfo`       | Get wallet info for an address           |
| `securityCheck`       | Check token security of BSC tokens       |
| `pancakeAddLiquidity` | Add liquidity to PancakeSwap             |
| `pancakeMyPosition`   | View your PancakeSwap positions          |
| `pancakeRemovePosition`| Remove liquidity from PancakeSwap        |
| `sellMemeToken`        | Sell meme token on Four.Meme             |
| ...and more coming soon 🔧 |

---

## 🧪 Development Workflow

### Compile TypeScript:
```bash
npm run build
```

### Start MCP Server:
```bash
npm start
# or
node build/index.js
```

### Re-configure:
```bash
bnbchain-mcp --init
```

---

## 📘 Model Context Protocol (MCP)

This project is built on **Model Context Protocol** – a standard to help agents and models interact with structured tool APIs.

**MCP Benefits**:
- ✅ Structured input/output
- ✅ Claude + OpenAI compatible
- ✅ Secure + serverless-ready

---

## ✅ Roadmap

- [x] CLI Configuration Wizard
- [x] Claude Desktop Integration
- [x] Token Deploy + Transfer
- [ ] Token charting tools (DEXTools, Gecko)
- [ ] Telegram auto-trading agent
- [ ] AI assistant with BSC on-chain brain

---

## 🤝 Contributing

Feel free to fork, PR, or raise issues.
We're building **tool-first, AI-ready infrastructure** for the next wave of Web3 agents. Join us!

---

## 🛡️ License

MIT — Use freely, contribute openly.

---
