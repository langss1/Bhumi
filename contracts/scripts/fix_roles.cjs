const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const [admin] = await ethers.getSigners();
    const contract = await LandRegistry.connect(admin).attach(contractAddress);

    const NOTARIS_ROLE = await contract.NOTARIS_ROLE();
    const signers = await ethers.getSigners();

    console.log("Granting NOTARIS_ROLE to all accounts for demo resilience...");

    for (const signer of signers) {
        const hasRole = await contract.hasRole(NOTARIS_ROLE, signer.address);
        if (!hasRole) {
            const tx = await contract.grantRole(NOTARIS_ROLE, signer.address, { gasPrice: 1000000000 });
            await tx.wait();
            console.log(`Granted NOTARIS_ROLE to ${signer.address}`);
        } else {
            console.log(`${signer.address} already has NOTARIS_ROLE`);
        }
    }

    console.log("All accounts now have Notaris role. Testing simulation again...");
}

main().catch(console.error);
