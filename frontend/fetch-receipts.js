async function main() {
  for (let i = 0; i < 20; i++) {
    try {
      const response = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: ["latest", true],
          id: 1
        })
      });
      const data = await response.json();
      
      const txs = data.result.transactions;
      if (txs.length > 0) {
        console.log(`Found ${txs.length} transactions in block ${data.result.number}:`);
        for (const tx of txs) {
          const rxResp = await fetch("http://localhost:8545", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
               jsonrpc: "2.0",
               method: "eth_getTransactionReceipt",
               params: [tx.hash],
               id: 2
             })
          });
          const rxData = await rxResp.json();
          console.log(`- Tx: ${tx.hash}`);
          console.log(`  From: ${tx.from}`);
          console.log(`  To: ${tx.to}`);
          console.log(`  Status: ${rxData.result.status === '0x1' ? 'SUCCESS' : 'REVERTED'}`);
          
          if (rxData.result.status === '0x0') {
             // Coba dapatkan revert reason via eth_call
             const callResp = await fetch("http://localhost:8545", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                 jsonrpc: "2.0",
                 method: "eth_call",
                 params: [{from: tx.from, to: tx.to, data: tx.input}, data.result.number],
                 id: 3
               })
             });
             const callData = await callResp.json();
             console.log(`  Revert Data: ${callData.error ? callData.error.message : callData.result}`);
          }
        }
        return;
      }
      
      // Jika kosong, cari di block sebelumnya
      const blockNumStr = data.result.number;
      const prevBlock = "0x" + (parseInt(blockNumStr, 16) - 1).toString(16);
      
      const prevResp = await fetch("http://localhost:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: [prevBlock, true],
          id: 4
        })
      });
      const prevData = await prevResp.json();
      const prevTxs = prevData.result.transactions;
      if (prevTxs.length > 0) {
        console.log(`Found ${prevTxs.length} transactions in block ${prevData.result.number}:`);
        for (const tx of prevTxs) {
           const rxResp = await fetch("http://localhost:8545", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
               jsonrpc: "2.0",
               method: "eth_getTransactionReceipt",
               params: [tx.hash],
               id: 5
             })
          });
          const rxData = await rxResp.json();
          console.log(`- Tx: ${tx.hash}`);
          console.log(`  Status: ${rxData.result.status === '0x1' ? 'SUCCESS' : 'REVERTED'}`);
        }
        return;
      }
    } catch (e) {
       console.log("Error", e);
    }
  }
  console.log("No transactions found in the last 20 blocks");
}
main();
