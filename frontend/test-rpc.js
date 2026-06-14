const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  // Baca ABI dari file JSON
  const artifactPath = "/home/habb/Kuliah/blockchain/Bhumi/frontend/src/contracts/LandRegistry.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Ambil address dari wagmi.ts
  const wagmiContent = fs.readFileSync("/home/habb/Kuliah/blockchain/Bhumi/frontend/src/lib/wagmi.ts", "utf8");
  const addressMatch = wagmiContent.match(/LAND_REGISTRY_ADDRESS\s*=\s*['"](0x[a-fA-F0-9]{40})['"]/);
  if (!addressMatch) {
    console.log("Address not found");
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
    console.log("- isProcessed:", req24[4]);
    console.log("- isRejected:", req24[5]);
  } catch (e) {
    console.log("Error querying:", e.message);
  }
}

main();
