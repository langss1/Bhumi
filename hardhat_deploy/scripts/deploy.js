import hre from "hardhat";

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  console.log("Compiling & Deploying Bhumi LandRegistry (Stable Version)...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  
  const landRegistry = await LandRegistry.deploy({ 
    gasLimit: 10000000,
    gasPrice: 1000000000 
  });

  await landRegistry.waitForDeployment();
  const address = await landRegistry.getAddress();
  
  console.log("===================================");
  console.log("LandRegistry Contract Deployed to:", address);
  console.log("===================================");

  const BPN_WILAYAH_ROLE = await landRegistry.BPN_WILAYAH_ROLE();
  const NOTARIS_ROLE = await landRegistry.NOTARIS_ROLE();
  const AUDITOR_ROLE = await landRegistry.AUDITOR_ROLE();

  console.log("Granting roles to available simulation accounts...");
  
  // Berikan role ke akun-akun yang ada di config (jika ada)
  for (let i = 1; i < signers.length; i++) {
    const signer = signers[i];
    if (i === 1 || i === 2) {
        await landRegistry.grantRole(BPN_WILAYAH_ROLE, signer.address, { gasPrice: 1000000000 });
        console.log(`Granted BPN_WILAYAH_ROLE to ${signer.address}`);
    } else if (i === 3) {
        await landRegistry.grantRole(NOTARIS_ROLE, signer.address, { gasPrice: 1000000000 });
        console.log(`Granted NOTARIS_ROLE to ${signer.address}`);
    } else if (i === 4) {
        await landRegistry.grantRole(AUDITOR_ROLE, signer.address, { gasPrice: 1000000000 });
        console.log(`Granted AUDITOR_ROLE to ${signer.address}`);
    }
  }

  console.log("Done! Jaringan Besu Permanen Siap Digunakan.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
