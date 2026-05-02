export const LandRegistryABI = [
  // Read Functions
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getLandDetails",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "gpsCoordinates", "type": "string" },
          { "internalType": "uint256", "name": "area", "type": "uint256" },
          { "internalType": "string", "name": "nib", "type": "string" },
          { "internalType": "string[]", "name": "ipfsHashes", "type": "string[]" },
          { "internalType": "bool", "name": "isDisputed", "type": "bool" }
        ],
        "internalType": "struct LandRegistry.Land",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getOwnershipHistory",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "transferRequests",
    "outputs": [
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "address", "name": "buyer", "type": "address" },
      { "internalType": "address", "name": "notaris", "type": "address" },
      { "internalType": "bool", "name": "sellerApproved", "type": "bool" },
      { "internalType": "bool", "name": "buyerApproved", "type": "bool" },
      { "internalType": "bool", "name": "notarisApproved", "type": "bool" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },

  // Write Functions
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "gpsCoordinates", "type": "string" },
      { "internalType": "uint256", "name": "area", "type": "uint256" },
      { "internalType": "string", "name": "nib", "type": "string" },
      { "internalType": "string[]", "name": "ipfsHashes", "type": "string[]" }
    ],
    "name": "mintLand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "buyer", "type": "address" }
    ],
    "name": "proposeTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "approveTransferBuyer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "ajbIpfsHash", "type": "string" }
    ],
    "name": "approveTransferNotaris",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bool", "name": "isDisputed", "type": "bool" }
    ],
    "name": "setEnforcement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
