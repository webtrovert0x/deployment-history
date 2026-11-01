'use client';

import React, { useState } from 'react';
import { Search, Wallet, SlidersHorizontal, RefreshCw, Send, Check } from 'lucide-react';
import { isAddress } from 'viem';

interface DeployerSearchProps {
  connectedAddress?: string;
  onScan: (deployer: string, fromBlock?: number, toBlock?: number) => void;
  onRequestOnChain: (deployer: string, fromBlock?: number, toBlock?: number) => void;
  isScanning: boolean;
}

export default function DeployerSearch({
  connectedAddress,
  onScan,
  onRequestOnChain,
  isScanning,
}: DeployerSearchProps) {
  const [deployer, setDeployer] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fromBlock, setFromBlock] = useState('');
  const [toBlock, setToBlock] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('2000');

  const handleUseConnected = () => {
    if (connectedAddress) {
      setDeployer(connectedAddress);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'all') {
      setFromBlock('0');
      setToBlock('');
    } else {
      setFromBlock('');
      setToBlock('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployer.trim()) return;
    if (!isAddress(deployer.trim())) {
      alert('Please enter a valid EVM address');
      return;
    }

    const fromB = fromBlock.trim() ? parseInt(fromBlock.trim(), 10) : undefined;
    const toB = toBlock.trim() ? parseInt(toBlock.trim(), 10) : undefined;

    onScan(deployer.trim(), fromB, toB);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Main Search Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-800">
              Deployer or Factory Address
            </label>
            {connectedAddress && (
              <button
                type="button"
                onClick={handleUseConnected}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Use Connected Wallet ({`${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`})</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={deployer}
              onChange={(e) => setDeployer(e.target.value)}
              placeholder="0x... (e.g. your deployer address, Gnosis Factory, or contract creator)"
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Advanced Filter Toggle & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 bg-white transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Block Range' : 'Custom Block Range'}</span>
            </button>

            {/* Quick Presets */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400">Presets:</span>
              {['500', '2000', '10000', 'all'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedPreset === preset
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {preset === 'all' ? 'All Blocks' : `Last ${preset} Blocks`}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                if (!deployer.trim() || !isAddress(deployer.trim())) {
                  alert('Please enter a valid deployer address first');
                  return;
                }
                const fromB = fromBlock.trim() ? parseInt(fromBlock.trim(), 10) : undefined;
                const toB = toBlock.trim() ? parseInt(toBlock.trim(), 10) : undefined;
                onRequestOnChain(deployer.trim(), fromB, toB);
              }}
              className="px-4 py-2.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold transition-all flex items-center space-x-1.5"
              title="Submit scan request transaction to DeploymentHistory.sol"
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>Submit Inspection Tx</span>
            </button>

            <button
              type="submit"
              disabled={isScanning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center space-x-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Retrieve History</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Block Range Inputs */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                From Block Number (optional)
              </label>
              <input
                type="number"
                value={fromBlock}
                onChange={(e) => setFromBlock(e.target.value)}
                placeholder="e.g. 0 or specific block"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                To Block Number (optional)
              </label>
              <input
                type="number"
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                placeholder="Leave blank for latest block"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

