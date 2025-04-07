import fs from 'fs';
import bs58 from 'bs58';

// Read the keypair file
const keypairPath = './.keys/mainnet.json';
const keypairContent = fs.readFileSync(keypairPath, 'utf-8');

// Parse the keypair content
let privateKeyBytes;
try {
  // Try parsing as JSON
  const keypairJson = JSON.parse(keypairContent);
  privateKeyBytes = new Uint8Array(keypairJson);
} catch (e) {
  // If not valid JSON, try parsing as a comma-separated list of numbers
  const numbersStr = keypairContent.replace(/[\[\]]/g, '').trim();
  const numbers = numbersStr.split(/\s*,\s*/).map(num => parseInt(num.trim(), 10));
  privateKeyBytes = new Uint8Array(numbers);
}

// Convert to Base58
const privateKeyBase58 = bs58.encode(privateKeyBytes);

console.log('Private Key (Base58):', privateKeyBase58);

// Read the .env file
const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf-8');

// Update the PRIVATE_KEY variable
const updatedEnvContent = envContent.replace(
  /PRIVATE_KEY=.*$/m,
  `PRIVATE_KEY="${privateKeyBase58}"`
);

// Write the updated .env file
fs.writeFileSync(envPath, updatedEnvContent);

console.log('Updated .env file with the new private key.');
