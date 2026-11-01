import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainTestnet } from './botchain';

export const networks = [botchainTestnet];

export function getWagmiAdapter(projectId: string) {
  return new WagmiAdapter({
    ssr: true,
    projectId: projectId || 'b56e18d47c72ab683b10814fe9495694',
    networks,
  });
}
