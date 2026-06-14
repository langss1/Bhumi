const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // from previous context or standard localhost deploy
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const contract = LandRegistry.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"); // Wait, I need the actual contract address. 
  
  // Actually, I can just use cast or standard ethers.
}
main();
