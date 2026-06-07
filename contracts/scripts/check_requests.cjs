const { ethers } = require("ethers");

async function main() {
  // Hubungkan langsung ke Besu RPC
  const provider = new ethers.JsonRpcProvider("http://10.223.153.80:8545");
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // ABI minimal untuk baca data
  const abi = [
    "function getTotalRequests() view returns (uint256)",
    "function getRequestDetails(uint256) view returns (tuple(address to, string gpsCoordinates, uint256 area, string nib, string[] ipfsHashes, bool isProcessed, bool isRejected))"
  ];

  const LandRegistry = new ethers.Contract(contractAddress, abi, provider);

  try {
    const totalRequests = await LandRegistry.getTotalRequests();
    console.log("===================================");
    console.log("Audit Jaringan Bhumi (BESU LIVE):");
    console.log("Total Antrian Request:", totalRequests.toString());
    console.log("===================================");

    if (totalRequests > 0) {
      for (let i = 0; i < totalRequests; i++) {
        const req = await LandRegistry.getRequestDetails(i);
        console.log(`Request #${i}: NIB ${req.nib} | To: ${req.to} | Processed: ${req.isProcessed}`);
      }
    } else {
      console.log("Hasil Audit: ANTRIAN KOSONG.");
      console.log("KESIMPULAN: BPN Wilayah belum berhasil mengirim data ke alamat ini.");
      console.log("Saran: Pastikan BPN Wilayah sudah Refresh browser dan pakai .env.local yang baru.");
    }
  } catch (err) {
    console.error("Gagal konek ke kontrak! Pastikan alamat kontrak 0x5FbD... sudah benar dan Besu nyala.");
    console.error(err.message);
  }
}

main();
