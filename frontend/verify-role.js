const fs = require("fs");

async function main() {
  try {
    // 1. Dapatkan hash dari ADMIN_BPN_ROLE
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
    const adminRoleHash = data1.result;
    console.log("ADMIN_BPN_ROLE hash:", adminRoleHash);

    // 2. Cek hasRole(ADMIN_BPN_ROLE, 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
    // Selector for hasRole(bytes32,address) is 0x91d14854
    const wallet = "000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const payload = "0x91d14854" + adminRoleHash.replace("0x", "") + wallet;
    
    const callResp2 = await fetch("http://localhost:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{to: "0x5FbDB2315678afecb367f032d93F642f64180aa3", data: payload}, "latest"],
        id: 2
      })
    });
    const data2 = await callResp2.json();
    console.log("hasRole result:", data2.result);
    
  } catch(e) {
    console.log(e);
  }
}
main();
