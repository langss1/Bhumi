import { ethers } from "ethers";

// ABI just for granting roles
const abi = [
  "function grantRole(bytes32 role, address account) public",
  "function BPN_WILAYAH_ROLE() public view returns (bytes32)",
  "function NOTARIS_ROLE() public view returns (bytes32)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("http://10.223.153.80:8545");
  // Hardhat Account 0 Private Key (Deployer)
  const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const userAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account 1 from Hardhat

  const landRegistry = new ethers.Contract(contractAddress, abi, wallet);

  // Get the roles
  const BPN_WILAYAH_ROLE = await landRegistry.BPN_WILAYAH_ROLE();
  const NOTARIS_ROLE = await landRegistry.NOTARIS_ROLE();

  console.log("Granting BPN_WILAYAH_ROLE to:", userAddress);
  let tx = await landRegistry.grantRole(BPN_WILAYAH_ROLE, userAddress);
  await tx.wait();
  console.log("BPN_WILAYAH_ROLE granted!");
  
  console.log("Granting NOTARIS_ROLE to:", userAddress);
  tx = await landRegistry.grantRole(NOTARIS_ROLE, userAddress);
  await tx.wait();
  console.log("NOTARIS_ROLE granted! (just in case you need to test Notaris too)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
