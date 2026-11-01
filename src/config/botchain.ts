import { defineChain } from 'viem';

export const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
    public: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life/',
    },
  },
  testnet: true,
});

export const BOTCHAIN_DEFAULT_RPC = 'https://rpc.bohr.life';
export const BOTCHAIN_EXPLORER_URL = 'https://scan.bohr.life/';

