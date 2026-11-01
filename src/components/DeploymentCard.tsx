'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Box, Terminal, Hash, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { DeploymentRecord } from '@/utils/scanner';
import { BOTCHAIN_EXPLORER_URL } from '@/config/botchain';

interface DeploymentCardProps {
  deployment: DeploymentRecord;
  index: number;
}

export default function DeploymentCard({ deployment, index }: DeploymentCardProps) {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  const copyToClipboard = (text: string, isContract: boolean) => {
    navigator.clipboard.writeText(text);
    if (isContract) {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const formatDate = (timestampSec: number) => {
    if (!timestampSec) return 'Unknown';
    const date = new Date(timestampSec * 1000);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodBadge = (method: string) => {
    if (method.includes('Direct')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Direct EOA (CREATE)
        </span>
      );
    }
    if (method.includes('Clone')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Minimal Clone (ERC-1167)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        Factory (CREATE2)
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    if (status === 'Verified' || status === 'Bytecode Active') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bytecode Active</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Inactive / Zero Code</span>
      </span>
    );
  };

  return (
    <div className="relative pl-6 pb-8 group last:pb-2">
      {/* Timeline line connector */}
      <div className="absolute left-2.5 top-3 bottom-0 w-0.5 bg-blue-100 group-last:hidden"></div>

      {/* Timeline bullet */}
      <div className="absolute left-0 top-3 w-5 h-5 rounded-full border-2 border-white bg-blue-600 shadow-md shadow-blue-500/30 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all p-5">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
            {getMethodBadge(deployment.creationMethod)}
            {getVerificationBadge(deployment.verificationStatus)}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(deployment.timestamp)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">Block #{deployment.blockNumber.toString()}</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Deployed Contract Address */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Deployed Contract Address
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-sm text-slate-900 break-all">
              <Box className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="select-all flex-1">{deployment.contractAddress}</span>
              <button
                onClick={() => copyToClipboard(deployment.contractAddress, true)}
                className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                title="Copy Address"
              >
                {copiedContract ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`${BOTCHAIN_EXPLORER_URL}address/${deployment.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                title="View on BohrScan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Deployment Transaction */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Deployment Transaction Hash
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-sm text-slate-900 break-all">
              <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="select-all flex-1 truncate">{deployment.txHash}</span>
              <button
                onClick={() => copyToClipboard(deployment.txHash, false)}
                className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                title="Copy Transaction Hash"
              >
                {copiedTx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`${BOTCHAIN_EXPLORER_URL}tx/${deployment.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                title="View on BohrScan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Info: Deployer and Factory */}
        <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-1.5 font-mono">
            <span className="text-slate-400">Deployer:</span>
            <a
              href={`${BOTCHAIN_EXPLORER_URL}address/${deployment.deployer}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {deployment.deployer}
            </a>
          </div>

          {deployment.factoryAddress && (
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-slate-400">Created via Factory:</span>
              <a
                href={`${BOTCHAIN_EXPLORER_URL}address/${deployment.factoryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {deployment.factoryAddress}
              </a>
            </div>
          )}

          {deployment.bytecodeSize > 0 && (
            <div className="text-slate-400 font-mono">
              Bytecode: {deployment.bytecodeSize.toLocaleString()} bytes
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

