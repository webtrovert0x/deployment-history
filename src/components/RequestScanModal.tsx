'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Shield, X, Send, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import DeploymentHistoryArtifact from '@/contracts/DeploymentHistory.json';
import { BOTCHAIN_EXPLORER_URL } from '@/config/botchain';

interface RequestScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDeployer: string;
  defaultFromBlock?: string;
  defaultToBlock?: string;
  contractAddress: string;
  onSuccess?: () => void;
}

export default function RequestScanModal({
  isOpen,
  onClose,
  defaultDeployer,
  defaultFromBlock = '0',
  defaultToBlock = '0',
  contractAddress,
  onSuccess,
}: RequestScanModalProps) {
  const { isConnected } = useAccount();
  const [deployer, setDeployer] = useState(defaultDeployer);
  const [fromBlock, setFromBlock] = useState(defaultFromBlock);
  const [toBlock, setToBlock] = useState(defaultToBlock);

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAddress || contractAddress === '') {
      alert('DeploymentHistory contract is not deployed yet. Please deploy the contract first or set DEPLOYED_CONTRACT_ADDRESS in .env');
      return;
    }

    const fromB = fromBlock.trim() ? BigInt(fromBlock.trim()) : BigInt(0);
    const toB = toBlock.trim() ? BigInt(toBlock.trim()) : BigInt(0);

    // IMPORTANT: Gas fee only! value is strictly 0.
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: DeploymentHistoryArtifact.abi,
      functionName: 'requestDeploymentScan',
      args: [deployer as `0x${string}`, fromB, toB],
      value: BigInt(0), // Zero protocol fee - strictly gas fee only
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Submit On-Chain Scan Request</h3>
            <p className="text-xs text-slate-500">Records inspection request on DeploymentHistory.sol</p>
          </div>
        </div>

        {/* Notice on Gas Fee Only */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-800 flex items-start space-x-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Gas Fee Only Policy:</span> This transaction requires <strong>0 BOT</strong> protocol fee. You only pay standard EVM network gas fees to Botchain validators.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Deployer / Factory Address
            </label>
            <input
              type="text"
              value={deployer}
              onChange={(e) => setDeployer(e.target.value)}
              placeholder="0x..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                From Block (0 for genesis)
              </label>
              <input
                type="number"
                value={fromBlock}
                onChange={(e) => setFromBlock(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                To Block (0 for latest)
              </label>
              <input
                type="number"
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Contract Address Status */}
          <div className="text-xs text-slate-500 pt-1">
            Contract: <span className="font-mono text-slate-700">{contractAddress ? `${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}` : 'Not configured'}</span>
          </div>

          {/* Error Message */}
          {writeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="break-all">{writeError.message}</div>
            </div>
          )}

          {/* Success State */}
          {isConfirmed && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span>Inspection Request Confirmed on Botchain!</span>
              </div>
              {hash && (
                <div className="flex items-center space-x-1 pt-1">
                  <span>Tx:</span>
                  <a
                    href={`${BOTCHAIN_EXPLORER_URL}tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>{`${hash.slice(0, 10)}...${hash.slice(-8)}`}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming || !isConnected}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all flex items-center space-x-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming in Wallet...</span>
                </>
              ) : isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mining on Botchain...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request (Gas Only)</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
