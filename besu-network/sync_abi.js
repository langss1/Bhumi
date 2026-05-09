const fs = require('fs');
const path = require('path');

const artifactPath = 'c:/Tugas Semester 6/Blockchain/tubes/hardhat_deploy/artifacts/contracts/LandRegistry.sol/LandRegistry.json';
const abiPath = 'c:/Tugas Semester 6/Blockchain/tubes/frontend/src/lib/abi.ts';

try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = JSON.stringify(artifact.abi, null, 2);
    
    const content = `export const LandRegistryABI = ${abi} as const;\n`;
    
    fs.writeFileSync(abiPath, content);
    console.log('Successfully synced ABI to frontend/src/lib/abi.ts');
} catch (error) {
    console.error('Error syncing ABI:', error);
}
