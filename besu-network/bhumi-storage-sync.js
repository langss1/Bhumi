import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = 'C:\\bhumi-data\\storage';
const CONTRACT_JSON_PATH = path.join(__dirname, '../frontend/src/contracts/LandRegistry.json');

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Config
const RPC_URL = 'http://127.0.0.1:8545';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

async function downloadFile(ipfsHash, fileName) {
    const filePath = path.join(STORAGE_DIR, fileName || ipfsHash);
    
    if (fs.existsSync(filePath)) {
        console.log(`[Storage] File already exists: ${fileName || ipfsHash}`);
        return;
    }

    console.log(`[Storage] Downloading ${ipfsHash} from IPFS...`);
    try {
        const response = await axios.get(`${PINATA_GATEWAY}${ipfsHash}`, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`[Storage] Successfully saved: ${filePath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`[Storage] Failed to download ${ipfsHash}:`, error.message);
    }
}

async function main() {
    console.log('=============================================');
    console.log(' BHUMI DECENTRALIZED STORAGE SYNCER          ');
    console.log('=============================================');
    console.log(`Connecting to Local Node: ${RPC_URL}`);
    console.log(`Storage Path: ${STORAGE_DIR}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    if (!fs.existsSync(CONTRACT_JSON_PATH)) {
        console.error('Contract ABI not found! Please deploy or sync ABI first.');
        return;
    }

    const contractData = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH, 'utf8'));
    const contractAddress = contractData.address || process.env.CONTRACT_ADDRESS; 
    
    if (!contractAddress || contractAddress === "0x") {
        console.error('Contract address not found in JSON. Waiting for deployment...');
        // Polling if not found
        setTimeout(main, 5000);
        return;
    }

    const contract = new ethers.Contract(contractAddress, contractData.abi, provider);

    console.log(`Listening for events on: ${contractAddress}`);

    // Listen for new land requests (AJB/Docs)
    contract.on('LandRequested', async (requestId, to, nib, event) => {
        console.log(`[Event] LandRequested detected for NIB: ${nib}`);
        const details = await contract.getRequestDetails(requestId);
        const hashes = details.ipfsHashes; // string[]
        for (const hash of hashes) {
            await downloadFile(hash, `land_request_${requestId}_${hash.slice(-6)}.pdf`);
        }
    });

    // Listen for minted assets
    contract.on('AssetMinted', async (tokenId, owner, nib, event) => {
        console.log(`[Event] AssetMinted detected for Token: ${tokenId}`);
        const land = await contract.getLandDetails(tokenId);
        const hashes = land.ipfsHashes;
        for (const hash of hashes) {
            await downloadFile(hash, `certificate_${tokenId}_${hash.slice(-6)}.pdf`);
        }
    });

    // Sync existing data on startup
    console.log('[Storage] Syncing historical data...');
    const totalLands = await contract.getTotalLands();
    for (let i = 0; i < totalLands; i++) {
        const land = await contract.getLandDetails(i);
        for (const hash of land.ipfsHashes) {
            await downloadFile(hash, `certificate_${i}_${hash.slice(-6)}.pdf`);
        }
    }

    console.log('[Storage] System is online and watching for CRUD updates.');
}

main().catch(console.error);
