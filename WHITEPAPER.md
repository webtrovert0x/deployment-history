# DeploymentHistory: Decentralized Contract Deployment Tracking & Verification Protocol

**Version:** 1.0.0  
**Target Network:** Botchain Testnet (Chain ID: `968`, Native Token: `BOT`)  
**Contract Reference:** [`0x9f74a4e95a260d61b1e592c05bd7279a6a756a96`](https://scan.bohr.life/address/0x9f74a4e95a260d61b1e592c05bd7279a6a756a96)  
**Date:** November 2026  

---

## Executive Summary

As the Web3 and EVM ecosystems mature, developer workflows have shifted from single-contract deployments to multi-contract architectures involving factories, minimal proxies (EIP-1167), upgradeable beacons, and deterministic `CREATE2` salts. This architectural progression introduces significant operational friction: tracking deployment receipts, historical bytecode origin, transaction hashes, and creator identity across multiple iterations is fragmented and prone to loss.

**DeploymentHistory** is an on-chain ledger and developer telemetry protocol engineered specifically for **Botchain Testnet**. It bridges the gap between raw blockchain transactions and developer insight by providing:
1. An immutable, zero-surcharge on-chain inspection ledger (`DeploymentHistory.sol`).
2. Dual-mode detection for direct EOA creations (`CREATE`) and indirect factory invocations (`CREATE2` / Proxies).
3. Live bytecode verification and chronological timeline reconstruction.
4. A strict **Gas-Fee-Only** economic policy that eliminates protocol surcharges.

---

## 1. Problem Statement

### 1.1 The Multi-Deployment Discovery Gap
Modern decentralized applications (dApps) frequently deploy dozens of contracts during development and testing phases. Developers frequently face:
* **Missing Deployment Artifacts:** Loss of newly generated contract addresses between deployment scripts and frontend integration.
* **Factory Opacity:** Conventional block explorers often fail to surface contracts instantiated indirectly via factory contracts (such as Uniswap V2/V3 pair factories, Gnosis Safe proxies, or OpenZeppelin Clones) under standard address search.
* **Centralized Indexer Dependency:** Developers frequently rely on proprietary APIs (e.g., Etherscan, Alchemy) that may suffer from rate limiting, indexing latency, or absent coverage on specialized testnets like Botchain.

### 1.2 The Cost and Accessibility Barrier
Many Web3 verification platforms impose protocol fees or token paywalls to record verification metadata on-chain. For active testnet development, this creates unnecessary barriers to entry.

---

## 2. System Architecture

The DeploymentHistory protocol operates across two synchronized layers: the **On-Chain Ledger Layer** and the **Off-Chain Telemetry & Timeline Engine**.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client UI                             │
│       (Next.js + Tailwind + Reown AppKit + Wagmi v2)       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
    On-Chain Inspection Tx            RPC Detection Engine
    (Gas Fee Only: value = 0)        (https://rpc.bohr.life)
               │                               │
               ▼                               ▼
┌───────────────────────────────┐  ┌───────────────────────────┐
│     DeploymentHistory.sol     │  │  Direct & Factory Scans   │
│  - requestDeploymentScan()    │  │  - Direct EOA (CREATE)    │
│  - getRequest()               │  │  - Factory (CREATE2)      │
│  - publishResult()            │  │  - EIP-1167 Clones        │
│  - Mappings & Events          │  │  - Bytecode Verification  │
└───────────────────────────────┘  └───────────────────────────┘
```

---

## 3. On-Chain Ledger Specification (`DeploymentHistory.sol`)

The on-chain contract serves as an immutable registry for inspection requests and published verification payloads.

### 3.1 Gas-Fee-Only Invariant
Every state-modifying function in `DeploymentHistory.sol` is non-payable:
$$\forall \text{ tx} \in \text{DeploymentHistory}, \quad \text{msg.value} = 0$$

The caller pays only the standard EVM execution gas fees required by Botchain validators. No protocol rent, platform fees, or token taxes are levied.

### 3.2 State Structure
```solidity
struct ScanRequest {
    uint256 requestId;
    address requester;
    address deployer;
    uint256 fromBlock;
    uint256 toBlock;
    uint256 requestedAt;
    bool completed;
    address[] deployedContracts;
    string resultCID;
}
```

### 3.3 Protocol Functions
* **`requestDeploymentScan(address deployer, uint256 fromBlock, uint256 toBlock)`**:
  Logs an inspection request for a specified deployer and block window. Emits `DeploymentScanRequested`.
* **`getRequest(uint256 requestId)`**:
  View function returning the full `ScanRequest` record.
* **`publishResult(uint256 requestId, address[] calldata deployedContracts, string calldata resultCID)`**:
  Allows indexers or requesters to publish discovered contract addresses and optional IPFS metadata (CIDs) on-chain.
* **`getDeployerRequestIds(address deployer)` / `getUserRequestIds(address user)`**:
  Indexes all past inspection requests submitted by a user or targeted toward a specific deployer.

---

## 4. Contract Detection & Classification Engine

The telemetry engine implements heuristic classification to distinguish between different creation methodologies:

### 4.1 Direct EOA Deployment (EVM `CREATE`)
Direct contract creations are identified where:
$$\text{tx.from} = \text{deployer} \quad \land \quad (\text{tx.to} = \text{null} \lor \text{tx.to} = 0x0)$$
The created contract address is derived deterministically from the deployer's address and nonce:
$$\text{ContractAddress} = \text{keccak256}(\text{rlp.encode}([\text{sender}, \text{nonce}]))[12:]$$
The resulting address is captured from `receipt.contractAddress`.

### 4.2 Factory-Based Deployments (`CREATE2` & Proxy Pattern)
For transactions directed to existing smart contracts (`tx.to} \neq \text{null}$`), the engine evaluates receipt execution logs against standard factory event signatures:
* **Uniswap / DEX Factory:** `PairCreated(address,address,address,uint256)`
* **Gnosis / Safe Proxy Factory:** `ProxyCreation(address,address)`
* **Minimal Clone Factory (EIP-1167):** `CloneCreated(address,address)`
* **Standard Factory Pattern:** `ContractCreated(address,address)` / `Deployed(address,address)`

### 4.3 Bytecode Verification & Active State
For each discovered address, an active code query (`eth_getCode`) verifies the contract state:
$$\text{Status} = \begin{cases} 
\text{Bytecode Active (Live)}, & |\text{code}| > 2 \\
\text{Inactive / Zero Code}, & |\text{code}| \le 2 
\end{cases}$$

---

## 5. Network Parameters (Botchain Testnet)

| Parameter | Specification |
|---|---|
| **Network Name** | Botchain Testnet (Bohr) |
| **Chain ID** | `968` |
| **Native Token** | `BOT` (18 Decimals) |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Block Explorer** | `https://scan.bohr.life/` |
| **Official Contract** | `0x9f74a4e95a260d61b1e592c05bd7279a6a756a96` |
| **Deployment Tx Hash** | `0x0a4799933deb7dbf1b99ab46d6606bdbe1d2cdde7ac05c9f203f26a43aa294af` |

---

## 6. Security, Privacy & Credential Isolation

1. **Private Credential Protection:**
   The `REOWN_ID` and deployment `PRIVATE_KEY` are isolated within server-side environments. No private keys or un-prefixed client identifiers are bundled into static browser distributions.
2. **Deterministic Immutability:**
   Once deployed, `DeploymentHistory.sol` has no owner self-destruct functions, upgrade proxies, or backdoors.
3. **Open Standards:**
   Built on Wagmi v2, Viem, and Reown AppKit adhering to EIP-1193, EIP-155, and EIP-1167 standards.

---

## 7. Roadmap & Future Expansion

* **Phase 1 (Complete):** Core Solidity contract, zero-surcharge inspection request mapping, direct/factory detector, and Next.js white-and-blue interface on Botchain Testnet.
* **Phase 2:** Automated IPFS artifact publishing for verified ABI schemas and NatSpec documentation.
* **Phase 3:** Autonomous indexing relayer network for zero-latency event listening and decentralized verification proofs.

---

## 8. License

The DeploymentHistory protocol and smart contracts are released under the **MIT License**.

