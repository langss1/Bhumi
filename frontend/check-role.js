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

  const walletBPNAsli = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_BPN_ROLE"));
  
  try {
    const hasRole = await contract.hasRole(roleHash, walletBPNAsli);
    console.log("Does BPN ASLI have ADMIN_BPN_ROLE?", hasRole);
    
    // Mari kita cek tx receipt dari block terbaru untuk melihat apakah tx-nya revert
    const blockNumber = await provider.getBlockNumber();
    console.log("Latest block:", blockNumber);
    const block = await provider.getBlock(blockNumber, true); // Get block with txs
    if (block && block.prefetchedTransactions && block.prefetchedTransactions.length > 0) {
       const txHash = block.prefetchedTransactions[block.prefetchedTransactions.length - 1].hash;
       const receipt = await provider.getTransactionReceipt(txHash);
       console.log("Status transaksi terbaru:", receipt.status === 1 ? "SUCCESS" : "REVERTED");
    }
  } catch (e) {
    console.log("Error querying:", e.message);
  }
}

main();
