import hre from "hardhat";

async function main() {
  console.log("Compiling & Deploying BangBang...");
  const BangBang = await hre.ethers.getContractFactory("BangBang");
  const bangBang = await BangBang.deploy("1000000000000000");
  await bangBang.waitForDeployment();
  const address = await bangBang.getAddress();
  
  console.log("===================================");
  console.log("BangBang Contract Deployed to:", address);
  console.log("===================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
