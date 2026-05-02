import hre from "hardhat";

async function main() {
  const [deployer, acc1, acc2, acc3, acc4] = await hre.ethers.getSigners();

  console.log("Compiling & Deploying Bhumi LandRegistry...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const address = await landRegistry.getAddress();
  
  console.log("===================================");
  console.log("LandRegistry Contract Deployed to:", address);
  console.log("===================================");

  // Grant roles to simulation accounts automatically
  const BPN_WILAYAH_ROLE = await landRegistry.BPN_WILAYAH_ROLE();
  const NOTARIS_ROLE = await landRegistry.NOTARIS_ROLE();
  const AUDITOR_ROLE = await landRegistry.AUDITOR_ROLE();

  console.log("Granting roles to simulation accounts...");
  
  await landRegistry.grantRole(BPN_WILAYAH_ROLE, acc1.address);
  await landRegistry.grantRole(BPN_WILAYAH_ROLE, acc2.address);
  await landRegistry.grantRole(NOTARIS_ROLE, acc3.address);
  await landRegistry.grantRole(AUDITOR_ROLE, acc4.address);

  console.log("Done! Roles granted for Acc 0, 1, 2, 3, 4.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
