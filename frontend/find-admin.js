async function main() {
  const accounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
  ];

  try {
    const callResp1 = await fetch("http://localhost:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{to: "0x5FbDB2315678afecb367f032d93F642f64180aa3", data: "0xbdb10a3d"}, "latest"],
        id: 1
      })
    });
    const data1 = await callResp1.json();
    const adminRoleHash = data1.result.replace("0x", "");
    
    console.log("Mencari pemegang ADMIN_BPN_ROLE...");
    
    let found = false;
    for (let acc of accounts) {
      const paddedAcc = acc.replace("0x", "").toLowerCase().padStart(64, "0");
      const payload = "0x91d14854" + adminRoleHash + paddedAcc;
      
      const callResp = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{to: "0x5FbDB2315678afecb367f032d93F642f64180aa3", data: payload}, "latest"],
          id: 2
        })
      });
      const data2 = await callResp.json();
      
      if (data2.result && data2.result !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log(`✅ DITEMUKAN! Dompet ini memegang ADMIN_BPN_ROLE: ${acc}`);
        found = true;
        break;
      }
    }
    
    if (!found) {
       console.log("TIDAK ADA dompet di atas yang memegang ADMIN_BPN_ROLE. Mengecek apakah DEFAULT_ADMIN_ROLE (0x00...00) ada yang pegang...");
       for (let acc of accounts) {
          const paddedAcc = acc.replace("0x", "").toLowerCase().padStart(64, "0");
          const payload = "0x91d14854" + "0000000000000000000000000000000000000000000000000000000000000000" + paddedAcc;
          const callResp = await fetch("http://localhost:8545", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_call", params: [{to: "0x5FbDB2315678afecb367f032d93F642f64180aa3", data: payload}, "latest"], id: 3})
          });
          const data2 = await callResp.json();
          if (data2.result && data2.result !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
             console.log(`✅ DITEMUKAN! Dompet ini memegang DEFAULT_ADMIN_ROLE: ${acc}`);
          }
       }
    }
    
  } catch(e) {
    console.log(e);
  }
}
main();
