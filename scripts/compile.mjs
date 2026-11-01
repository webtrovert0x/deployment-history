import fs from 'fs';
import path from 'path';
import solc from 'solc';

const contractPath = path.resolve('contracts', 'DeploymentHistory.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'DeploymentHistory.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log('Compiling DeploymentHistory.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasErrors = false;
  output.errors.forEach((err) => {
    console.error(err.formattedMessage);
    if (err.severity === 'error') hasErrors = true;
  });
  if (hasErrors) {
    process.exit(1);
  }
}

const contract = output.contracts['DeploymentHistory.sol']['DeploymentHistory'];
const artifact = {
  contractName: 'DeploymentHistory',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object,
};

fs.mkdirSync('src/contracts', { recursive: true });
fs.writeFileSync('src/contracts/DeploymentHistory.json', JSON.stringify(artifact, null, 2));
console.log('Successfully compiled and saved to src/contracts/DeploymentHistory.json');

