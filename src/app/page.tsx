'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import DeployerSearch from '@/components/DeployerSearch';
import TimelineStats from '@/components/TimelineStats';
import DeploymentTimeline from '@/components/DeploymentTimeline';
import RequestScanModal from '@/components/RequestScanModal';
import OnChainRequests from '@/components/OnChainRequests';
import { DeploymentRecord, scanDeployments } from '@/utils/scanner';
import { Shield, Sparkles, Layers, History, Info } from 'lucide-react';

export default function HomePage() {
  const { address } = useAccount();

  const [deployerAddress, setDeployerAddress] = useState<string>('');
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number } | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDeployer, setModalDeployer] = useState('');
  const [modalFromBlock, setModalFromBlock] = useState('0');
  const [modalToBlock, setModalToBlock] = useState('0');

  // Load contract address from server config
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.contractAddress) {
          setContractAddress(data.contractAddress);
        }
      })
      .catch((err) => console.warn('Failed to load contract config:', err));
  }, []);

  const handleScan = async (deployer: string, fromBlock?: number, toBlock?: number) => {
    setDeployerAddress(deployer);
    setIsScanning(true);
    setScanProgress(null);

    try {
      // First attempt client-side direct RPC scan
      const records = await scanDeployments(
        deployer,
        fromBlock,
        toBlock,
        'https://rpc.bohr.life',
        (scanned, total) => {
          setScanProgress({ scanned, total });
        }
      );
      setDeployments(records);
    } catch (clientErr) {
      console.warn('Client scan failed, falling back to server API scan:', clientErr);
      try {
        const queryParams = new URLSearchParams({
          deployer,
          ...(fromBlock !== undefined ? { fromBlock: fromBlock.toString() } : {}),
          ...(toBlock !== undefined ? { toBlock: toBlock.toString() } : {}),
        });
        const res = await fetch(`/api/scan?${queryParams.toString()}`);
        const data = await res.json();
        if (data.deployments) {
          setDeployments(
            data.deployments.map((d: any) => ({
              ...d,
              blockNumber: BigInt(d.blockNumber),
              gasUsed: d.gasUsed ? BigInt(d.gasUsed) : undefined,
            }))
          );
        }
      } catch (apiErr) {
        console.error('API Scan failed:', apiErr);
        alert('Failed to scan deployments. Please verify your network connection to Botchain Testnet.');
      }
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const handleOpenModal = (deployer: string, fromBlock?: number, toBlock?: number) => {
    setModalDeployer(deployer || address || '');
    setModalFromBlock(fromBlock !== undefined ? fromBlock.toString() : '0');
    setModalToBlock(toBlock !== undefined ? toBlock.toString() : '0');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-medium mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Botchain Testnet • Chain ID: 968 • BOT Token</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Smart Contract Deployment Tracker
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Investigate contracts deployed by any wallet or factory contract. Detect direct CREATE and factory CREATE2 / proxy clone deployments organized into a verified chronological timeline.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-blue-200">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>Gas fee only (no protocol fee)</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-200" />
              <span>Factory & Direct Detection</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <History className="w-4 h-4 text-blue-200" />
              <span>On-Chain Request Mapping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deployer Search & Range Input */}
      <DeployerSearch
        connectedAddress={address}
        onScan={handleScan}
        onRequestOnChain={handleOpenModal}
        isScanning={isScanning}
      />

      {/* Scanning Progress Alert */}
      {isScanning && scanProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
            <span>
              Scanning blocks on Botchain Testnet: <strong>{scanProgress.scanned}</strong> of{' '}
              <strong>{scanProgress.total}</strong> blocks analyzed...
            </span>
          </div>
          <span className="font-mono font-semibold">
            {Math.round((scanProgress.scanned / Math.max(scanProgress.total, 1)) * 100)}%
          </span>
        </div>
      )}

      {/* Metrics & Statistics */}
      <TimelineStats deployments={deployments} isScanning={isScanning} />

      {/* On-Chain Requests Ledger */}
      <OnChainRequests
        contractAddress={contractAddress}
        onSelectDeployer={(target, fromB, toB) => handleScan(target, fromB, toB)}
      />

      {/* Chronological Deployment Timeline */}
      <DeploymentTimeline
        deployments={deployments}
        isScanning={isScanning}
        deployerAddress={deployerAddress}
      />

      {/* On-Chain Inspection Transaction Modal */}
      <RequestScanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDeployer={modalDeployer}
        defaultFromBlock={modalFromBlock}
        defaultToBlock={modalToBlock}
        contractAddress={contractAddress}
      />

    </div>
  );
}

