'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { botchainTestnet } from '@/config/botchain';
import { getWagmiAdapter } from '@/config/wagmi';

const queryClient = new QueryClient();

export function Web3Provider({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId?: string;
}) {
  const [activeProjectId, setActiveProjectId] = useState<string>(projectId || '');
  const [wagmiAdapter, setWagmiAdapter] = useState<any>(null);

  useEffect(() => {
    // If not passed through props, check /api/config
    if (!activeProjectId) {
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.reownId) {
            setActiveProjectId(data.reownId);
          }
        })
        .catch((err) => console.warn('Could not load REOWN_ID from API:', err));
    }
  }, [activeProjectId]);

  useEffect(() => {
    const effectiveId = activeProjectId || 'b56e18d47c72ab683b10814fe9495694'; // fallback ID for initialization
    const adapter = getWagmiAdapter(effectiveId);
    setWagmiAdapter(adapter);

    createAppKit({
      adapters: [adapter],
      networks: [botchainTestnet],
      defaultNetwork: botchainTestnet,
      projectId: effectiveId,
      metadata: {
        name: 'DeploymentHistory',
        description: 'Smart contract deployment history tracker on Botchain Testnet',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://scan.bohr.life',
        icons: ['https://avatars.githubusercontent.com/u/179229932'],
      },
      themeMode: 'light',
      themeVariables: {
        '--w3m-accent': '#2563eb',
        '--w3m-color-mix': '#eff6ff',
        '--w3m-color-mix-strength': 10,
        '--w3m-border-radius-master': '8px',
      },
    });
  }, [activeProjectId]);

  if (!wagmiAdapter) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600 font-medium">Loading Web3 Provider...</div>;
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

