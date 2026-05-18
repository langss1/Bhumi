const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    
    // Account #3 is the Notaris (index 3 in Hardhat accounts)
    const signers = await ethers.getSigners();
    const notaris = signers[3];
    const contract = await LandRegistry.connect(notaris).attach(contractAddress);

    const tokenId = 0;
    const ajbHash = "QmTest123456789";

    console.log("Notaris Address:", notaris.address);
    console.log("Simulating approveTransferNotaris for Token #0...");

    try {
        const tx = await contract.approveTransferNotaris(tokenId, ajbHash);
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        
        const newOwner = await contract.ownerOf(tokenId);
        console.log("New Owner:", newOwner);
    } catch (e) {
        console.error("FAILED! Revert Reason:", e.message);
    }
}

main().catch(console.error);
