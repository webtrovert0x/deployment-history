'use client';

import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, Search, Calendar, FileCode2, Sparkles } from 'lucide-react';
import { DeploymentRecord } from '@/utils/scanner';
import DeploymentCard from './DeploymentCard';

interface DeploymentTimelineProps {
  deployments: DeploymentRecord[];
  isScanning: boolean;
  deployerAddress?: string;
}

export default function DeploymentTimeline({
  deployments,
  isScanning,
  deployerAddress,
}: DeploymentTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredDeployments = useMemo(() => {
    return deployments
      .filter((d) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchAddr = d.contractAddress.toLowerCase().includes(q);
          const matchTx = d.txHash.toLowerCase().includes(q);
          const matchDeployer = d.deployer.toLowerCase().includes(q);
          const matchFactory = d.factoryAddress ? d.factoryAddress.toLowerCase().includes(q) : false;
          if (!matchAddr && !matchTx && !matchDeployer && !matchFactory) return false;
        }

        // Method filter
        if (filterMethod !== 'all') {
          if (filterMethod === 'direct' && !d.creationMethod.includes('Direct')) return false;
          if (filterMethod === 'factory' && !d.creationMethod.includes('Factory')) return false;
          if (filterMethod === 'clone' && !d.creationMethod.includes('Clone')) return false;
        }

        // Status filter
        if (filterStatus !== 'all') {
          if (filterStatus === 'active' && d.verificationStatus !== 'Bytecode Active' && d.verificationStatus !== 'Verified') return false;
          if (filterStatus === 'inactive' && (d.verificationStatus === 'Bytecode Active' || d.verificationStatus === 'Verified')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
  }, [deployments, searchQuery, filterMethod, filterStatus, sortOrder]);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Chronological Deployment Timeline</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {filteredDeployments.length} {filteredDeployments.length === 1 ? 'Contract' : 'Contracts'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical contract creations and factory invocations ordered by block timestamp
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search inside results */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by address or tx..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white w-44 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Creation Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="direct">Direct EOA</option>
            <option value="factory">Factory (CREATE2)</option>
            <option value="clone">Clones (ERC-1167)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Bytecode Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
            title="Toggle chronological direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isScanning && deployments.length === 0 && (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
              <div className="rounded-full bg-slate-200 h-6 w-6"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isScanning && filteredDeployments.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <FileCode2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {deployerAddress ? 'No Deployments Found in Range' : 'No Deployer Inspected Yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {deployerAddress
              ? `We scanned the specified block range for ${deployerAddress} and found no contract creations. Try broadening the block range or scanning from block 0.`
              : 'Enter a wallet address or factory contract above and click "Retrieve History" to inspect all contract creations.'}
          </p>
          {!deployerAddress && (
            <div className="inline-flex items-center space-x-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connect your wallet above to inspect your own deployments automatically</span>
            </div>
          )}
        </div>
      )}

      {/* Render Timeline Cards */}
      <div className="relative mt-2">
        {filteredDeployments.map((deployment, idx) => (
          <DeploymentCard key={deployment.id} deployment={deployment} index={idx} />
        ))}
      </div>

    </div>
  );
}

