import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
  const wallet = new ethers.Wallet("0xeca04226022b29771e10f2e8ca55a6e720a6d3509e878a47e617b1475c19eff9", provider);
  
  const abi = [
    "function registerAsset(string calldata _name, uint8 _category, uint256 _valuation, string calldata _documentHash) external payable returns (uint256)",
    "function validationFee() public view returns (uint256)"
  ];
  
  const contractAddress = "0xEd2CF0A54B738494DD185d1CE30D969D57A4cB2a";
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log("Checking contract status on Sepolia...");
  try {
    const fee = await contract.validationFee();
    console.log("Contract is reachable. Validation Fee:", ethers.formatEther(fee), "ETH");
  } catch(e) {
    console.log("Error reaching contract:", e.message);
    return;
  }

  console.log("Sending 'Villa Bojos' registration transaction to Blockchain...");
  try {
    // Category 0 = Property (berdasarkan AssetSchema.sol/AssetCategory enum)
    const tx = await contract.registerAsset(
      "Villa Bojos (On-Chain Proof)", 
      0, 
      ethers.parseEther("0.1"), // Valuasi dalam Wei (misal 0.1 ETH)
      "bba773fdf508d3d7e864c843ac5e1a5f9e0d996359ca46", 
      { value: ethers.parseEther("0.001") }
    );
    
    console.log("Transaction Sent! Hash:", tx.hash);
    console.log("Waiting for confirmation... (Check Etherscan in 20s)");
    await tx.wait();
    console.log("SUCCESS! Transaction confirmed on-chain.");
    console.log("URL Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);
  } catch(e) {
    console.log("Transaction failed:", e.message);
  }
}

main().catch(console.error);
