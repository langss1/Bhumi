const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const abi = [
        "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
        "function hasRole(bytes32 role, address account) view returns (bool)"
    ];
    
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const hasAdmin = await contract.hasRole(adminRole, deployerAddress);
    console.log("====================================");
    console.log("Checking Admin Role for:", deployerAddress);
    console.log("DEFAULT_ADMIN_ROLE hash:", adminRole);
    console.log("Has Admin Role:", hasAdmin);
    console.log("====================================");
}

main().catch(console.error);
