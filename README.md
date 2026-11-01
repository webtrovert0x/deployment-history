# DeploymentHistory - Botchain Testnet Contract Tracker

A smart contract deployment history tracker and verification inspector built for **Botchain Testnet** (Chain ID: `968`, Native Token: `BOT`, RPC: `https://rpc.bohr.life`, Explorer: `https://scan.bohr.life/`).

---

## 🚀 Key Features

1. **Direct & Factory Deployment Detection**:
   - Identifies contract creation transactions where `tx.to == null` (direct `CREATE`).
   - Detects factory-based deployments (`CREATE2`, Uniswap-style factories, Gnosis Safe Proxies, OpenZeppelin Clones `ERC-1167`).
2. **Chronological Visual Timeline**:
   - Organizes deployments chronologically with block number, readable timestamps, contract address, tx hash, deployer, and factory address.
   - Live bytecode inspection verifying whether the contract is active on-chain.
3. **On-Chain Inspection Ledger (`DeploymentHistory.sol`)**:
   - `requestDeploymentScan(address deployer, uint256 fromBlock, uint256 toBlock)`: Submits an on-chain inspection request.
   - `getRequest(uint256 requestId)`: Fetches stored request details.
   - `publishResult(...)`: Stores discovered contract addresses.
   - **Gas Fee Only**: All contract interactions strictly require 0 BOT protocol fee (`value: 0`). You only pay standard EVM network gas fees to Botchain validators.
4. **Clean White & Blue Interface**:
   - Crisp, modern white and blue styling with responsive design, quick filters, copy-to-clipboard, and direct links to BohrScan explorer.
5. **Reown AppKit Wallet Integration**:
   - Configured with `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi@2.x`, and `viem`.
   - Uses `REOWN_ID` from `.env` directly without public client prefix leaks.

---

## 🛠️ Environment Setup (`.env`)

Edit your `.env` file with your credentials:

```env
# Your private key for deploying DeploymentHistory.sol
PRIVATE_KEY=your_private_key_here

# Reown AppKit Project ID for wallet connection (kept private as REOWN_ID)
REOWN_ID=your_reown_project_id_here

# Network Settings
BOTCHAIN_CHAIN_ID=968
BOTCHAIN_RPC_URL=https://rpc.bohr.life
BOTCHAIN_EXPLORER_URL=https://scan.bohr.life/

# Deployed Contract Address (automatically updated by deploy script)
DEPLOYED_CONTRACT_ADDRESS=
```

---

## 📦 Smart Contract Compilation & Deployment

1. **Compile Contract**:
   ```bash
   npm run compile
   ```

2. **Deploy to Botchain Testnet (Gas Fee Only)**:
   ```bash
   npm run deploy
   ```
   *The deployment script will automatically update `.env` and `src/contracts/deployedAddress.json` with the deployed contract address.*

---

## 💻 Running the Web Application

1. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

