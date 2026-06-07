import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = process.platform === 'win32'
    ? 'C:\\bhumi-data\\storage'
    : path.join(process.env.HOME || '/tmp', 'bhumi-data/storage');
const CONTRACT_JSON_PATH = process.env.CONTRACT_ABI_PATH || path.join(__dirname, '../Bhumi_Decentralized_Final/frontend/src/contracts/LandRegistry.json');

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Config
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

// Load Pinata JWT from .env.local manually to authenticate Pinata IPFS Gateway
let PINATA_JWT = '';
try {
    const envPath = path.join(__dirname, '../Bhumi_Decentralized_Final/frontend/.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NEXT_PUBLIC_PINATA_JWT\s*=\s*(.*)/);
        if (match && match[1]) {
            PINATA_JWT = match[1].trim().replace(/['"]/g, ''); // clean quotes if any
        }
    }
    if (PINATA_JWT) {
        console.log('[Storage] Successfully loaded Pinata JWT for authenticated IPFS downloads.');
    } else {
        console.log('[Storage] Pinata JWT not found in .env.local. Using public gateways.');
    }
} catch (err) {
    console.warn('[Storage] Failed to read .env.local for Pinata JWT:', err.message);
}

async function downloadFile(ipfsHash, fileName) {
    const filePath = path.join(STORAGE_DIR, fileName || ipfsHash);
    
    if (fs.existsSync(filePath)) {
        console.log(`[Storage] File already exists: ${fileName || ipfsHash}`);
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 💡 10,000 IQ LOCAL CACHE CHECK
    // Jika hash ini sudah pernah diunduh dengan nama file yang berbeda,
    // kita cukup mengkopi file lokal tersebut tanpa harus download dari internet!
    // ─────────────────────────────────────────────────────────────────────────
    try {
        if (fs.existsSync(STORAGE_DIR)) {
            const files = fs.readdirSync(STORAGE_DIR);
            const hashSuffix = `_${ipfsHash.slice(-6)}.pdf`;
            const existingFile = files.find(f => f.endsWith(hashSuffix));
            
            if (existingFile) {
                console.log(`[Storage] Hash ${ipfsHash} already exists locally as: ${existingFile}`);
                console.log(`[Storage] Instantly copying locally to: ${fileName || ipfsHash}...`);
                fs.copyFileSync(path.join(STORAGE_DIR, existingFile), filePath);
                console.log(`[Storage] Successfully copied locally!`);
                return;
            }
        }
    } catch (err) {
        console.warn(`[Storage] Local copy optimization failed: ${err.message}. Proceeding to download...`);
    }

    // List of highly reliable and fast public gateways
    const gateways = [
        'https://ipfs.io/ipfs/',
        'https://dweb.link/ipfs/',
        'https://ipfs.4everland.xyz/ipfs/',
        'https://w3s.link/ipfs/',
        'https://ipfs.filebase.io/ipfs/',
        'https://nftstorage.link/ipfs/',
        'https://ipfs.run/ipfs/'
    ];
    
    // If we have a JWT, add Pinata Gateway as a fallback option
    if (PINATA_JWT) {
        gateways.push('https://gateway.pinata.cloud/ipfs/');
    }

    // Filter out duplicates (if any) while maintaining order
    const uniqueGateways = [...new Set(gateways)];

    for (const gateway of uniqueGateways) {
        console.log(`[Storage] Downloading ${ipfsHash} from IPFS using gateway: ${gateway}...`);
        try {
            // Bypass gateway scraper protection (403 Forbidden errors) by mimicking a modern web browser
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            };

            // Inject Pinata JWT authorization header for Pinata gateway calls
            if (gateway.includes('pinata') && PINATA_JWT) {
                headers['Authorization'] = `Bearer ${PINATA_JWT}`;
            }

            const response = await axios.get(`${gateway}${ipfsHash}`, { 
                responseType: 'stream',
                timeout: 8000, // 8 second timeout per gateway for fast failover
                headers: headers
            });
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', (err) => {
                    writer.close();
                    // Clean up partial file on error
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    reject(err);
                });
            });
            
            console.log(`[Storage] Successfully saved: ${filePath}`);
            return; // Download succeeded, stop trying other gateways
        } catch (error) {
            console.warn(`[Storage] Gateway ${gateway} failed for ${ipfsHash}: ${error.message}`);
            
            // Clean up partial file if exists
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (cleanupErr) {
                // Ignore cleanup errors
            }

            // If the error is standard 400 Bad Request, the hash itself is invalid (like dummy "QmTest...")
            // No point in retrying other gateways
            if (error.response && (error.response.status === 400 || error.response.status === 404)) {
                console.error(`[Storage] Invalid or non-existent IPFS hash: ${ipfsHash}. Skipping other gateways.`);
                break;
            }
        }
    }
    console.error(`[Storage] All gateways failed to download ${ipfsHash}`);
}

async function waitForNode(provider) {
    console.log('[Storage] Checking local Besu node connection...');
    while (true) {
        try {
            await provider.getBlockNumber();
            console.log('[Storage] Local Besu node is online and RPC is ready!');
            break;
        } catch (error) {
            console.log('[Storage] Besu node RPC not ready yet, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function main() {
    console.log('=============================================');
    console.log(' BHUMI DECENTRALIZED STORAGE SYNCER          ');
    console.log('=============================================');
    console.log(`Connecting to Local Node: ${RPC_URL}`);
    console.log(`Storage Path: ${STORAGE_DIR}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Wait until local Besu node JSON-RPC is fully responsive
    await waitForNode(provider);

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
