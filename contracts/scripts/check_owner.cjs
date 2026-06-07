const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const contract = await LandRegistry.attach(contractAddress);

    try {
        const owner = await contract.ownerOf(0);
        console.log("Current Owner of Token #0:", owner);
        
        const details = await contract.getLandDetails(0);
        console.log("Land Details:", details);
        
        const history = await contract.getOwnershipHistory(0);
        console.log("Ownership History:", history);

        const request = await contract.transferRequests(0);
        console.log("Transfer Request Status (isActive):", request.isActive);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main().catch(console.error);
