# Comprehensive Guide: Launching a Solana Token with PUMP-MPC and Claude Desktop

## Introduction

This guide will walk you through the complete process of setting up the PUMP-MPC server and using Claude Desktop to create and manage your own Solana token on Pump.fun. The Model Context Protocol (MCP) integration allows Claude to directly interact with the Solana blockchain through your local machine.

## Setup Process

### 1. Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) installed
- **npm** or **yarn** package manager
- **Claude Desktop** application installed
- **Solana CLI tools** (optional, for wallet generation)
- A **Helius RPC URL** (sign up for free at [dev.helius.xyz](https://dev.helius.xyz/))
- Some **SOL** for transaction fees and initial token buys

### 2. Installation

#### Automated Setup (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/PUMP-MPC.git
   cd PUMP-MPC
   ```

2. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. Follow the prompts to:
   - Install dependencies
   - Enter your Helius RPC URL
   - Set up a Solana wallet (new or existing)
   - Configure Claude Desktop integration

#### Manual Setup

If you prefer to set up manually:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create and configure your environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your preferred text editor
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Configure Claude Desktop manually (see section below)

### 3. Wallet Setup

You have two options for setting up a wallet:

#### Option A: Generate a New Wallet

If you used the setup script and chose to generate a new wallet, it will create a keypair in the `.keys` directory. Make sure to fund this wallet with SOL before creating tokens.

#### Option B: Use an Existing Wallet

To use an existing wallet:

1. Add your base58-encoded private key to the `.env` file:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

2. Run the conversion script to create the keypair file:
   ```bash
   node convert-key.js
   ```

### 4. Claude Desktop Configuration

To configure Claude Desktop to use your MCP server:

#### Automated Configuration

If you used the setup script and chose to configure Claude Desktop, it should be already set up.

#### Manual Configuration

1. Create or edit the Claude Desktop config file:
   ```bash
   mkdir -p "$HOME/Library/Application Support/Claude"
   ```

2. Edit the configuration file:
   ```bash
   nano "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
   ```

3. Add the following configuration (replace paths with your actual paths):
   ```json
   {
     "mcpServers": {
       "pumpfun": {
         "command": "node",
         "args": ["/full/path/to/PUMP-MPC/build/index.js"],
         "env": {
           "HELIUS_RPC_URL": "your_helius_rpc_url_here"
         }
       }
     }
   }
   ```

4. Save the file and restart Claude Desktop

## Creating and Managing Tokens

### 1. Creating a New Token

1. Start Claude Desktop
2. Ask Claude to create a token with a prompt like:
   ```
   Create a new token called "MyAwesomeToken" with symbol "MAT" and description "My first Solana token on Pump.fun" with an initial buy of 0.1 SOL
   ```
3. Claude will use the MCP server to create your token and provide you with:
   - Token mint address
   - Transaction signature
   - Pump.fun URL for your token
   - Your initial token balance

### 2. Getting Token Information

To get information about any token (yours or others):

```
Get information about token [mint address]
```

Claude will return details including:
- Token name and symbol
- Current price
- Market cap
- Trading volume
- Creator information

### 3. Buying Tokens

To buy more of your token or any other token:

```
Buy 0.05 SOL worth of token [mint address]
```

Claude will execute the transaction and provide details about:
- Amount of tokens received
- Transaction signature
- Updated token balance

### 4. Selling Tokens

To sell tokens:

```
Sell 1000 [token symbol] tokens
```

Or to sell all of your tokens:

```
Sell all of my [token symbol] tokens
```

### 5. Checking Balances

To check your account balances:

```
Check the balance of my default account
```

Or for a specific token:

```
Check my balance of token [mint address]
```

### 6. Managing Multiple Accounts

You can create and use multiple accounts:

```
List all my accounts
```

To use a specific account for operations, include the account name in your requests:

```
Create a new token called "SecondToken" with symbol "ST2" using my secondary account
```

## Advanced Usage

### Custom Token Images

To create a token with a custom image:

1. Place your image file in the project directory
2. When creating a token, specify the image path:
   ```
   Create a new token called "ImageToken" with symbol "IMG" with image at /path/to/image.png
   ```

### Slippage Settings

For buy/sell operations, you can specify custom slippage tolerance:

```
Buy 0.1 SOL of token [mint address] with 2% slippage tolerance
```

## Troubleshooting

### Common Issues

1. **Claude can't connect to the MCP server**
   - Ensure the server is running
   - Check Claude Desktop configuration
   - Restart Claude Desktop

2. **Transaction errors**
   - Verify your account has sufficient SOL
   - Check RPC connection
   - Try with a smaller amount or higher slippage

3. **"Invalid private key" error**
   - Ensure your private key is correctly formatted (base58)
   - Try regenerating the keypair file

### Logs and Debugging

To see detailed logs when running the server manually:

```bash
node build/index.js 2> server.log
```

## Security Best Practices

1. **Never share your private keys or seed phrases**
2. **Keep your .env and .keys directory secure**
3. **Use different accounts for different purposes**
4. **Regularly back up your keypair files**
5. **Start with small amounts when testing**

## Conclusion

You now have all the tools needed to create and manage Solana tokens on Pump.fun using Claude Desktop and the PUMP-MPC server. This powerful combination allows you to interact with the Solana blockchain through natural language, making token creation and management more accessible than ever.

Happy token launching!
