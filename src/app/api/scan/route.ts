import { NextRequest, NextResponse } from 'next/server';
import { isAddress, getAddress } from 'viem';
import { scanDeployments } from '@/utils/scanner';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deployer = searchParams.get('deployer');
  const fromBlockStr = searchParams.get('fromBlock');
  const toBlockStr = searchParams.get('toBlock');

  if (!deployer || !isAddress(deployer)) {
    return NextResponse.json(
      { error: 'Valid deployer address is required' },
      { status: 400 }
    );
  }

  try {
    const fromBlock = fromBlockStr ? parseInt(fromBlockStr, 10) : undefined;
    const toBlock = toBlockStr ? parseInt(toBlockStr, 10) : undefined;

    const deployments = await scanDeployments(
      deployer,
      fromBlock,
      toBlock,
      process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'
    );

    // Convert bigints to strings for JSON serialization
    const serialized = deployments.map((d) => ({
      ...d,
      blockNumber: d.blockNumber.toString(),
      gasUsed: d.gasUsed ? d.gasUsed.toString() : undefined,
    }));

    return NextResponse.json({
      deployer: getAddress(deployer),
      count: serialized.length,
      deployments: serialized,
    });
  } catch (error: any) {
    console.error('API Scan Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to scan deployments' },
      { status: 500 }
    );
  }
}

