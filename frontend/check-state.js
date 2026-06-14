const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const ProviderClass = ethers.providers ? ethers.providers.JsonRpcProvider : ethers.JsonRpcProvider;
  const provider = new ProviderClass("http://localhost:8545");
  
  const artifactPath = "/home/habb/Kuliah/blockchain/Bhumi/frontend/src/contracts/LandRegistry.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const envContent = fs.readFileSync("/home/habb/Kuliah/blockchain/Bhumi/frontend/.env.local", "utf8");
  const addressMatch = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS\s*=\s*(0x[a-fA-F0-9]{40})/);
  if (!addressMatch) {
    console.log("Address not found in .env.local");
    return;
  }
  const address = addressMatch[1];
  console.log("Contract Address:", address);

  const contract = new ethers.Contract(address, artifact.abi, provider);

  try {
    const totalLands = await contract.getTotalLands();
    console.log("Total Lands On-Chain:", totalLands.toString());
    
    const req24 = await contract.getRequestDetails(24);
    console.log("Request 24 Details:");
    console.log("- to:", req24[0]);
    console.log("- isProcessed:", req24[4]);
    console.log("- isRejected:", req24[5]);
  } catch (e) {
    console.log("Error querying:", e.message);
  }
}

main();
