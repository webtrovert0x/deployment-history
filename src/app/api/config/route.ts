import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS || '';

  if (!contractAddress) {
    try {
      const deployedPath = path.resolve(process.cwd(), 'src/contracts/deployedAddress.json');
      if (fs.existsSync(deployedPath)) {
        const data = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
        if (data.address) contractAddress = data.address;
      }
    } catch (e) {
      // ignore
    }
  }

  return NextResponse.json({
    reownId: process.env.REOWN_ID || '',
    contractAddress,
    chainId: 968,
    rpcUrl: process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life',
    explorerUrl: process.env.BOTCHAIN_EXPLORER_URL || 'https://scan.bohr.life/',
  });
}

