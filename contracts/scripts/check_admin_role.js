import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    
    // Connect to contract on localhost (port 8545)
    const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const deployer = new hre.ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const contract = LandRegistry.attach(contractAddress).connect(deployer);

    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const hasAdmin = await contract.hasRole(adminRole, deployer.address);
    console.log("====================================");
    console.log("Checking Admin Role for:", deployer.address);
    console.log("DEFAULT_ADMIN_ROLE hash:", adminRole);
    console.log("Has Admin Role:", hasAdmin);
    console.log("====================================");
}

main().catch(console.error);
