import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/context/Web3Provider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DeploymentHistory | Botchain Testnet Contract Tracker',
  description: 'Smart contract deployment history tracker and verification inspector on Botchain Testnet (Chain ID 968).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read REOWN_ID directly on the server from .env
  const reownId = process.env.REOWN_ID || '';

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Web3Provider projectId={reownId}>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t border-blue-100 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">DeploymentHistory</span>
                <span>•</span>
                <span>Botchain Testnet (Chain ID: 968)</span>
              </div>
              <div>
                All contract functions execute with <strong className="text-blue-700">gas fee only</strong>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}

