#!/bin/bash

# Setup script for pumpfun-mcp-server
echo "🚀 Setting up pumpfun-mcp-server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm before continuing."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file
echo "🔑 Setting up environment variables..."

# Backup existing .env if it exists
if [ -f ".env" ]; then
    echo "📝 Backing up existing .env file to .env.backup"
    cp .env .env.backup
fi

# Prompt for Helius RPC URL
echo "Enter your Helius RPC URL (get one from https://dev.helius.xyz/):"
read HELIUS_RPC_URL

# Create new .env file with just the RPC URL
echo "HELIUS_RPC_URL=$HELIUS_RPC_URL" > .env

# Ask if user wants to set up a wallet
echo "Do you want to set up a wallet? (y/n)"
read SETUP_WALLET

if [ "$SETUP_WALLET" = "y" ] || [ "$SETUP_WALLET" = "Y" ]; then
    echo "Choose an option:"
    echo "1. Generate a new wallet"
    echo "2. Use an existing wallet (you'll need your private key)"
    read WALLET_OPTION
    
    if [ "$WALLET_OPTION" = "1" ]; then
        echo "⚠️ This feature requires the Solana CLI tools to be installed."
        echo "If you don't have them, please visit https://docs.solana.com/cli/install-solana-cli-tools"
        echo "Do you have Solana CLI tools installed? (y/n)"
        read HAS_SOLANA_CLI
        
        if [ "$HAS_SOLANA_CLI" = "y" ] || [ "$HAS_SOLANA_CLI" = "Y" ]; then
            echo "🔑 Generating a new Solana wallet..."
            mkdir -p .keys
            solana-keygen new --no-passphrase -o .keys/temp_keypair.json
            PRIVATE_KEY=$(solana-keygen pubkey -k .keys/temp_keypair.json)
            echo "Your new wallet address: $PRIVATE_KEY"
            echo "⚠️ IMPORTANT: Fund this wallet with SOL before using it with pumpfun-mcp"
        else
            echo "Please install Solana CLI tools and run this script again to generate a wallet."
        fi
    elif [ "$WALLET_OPTION" = "2" ]; then
        echo "Enter your base58-encoded private key:"
        read -s PRIVATE_KEY
        echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env
        echo "🔑 Converting private key to keypair format..."
        node convert-key.js
        echo "✅ Wallet setup complete!"
    fi
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Setup Claude Desktop configuration
echo "Do you want to set up Claude Desktop configuration? (y/n)"
read SETUP_CLAUDE

if [ "$SETUP_CLAUDE" = "y" ] || [ "$SETUP_CLAUDE" = "Y" ]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    
    # Create directory if it doesn't exist
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # Get the absolute path to the build/index.js file
    CURRENT_DIR=$(pwd)
    INDEX_PATH="$CURRENT_DIR/build/index.js"
    
    # Check if config file exists
    if [ -f "$CLAUDE_CONFIG_FILE" ]; then
        echo "📝 Existing Claude config found. Creating backup at ${CLAUDE_CONFIG_FILE}.backup"
        cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup"
        
        # Read existing config
        EXISTING_CONFIG=$(cat "$CLAUDE_CONFIG_FILE")
        
        # Check if it's valid JSON
        if jq -e . >/dev/null 2>&1 <<< "$EXISTING_CONFIG"; then
            # Update existing config
            jq --arg path "$INDEX_PATH" --arg rpc "$HELIUS_RPC_URL" \
            '.mcpServers.pumpfun = {"command": "node", "args": [$path], "env": {"HELIUS_RPC_URL": $rpc}}' \
            "$CLAUDE_CONFIG_FILE" > "${CLAUDE_CONFIG_FILE}.tmp" && mv "${CLAUDE_CONFIG_FILE}.tmp" "$CLAUDE_CONFIG_FILE"
        else
            # Invalid JSON, create new config
            echo "{\n  \"mcpServers\": {\n    \"pumpfun\": {\n      \"command\": \"node\",\n      \"args\": [\"$INDEX_PATH\"],\n      \"env\": {\n        \"HELIUS_RPC_URL\": \"$HELIUS_RPC_URL\"\n      }\n    }\n  }\n}" > "$CLAUDE_CONFIG_FILE"
        fi
    else
        # Create new config file
        echo "{\n  \"mcpServers\": {\n    \"pumpfun\": {\n      \"command\": \"node\",\n      \"args\": [\"$INDEX_PATH\"],\n      \"env\": {\n        \"HELIUS_RPC_URL\": \"$HELIUS_RPC_URL\"\n      }\n    }\n  }\n}" > "$CLAUDE_CONFIG_FILE"
    fi
    
    echo "✅ Claude Desktop configuration updated!"
    echo "⚠️ If Claude Desktop is running, please restart it for changes to take effect."
fi

echo "✅ Setup complete! You can now run the server with: node build/index.js"
echo "ℹ️ To use with Claude, make sure Claude Desktop is configured and running."

# Provide information about making the server accessible over the internet
echo ""
echo "📡 To make this server accessible over the internet, you can use:"
echo "1. ngrok - Easy tunneling solution: https://ngrok.com"
echo "   Run: npx ngrok http <PORT> (replace <PORT> with the port your server runs on)"
echo "2. Cloudflare Tunnel - Secure tunneling: https://www.cloudflare.com/products/tunnel/"
echo "3. Deploy to a cloud provider like AWS, Google Cloud, or DigitalOcean"
echo ""
echo "For more information, check the README.md file."
