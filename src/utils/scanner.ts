import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { botchainTestnet } from '@/config/botchain';

export interface DeploymentRecord {
  id: string;
  contractAddress: string;
  txHash: string;
  deployer: string;
  blockNumber: bigint;
  timestamp: number;
  creationMethod: 'Direct EOA (CREATE)' | 'Factory (CREATE2)' | 'Proxy / Clone (ERC-1167)';
  factoryAddress?: string;
  verificationStatus: 'Bytecode Active' | 'Verified' | 'Inactive / EOA';
  bytecodeSize: number;
  gasUsed?: bigint;
}

// Well-known factory event topics (keccak256 hashes of standard creation events)
const FACTORY_EVENT_SIGNATURES: Record<string, string> = {
  // PairCreated(address,address,address,uint256)
  '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9': 'Uniswap / DEX Factory',
  // ProxyCreation(address,address)
  '0x4f51faf6c4561ff04b0c0441302030c2550be88104f4b43ba0be55d9773449b0': 'Gnosis / Safe Proxy Factory',
  // ContractCreated(address,address)
  '0x9c48b26f56193ee0997fa44cc79eb34dfcb9a1c6e1c0d576a5927520e5058cb3': 'Contract Created Event',
  // Deployed(address,address)
  '0x2c64b63897b5e40e53a3ecb99676579f1883b16e108e4bbad87b927a4d538e12': 'Generic Deployed Event',
  // CloneCreated(address,address)
  '0x1c67a3be34b3558fe8dd233c41ef73282b06e885d568df56be7b61f85585b46e': 'Minimal Clone (ERC-1167)',
};

export async function createClient(rpcUrl?: string) {
  return createPublicClient({
    chain: botchainTestnet,
    transport: http(rpcUrl || 'https://rpc.bohr.life'),
  });
}

/**
 * Scan a block range for contract deployments made directly by an address or via factories
 */
export async function scanDeployments(
  deployerAddress: string,
  fromBlockInput?: number | bigint,
  toBlockInput?: number | bigint,
  rpcUrl?: string,
  onProgress?: (scanned: number, total: number) => void
): Promise<DeploymentRecord[]> {
  const client = await createClient(rpcUrl);

  const formattedDeployer = getAddress(deployerAddress);
  const latestBlockNumber = await client.getBlockNumber();

  const toBlock = toBlockInput ? BigInt(toBlockInput) : latestBlockNumber;
  const fromBlock = fromBlockInput && BigInt(fromBlockInput) > 0n
    ? BigInt(fromBlockInput)
    : (toBlock > 2000n ? toBlock - 2000n : 0n);

  const deployments: DeploymentRecord[] = [];
  const totalBlocks = Number(toBlock - fromBlock) + 1;
  let blocksProcessed = 0;

  // Process in reasonable chunks to prevent RPC rate-limits
  const chunkSize = 200n;
  for (let currentStart = fromBlock; currentStart <= toBlock; currentStart += chunkSize) {
    const currentEnd = (currentStart + chunkSize - 1n > toBlock) ? toBlock : currentStart + chunkSize - 1n;

    try {
      // Fetch blocks in batch or sequentially
      for (let blockNum = currentEnd; blockNum >= currentStart; blockNum--) {
        const block = await client.getBlock({
          blockNumber: blockNum,
          includeTransactions: true,
        });

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            // Check if tx is sent by deployer or is relevant
            const isSentByDeployer = tx.from && getAddress(tx.from) === formattedDeployer;
            const isDirectContractCreation = isSentByDeployer && (!tx.to || tx.to === '0x0000000000000000000000000000000000000000');

            if (isDirectContractCreation) {
              const receipt = await client.getTransactionReceipt({ hash: tx.hash });
              if (receipt && receipt.contractAddress) {
                const bytecode = await client.getCode({ address: receipt.contractAddress });
                const codeSize = bytecode && bytecode !== '0x' ? (bytecode.length - 2) / 2 : 0;

                deployments.push({
                  id: `${tx.hash}-${receipt.contractAddress}`,
                  contractAddress: getAddress(receipt.contractAddress),
                  txHash: tx.hash,
                  deployer: formattedDeployer,
                  blockNumber: block.number,
                  timestamp: Number(block.timestamp),
                  creationMethod: 'Direct EOA (CREATE)',
                  verificationStatus: codeSize > 0 ? 'Bytecode Active' : 'Inactive / EOA',
                  bytecodeSize: codeSize,
                  gasUsed: receipt.gasUsed,
                });
              }
            } else if (isSentByDeployer && tx.to) {
              // Check if it triggered factory deployment
              const receipt = await client.getTransactionReceipt({ hash: tx.hash });
              if (receipt && receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                  const topic0 = log.topics[0]?.toLowerCase();
                  if (topic0 && FACTORY_EVENT_SIGNATURES[topic0]) {
                    // Extract created contract address from topics or data
                    let candidateAddr: string | undefined;
                    if (log.topics[1] && log.topics[1].length === 66) {
                      candidateAddr = '0x' + log.topics[1].slice(26);
                    } else if (log.topics[2] && log.topics[2].length === 66) {
                      candidateAddr = '0x' + log.topics[2].slice(26);
                    } else if (log.data && log.data.length >= 66) {
                      candidateAddr = '0x' + log.data.slice(26, 66);
                    }

                    if (candidateAddr && isAddress(candidateAddr)) {
                      const contractAddr = getAddress(candidateAddr);
                      const bytecode = await client.getCode({ address: contractAddr });
                      const codeSize = bytecode && bytecode !== '0x' ? (bytecode.length - 2) / 2 : 0;

                      deployments.push({
                        id: `${tx.hash}-${contractAddr}`,
                        contractAddress: contractAddr,
                        txHash: tx.hash,
                        deployer: formattedDeployer,
                        factoryAddress: getAddress(tx.to),
                        blockNumber: block.number,
                        timestamp: Number(block.timestamp),
                        creationMethod: topic0.includes('1c67a3b') ? 'Proxy / Clone (ERC-1167)' : 'Factory (CREATE2)',
                        verificationStatus: codeSize > 0 ? 'Bytecode Active' : 'Inactive / EOA',
                        bytecodeSize: codeSize,
                        gasUsed: receipt.gasUsed,
                      });
                    }
                  }
                }
              }
            }
          }
        }
        blocksProcessed++;
        if (onProgress) {
          onProgress(blocksProcessed, totalBlocks);
        }
      }
    } catch (chunkErr) {
      console.warn(`Chunk scanning error at ${currentStart}-${currentEnd}:`, chunkErr);
    }
  }

  // Sort chronologically descending (newest first by default)
  return deployments.sort((a, b) => b.timestamp - a.timestamp);
}

