import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

dotenv.config();

const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'],
    },
    public: {
      http: [process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: { name: 'BohrScan', url: process.env.BOTCHAIN_EXPLORER_URL || 'https://scan.bohr.life/' },
  },
});

async function main() {
  const privateKeyRaw = process.env.PRIVATE_KEY;
  if (!privateKeyRaw || privateKeyRaw.trim() === '') {
    console.error('❌ Error: PRIVATE_KEY is not set in .env.');
    console.error('Please add your private key to .env file and re-run: npm run deploy');
    process.exit(1);
  }

  const formattedKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`;
  const account = privateKeyToAccount(formattedKey);

  console.log('Deployer address:', account.address);
  console.log('Connecting to Botchain Testnet (Chain ID: 968, RPC: https://rpc.bohr.life)...');

  const publicClient = createPublicClient({
    chain: botchainTestnet,
    transport: http(process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'),
  });

  const walletClient = createWalletClient({
    account,
    chain: botchainTestnet,
    transport: http(process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer BOT Balance: ${Number(balance) / 1e18} BOT`);

  const artifactPath = path.resolve('src', 'contracts', 'DeploymentHistory.json');
  if (!fs.existsSync(artifactPath)) {
    console.log('Artifact not found. Running compilation first...');
    const { execSync } = await import('child_process');
    execSync('node scripts/compile.mjs', { stdio: 'inherit' });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  console.log('Deploying DeploymentHistory.sol (gas fee only, no extra protocol fees)...');

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [],
  });

  console.log('Deployment transaction hash:', hash);
  console.log('Waiting for confirmation on Botchain...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const deployedAddress = receipt.contractAddress;

  console.log('🎉 DeploymentHistory successfully deployed at:', deployedAddress);
  console.log(`Explorer link: ${botchainTestnet.blockExplorers.default.url}tx/${hash}`);

  // Update .env
  const envPath = path.resolve('.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('DEPLOYED_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/DEPLOYED_CONTRACT_ADDRESS=.*/, `DEPLOYED_CONTRACT_ADDRESS=${deployedAddress}`);
  } else {
    envContent += `\nDEPLOYED_CONTRACT_ADDRESS=${deployedAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent);

  // Write deployedAddress.json
  const deployedInfo = {
    address: deployedAddress,
    chainId: 968,
    txHash: hash,
    deployer: account.address,
    blockNumber: receipt.blockNumber.toString(),
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync('src/contracts/deployedAddress.json', JSON.stringify(deployedInfo, null, 2));

  console.log('Updated .env and src/contracts/deployedAddress.json with deployed contract address.');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});

