// src/cli/help.ts
export function printHelp(): void {
    console.log(`
  📦 BNB Chain MCP CLI
  
  Usage:
    bnbchain-mcp [options]
  
  Options:
    -i, --init      Initialize configuration
    -v, --version   Show CLI version
    -h, --help      Show help info
  
  Examples:
    bnbchain-mcp --init
    bnbchain-mcp --version
    bnbchain-mcp
    `);
}