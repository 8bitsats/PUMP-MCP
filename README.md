# PUMP-MPC: Solana Token Creator & Manager

A Model Context Protocol (MCP) server for creating and managing Solana tokens on Pump.fun, integrated with Claude Desktop.

## Overview

This template provides a complete solution for creating and managing Solana tokens on the Pump.fun platform using Claude AI. It leverages the Model Context Protocol (MCP) to enable Claude Desktop to interact directly with the Solana blockchain through a local server.

## Features

- **Create Tokens**: Launch your own Solana tokens on Pump.fun with custom name, symbol, and description
- **Buy/Sell Tokens**: Execute trades directly through Claude
- **Token Info**: Retrieve detailed information about any Pump.fun token
- **Account Management**: Create and manage multiple Solana accounts
- **Balance Checking**: View SOL and token balances for your accounts
- **Claude Desktop Integration**: Seamless integration with Claude AI through MCP

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana CLI tools (optional, for wallet generation)
- Claude Desktop (with MCP support)
- A Helius RPC URL (free tier available at [dev.helius.xyz](https://dev.helius.xyz/))
- SOL for transaction fees and initial token buys

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/PUMP-MPC.git
   cd PUMP-MPC
   ```

2. Run the setup script:
   ```
   chmod +x setup.sh
   ./setup.sh
   ```

   The setup script will:
   - Install dependencies
   - Prompt for your Helius RPC URL
   - Offer to set up a Solana wallet
   - Build the project
   - Configure Claude Desktop integration

3. Alternatively, perform manual setup:
   ```
   npm install
   cp .env.example .env
   # Edit .env with your Helius RPC URL
   npm run build
   ```

## Configuration

Edit the `.env` file to configure:

```
# Required: Solana RPC URL from Helius
HELIUS_RPC_URL=https://your-helius-rpc-url

# Optional: Custom path for storing keypairs
KEYS_FOLDER=

# Optional: Private key for the account (if you have an existing wallet)
PRIVATE_KEY=

# Optional: X.AI API key for additional features
XAI_API_KEY=

# Optional: Solana Tracker API Key for market data
SOLANA_TRACKER_API_KEY=
```

## Using with Claude Desktop

1. Start Claude Desktop
2. Claude will automatically detect the MCP server if configured during setup
3. You can now ask Claude to perform token operations

### Example Prompts for Claude

- "Create a new token called 'MyToken' with symbol 'MTK' and description 'My first token' with an initial buy of 0.1 SOL"
- "Get information about token [mint address]"
- "Buy 0.05 SOL worth of token [mint address]"
- "Sell all of my [token name] tokens"
- "Check my account balance"
- "List all my accounts"

## Running the Server Manually

If you need to start the server manually:

```
node build/index.js
```

## Available Commands

The MCP server exposes the following tools to Claude:

- `get-token-info`: Get information about a Pump.fun token
- `create-token`: Create a new Pump.fun token
- `buy-token`: Buy a Pump.fun token
- `sell-token`: Sell a Pump.fun token
- `list-accounts`: List all accounts in the keys folder
- `get-account-balance`: Get the SOL and token balances for an account

## Security Notes

- Private keys are stored locally in the `.keys` directory
- Never share your private keys or seed phrases
- The server operates locally and doesn't expose your keys to the internet
- Always verify transaction details before confirming

## Troubleshooting

- **Claude can't connect to the server**: Ensure the server is running and properly configured in Claude Desktop
- **Transaction errors**: Check that your account has sufficient SOL for the transaction
- **RPC errors**: Verify your Helius RPC URL is correct and your account has not exceeded the free tier limits

## Development

To modify or extend this template:

1. Make changes to the TypeScript files in the `src` directory
2. Rebuild the project with `npm run build`
3. Restart the server

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- [Pump.fun](https://pump.fun) - The Solana token platform
- [Model Context Protocol](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp) - For enabling AI-blockchain integration
- [Helius](https://helius.xyz) - For providing Solana RPC services
