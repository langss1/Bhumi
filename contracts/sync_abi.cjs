const fs = require('fs');
const path = require('path');

const contractPath = path.join(__dirname, 'artifacts/contracts/LandRegistry.sol/LandRegistry.json');
const frontendPath = path.join(__dirname, '../frontend/src/contracts/LandRegistry.json');

if (!fs.existsSync(contractPath)) {
    console.error('Artifact not found! Run npx hardhat compile first.');
    process.exit(1);
}

const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

// Create directory if not exists
const frontendDir = path.dirname(frontendPath);
if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
}

fs.writeFileSync(frontendPath, JSON.stringify(contractJson, null, 2));

console.log('ABI synced to frontend successfully!');
