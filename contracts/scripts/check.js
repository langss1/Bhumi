const hre = require("hardhat");

async function main() {
  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const contract = LandRegistry.attach(address);

  const role = await contract.ADMIN_BPN_ROLE();
  console.log("ADMIN_BPN_ROLE hash:", role);

  const wallet = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const hasRole = await contract.hasRole(role, wallet);
  console.log("Does wallet have ADMIN_BPN_ROLE?", hasRole);

  const totalLands = await contract.getTotalLands();
  console.log("Total lands:", totalLands.toString());
}

main().catch(console.error);
