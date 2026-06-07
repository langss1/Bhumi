import hre from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const targetAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Akun Arina

  console.log(`Menghubungkan ke kontrak di: ${contractAddress}...`);
  
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = LandRegistry.attach(contractAddress);

  const BPN_WILAYAH_ROLE = await landRegistry.BPN_WILAYAH_ROLE();
  
  console.log(`Memberikan akses BPN_WILAYAH_ROLE ke ${targetAddress}...`);
  const tx = await landRegistry.grantRole(BPN_WILAYAH_ROLE, targetAddress, {
    gasLimit: 1000000,
    gasPrice: 1000000000
  });
  await tx.wait();
  
  console.log("Akses berhasil diberikan! Silakan coba daftarkan tanah lagi di web.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
