import hre from "hardhat";

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LandRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  console.log("Mendaftarkan tanah simulasi...");
  const tx = await LandRegistry.mintLand(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Ke diri sendiri
    "-6.20, 106.81",
    500,
    "NIB-TEST-PERSISTENCE-123",
    ["QmTestHash"],
    { gasPrice: 1000000000 }
  );
  await tx.wait();

  const total = await LandRegistry.getTotalLands();
  console.log("Total tanah di blockchain sekarang:", total.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
