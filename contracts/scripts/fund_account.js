import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const targetAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Akun Arina

  console.log(`Mengirim ETH dari ${deployer.address} ke ${targetAddress}...`);

  const tx = await deployer.sendTransaction({
    to: targetAddress,
    value: hre.ethers.parseEther("100.0"), // Kirim 100 ETH
    gasPrice: 1000000000,
    gasLimit: 21000
  });

  await tx.wait();
  console.log("ETH berhasil dikirim! Sekarang akun Arina punya saldo untuk bayar gas.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
