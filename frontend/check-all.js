const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const ProviderClass = ethers.providers ? ethers.providers.JsonRpcProvider : ethers.JsonRpcProvider;
  const provider = new ProviderClass("http://localhost:8545");
  
  const artifactPath = "/home/habb/Kuliah/blockchain/Bhumi/frontend/src/contracts/LandRegistry.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const envContent = fs.readFileSync("/home/habb/Kuliah/blockchain/Bhumi/frontend/.env.local", "utf8");
  const addressMatch = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS\s*=\s*(0x[a-fA-F0-9]{40})/);
  const address = addressMatch[1];
  
  const contract = new ethers.Contract(address, artifact.abi, provider);

  try {
    const totalLands = await contract.getTotalLands();
    console.log("Total Lands (Master Ledger):", totalLands.toString());
    
    const totalRequests = await contract.getTotalRequests();
    console.log("Total Requests (Validasi):", totalRequests.toString());
    
    const start = Math.max(0, parseInt(totalRequests.toString()) - 10);
    console.log(`\nMengecek 10 Request terakhir (REQ-${start} sampai REQ-${totalRequests - 1}):`);
    
    for (let i = start; i < totalRequests; i++) {
      const req = await contract.getRequestDetails(i);
      console.log(`REQ-${i}: isProcessed=${req[4]}, isRejected=${req[5]}`);
    }
  } catch (e) {
    console.log("Error querying:", e.message);
  }
}

main();
