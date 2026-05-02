import hre from "hardhat";

async function main() {
  console.log("Compiling & Deploying Bhumi LandRegistry...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const address = await landRegistry.getAddress();
  
  console.log("===================================");
  console.log("LandRegistry Contract Deployed to:", address);
  console.log("===================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
