const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const abi = [
    "function lands(uint256 tokenId) view returns (string gpsCoordinates, uint256 area, string nib, bool isDisputed)"
  ];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  const land37 = await contract.lands(37n);
  console.log("Token #37 NIB:", land37.nib);
  
  const land44 = await contract.lands(44n);
  console.log("Token #44 NIB:", land44.nib);
}

main().catch(console.error);
