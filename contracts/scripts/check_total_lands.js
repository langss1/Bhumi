import hre from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(`Mengecek kontrak di: ${contractAddress}...`);
  
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = LandRegistry.attach(contractAddress);

  const total = await landRegistry.getTotalLands();
  console.log(`Total aset di blockchain (Node Lokal): ${total.toString()}`);
  
  if (total > 0) {
    for (let i = 0; i < total; i++) {
        const owner = await landRegistry.ownerOf(i);
        console.log(`Token #${i} - Pemilik: ${owner}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
