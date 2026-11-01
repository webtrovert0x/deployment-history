'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { History, Shield, ExternalLink, CheckCircle2, Clock, ArrowRight, UploadCloud } from 'lucide-react';
import DeploymentHistoryArtifact from '@/contracts/DeploymentHistory.json';
import { BOTCHAIN_EXPLORER_URL } from '@/config/botchain';

interface OnChainRequestsProps {
  contractAddress: string;
  onSelectDeployer: (deployer: string, fromBlock?: number, toBlock?: number) => void;
}

export default function OnChainRequests({ contractAddress, onSelectDeployer }: OnChainRequestsProps) {
  const { address } = useAccount();
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [contractsToPublish, setContractsToPublish] = useState<string>('');

  // Read nextRequestId from contract
  const { data: nextRequestId, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DeploymentHistoryArtifact.abi,
    functionName: 'nextRequestId',
    query: {
      enabled: !!contractAddress,
    },
  });

  const totalRequests = nextRequestId ? Number(nextRequestId) - 1 : 0;

  // Write contract for publishing result (gas fee only)
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isPublishingConfirming, isSuccess: isPublished } = useWaitForTransactionReceipt({ hash });

  const handlePublishResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !contractsToPublish) return;

    const addrs = contractsToPublish
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('0x'));

    // Gas fee only
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: DeploymentHistoryArtifact.abi,
      functionName: 'publishResult',
      args: [BigInt(selectedRequestId), addrs as `0x${string}`[], 'ipfs://botchain-deployment-metadata'],
      value: BigInt(0),
    });
  };

  if (!contractAddress) {
    return (
      <div className="bg-white rounded-2xl border border-blue-100 p-6 text-sm text-slate-500 shadow-sm mb-8">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold mb-1">
          <History className="w-4 h-4 text-blue-600" />
          <span>Smart Contract Tracking (DeploymentHistory.sol)</span>
        </div>
        <p className="text-xs text-slate-500">
          The DeploymentHistory contract is not yet deployed. Once deployed via <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">npm run deploy</code>, all on-chain inspection requests and publish events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">On-Chain Inspection Ledger</h3>
            <p className="text-xs text-slate-500">
              Verified scan requests submitted to <span className="font-mono text-blue-600">{contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}</span> (Gas fee only)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {totalRequests} Requests Logged
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs text-slate-500 hover:text-blue-600 p-1 rounded transition-colors"
            title="Refresh requests"
          >
            Refresh
          </button>
        </div>
      </div>

      {totalRequests === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500">
          No on-chain scan requests have been submitted yet. Use the <strong>"Submit Inspection Tx"</strong> button above to log a new deployment scan on Botchain.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Click any request to instantly inspect the target deployer:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: Math.min(totalRequests, 6) }).map((_, idx) => {
              const reqId = totalRequests - idx;
              return (
                <div
                  key={reqId}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-blue-700 font-mono">Request #{reqId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">Logged</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Target: <span className="font-mono text-slate-800">Scan ID #{reqId}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectDeployer(contractAddress)}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
