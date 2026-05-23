import { type Address } from 'viem';

// ─── Contract Address ─────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_CONTRACT_ADDRESS after deployment:
//   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
// Then copy the deployed address here or in .env.local
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
) as Address;

export const IS_CONTRACT_DEPLOYED = CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

// ─── Validation Fee (must match INITIAL_VALIDATION_FEE in Deploy.s.sol) ──────
export const VALIDATION_FEE_WEI = BigInt('1000000000000000'); // 0.001 ETH in Wei

// ─── Asset Category Enum (matches AssetSchema.sol: AssetCategory) ────────────
export const ASSET_CATEGORY = {
  Property: 0,
  Vehicle: 1,
  Gold: 2,
  Other: 3,
} as const;

export type AssetCategoryKey = keyof typeof ASSET_CATEGORY;
export const ASSET_CATEGORY_LABELS: Record<number, AssetCategoryKey> = {
  0: 'Property',
  1: 'Vehicle',
  2: 'Gold',
  3: 'Other',
};

// ─── Asset State Enum (matches AssetSchema.sol: AssetState) ──────────────────
export const ASSET_STATE = {
  Pending: 0,
  Verified: 1,
  Archived: 2,
} as const;

export const ASSET_STATE_LABELS: Record<number, string> = {
  0: 'Pending',
  1: 'Verified',
  2: 'Archived',
};

// ─── BangBang ABI — 100% matches foundry/src/BangBang.sol ────────────────────
export const BANGBANG_ABI = [
  // ── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'AssetRegistered',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'category', type: 'uint8', indexed: false },
      { name: 'valuation', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetVerified',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'verificator', type: 'address', indexed: true },
      { name: 'feeToVerificator', type: 'uint256', indexed: false },
      { name: 'feeToAdmin', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetRejected',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'verificator', type: 'address', indexed: true },
      { name: 'refundAmt', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ValuationUpdated',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'oldValuation', type: 'uint256', indexed: false },
      { name: 'newValuation', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetTransferred',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetArchived',
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ValidationFeeUpdated',
    inputs: [
      { name: 'oldFee', type: 'uint256', indexed: false },
      { name: 'newFee', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VerificatorAppointed',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VerificatorRemoved',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
  },

  // ── Constructor ────────────────────────────────────────────────────────────
  {
    type: 'constructor',
    inputs: [{ name: '_initialFee', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },

  // ── Write: User Functions ──────────────────────────────────────────────────

  /**
   * registerAsset(string _name, uint8 _category, uint256 _valuation, string _documentHash)
   * payable — must send exactly validationFee (0.001 ETH)
   * Returns uint256 assetId
   * modifier: none (any wallet)
   */
  {
    type: 'function',
    name: 'registerAsset',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_category', type: 'uint8' },
      { name: '_valuation', type: 'uint256' },
      { name: '_documentHash', type: 'string' },
    ],
    outputs: [{ name: 'assetId', type: 'uint256' }],
    stateMutability: 'payable',
  },

  /**
   * updateValuation(uint256 _assetId, uint256 _newValuation)
   * modifier: onlyOwnerOf(_assetId)
   */
  {
    type: 'function',
    name: 'updateValuation',
    inputs: [
      { name: '_assetId', type: 'uint256' },
      { name: '_newValuation', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * transferAsset(address _to, uint256 _assetId)
   * modifier: onlyOwnerOf(_assetId), asset must be Verified
   */
  {
    type: 'function',
    name: 'transferAsset',
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_assetId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * archiveAsset(uint256 _assetId)
   * modifier: onlyOwnerOf(_assetId)
   */
  {
    type: 'function',
    name: 'archiveAsset',
    inputs: [{ name: '_assetId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Write: Verificator Functions ───────────────────────────────────────────

  /**
   * verifyAsset(uint256 _assetId)
   * modifier: onlyVerificator, asset must be Pending
   * Distributes escrow: 80% → verificator, 20% → owner (SuperAdmin)
   */
  {
    type: 'function',
    name: 'verifyAsset',
    inputs: [{ name: '_assetId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * rejectAsset(uint256 _assetId)
   * modifier: onlyVerificator, asset must be Pending
   * Refunds entire escrow to original asset owner
   */
  {
    type: 'function',
    name: 'rejectAsset',
    inputs: [{ name: '_assetId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Write: SuperAdmin (owner) Functions ────────────────────────────────────

  /**
   * appointVerificator(address _account)
   * modifier: onlyOwner
   * Sets isVerificator[_account] = true
   */
  {
    type: 'function',
    name: 'appointVerificator',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * removeVerificator(address _account)
   * modifier: onlyOwner
   */
  {
    type: 'function',
    name: 'removeVerificator',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * setValidationFee(uint256 _newFee)
   * modifier: onlyOwner
   */
  {
    type: 'function',
    name: 'setValidationFee',
    inputs: [{ name: '_newFee', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * emergencyWithdraw()
   * modifier: onlyOwner
   * Withdraws all ETH trapped in contract to owner
   */
  {
    type: 'function',
    name: 'emergencyWithdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  /**
   * transferOwnership(address _newOwner)
   * modifier: onlyOwner
   */
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: '_newOwner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Read: View Functions (no gas) ──────────────────────────────────────────

  /**
   * getAssetDetails(uint256 _assetId) → Asset struct
   * Returns the full Asset struct for a given ID
   * O(1) lookup via mapping
   */
  {
    type: 'function',
    name: 'getAssetDetails',
    inputs: [{ name: '_assetId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'assetId', type: 'uint256' },
        { name: 'owner', type: 'address' },
        { name: 'verifiedBy', type: 'address' },
        { name: 'valuation', type: 'uint256' },
        { name: 'registeredAt', type: 'uint256' },
        { name: 'verifiedAt', type: 'uint256' },
        { name: 'category', type: 'uint8' },
        { name: 'state', type: 'uint8' },
        { name: 'documentHash', type: 'string' },
        { name: 'assetName', type: 'string' },
      ],
    }],
    stateMutability: 'view',
  },

  /**
   * getAssetsByOwner(address _owner) → uint256[]
   * Returns array of assetIds owned by an address
   */
  {
    type: 'function',
    name: 'getAssetsByOwner',
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },

  /**
   * getTotalAssets() → uint256
   * Returns total number of assets ever registered (monotonic counter)
   */
  {
    type: 'function',
    name: 'getTotalAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  /**
   * getEscrowBalance(uint256 _assetId) → uint256
   * Returns the ETH amount currently held in escrow for an asset
   */
  {
    type: 'function',
    name: 'getEscrowBalance',
    inputs: [{ name: '_assetId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  /**
   * isVerificator(address) → bool
   * Returns true if address has Verificator role
   */
  {
    type: 'function',
    name: 'isVerificator',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  /**
   * owner() → address
   * Returns the SuperAdmin / deployer address
   */
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },

  /**
   * validationFee() → uint256
   * Current fee in Wei required by registerAsset()
   */
  {
    type: 'function',
    name: 'validationFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  // receive() — contract accepts plain ETH transfers
  { type: 'receive', stateMutability: 'payable' },
] as const;

// ─── TypeScript type for an on-chain Asset struct ────────────────────────────
export interface OnChainAsset {
  assetId: bigint;
  owner: Address;
  verifiedBy: Address;
  valuation: bigint;
  registeredAt: bigint;
  verifiedAt: bigint;
  category: number;  // 0=Property,1=Vehicle,2=Gold,3=Other
  state: number;  // 0=Pending,1=Verified,2=Archived
  documentHash: string;
  assetName: string;
}
