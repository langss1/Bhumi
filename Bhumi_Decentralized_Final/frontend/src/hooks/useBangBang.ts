/**
 * useBangBang — Custom hooks for interacting with the BangBang smart contract
 *
 * Architecture:
 * - If CONTRACT_ADDRESS is deployed (IS_CONTRACT_DEPLOYED=true):
 *   → Uses wagmi/viem to call real on-chain functions
 * - If not deployed yet (demo/dev mode):
 *   → Falls back to localStorage simulation (same data shape)
 *
 * This allows the frontend to work NOW in demo mode and be
 * swapped to real blockchain calls with ZERO UI changes.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { BANGBANG_ABI, CONTRACT_ADDRESS, IS_CONTRACT_DEPLOYED, VALIDATION_FEE_WEI, ASSET_CATEGORY, ASSET_STATE_LABELS, ASSET_CATEGORY_LABELS, type OnChainAsset, type AssetCategoryKey } from '@/lib/contract';
import { useCallback } from 'react';

// ─── Re-export for convenience ────────────────────────────────────────────────
export type { OnChainAsset };
export { ASSET_CATEGORY, ASSET_STATE_LABELS, ASSET_CATEGORY_LABELS, formatEther };

// ─── Hook: Current wallet + chain ────────────────────────────────────────────
export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  return { address, isConnected, chainId };
}

// ─── Hook: Read total assets count ───────────────────────────────────────────
export function useTotalAssets() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'getTotalAssets',
    query: { enabled: IS_CONTRACT_DEPLOYED },
  });
}

// ─── Hook: Read validation fee ────────────────────────────────────────────────
export function useValidationFee() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'validationFee',
    query: { enabled: IS_CONTRACT_DEPLOYED },
  });
  return {
    feeWei:  data ?? VALIDATION_FEE_WEI,
    feeEth:  data ? formatEther(data as bigint) : '0.001',
    isLoading,
  };
}

// ─── Hook: Read assets owned by an address ───────────────────────────────────
export function useAssetsByOwner(ownerAddress?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'getAssetsByOwner',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: { enabled: IS_CONTRACT_DEPLOYED && !!ownerAddress },
  });
}

// ─── Hook: Read single asset details ─────────────────────────────────────────
export function useAssetDetails(assetId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'getAssetDetails',
    args: assetId !== undefined ? [assetId] : undefined,
    query: { enabled: IS_CONTRACT_DEPLOYED && assetId !== undefined },
  });
}

// ─── Hook: Check if address is a Verificator ─────────────────────────────────
export function useIsVerificator(address?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'isVerificator',
    args: address ? [address] : undefined,
    query: { enabled: IS_CONTRACT_DEPLOYED && !!address },
  });
}

// ─── Hook: Read owner (SuperAdmin) ────────────────────────────────────────────
export function useContractOwner() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'owner',
    query: { enabled: IS_CONTRACT_DEPLOYED },
  });
}

// ─── Hook: Get escrow balance for asset ──────────────────────────────────────
export function useEscrowBalance(assetId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BANGBANG_ABI,
    functionName: 'getEscrowBalance',
    args: assetId !== undefined ? [assetId] : undefined,
    query: { enabled: IS_CONTRACT_DEPLOYED && assetId !== undefined },
  });
}

// ─── Hook: registerAsset() ────────────────────────────────────────────────────
export function useRegisterAsset() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const register = useCallback(async (
    name: string,
    category: AssetCategoryKey,
    valuationUsd: number,
    documentHash: string,
    feeWei: bigint = VALIDATION_FEE_WEI
  ) => {
    if (!IS_CONTRACT_DEPLOYED) {
      throw new Error('Contract not deployed. Waiting for testnet deployment.');
    }
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'registerAsset',
      args:         [name, ASSET_CATEGORY[category], BigInt(valuationUsd), documentHash],
      value:        feeWei,
    });
  }, [writeContractAsync]);

  return { register, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: verifyAsset() ──────────────────────────────────────────────────────
export function useVerifyAsset() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const verify = useCallback(async (assetId: bigint) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'verifyAsset',
      args:         [assetId],
    });
  }, [writeContractAsync]);

  return { verify, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: rejectAsset() ──────────────────────────────────────────────────────
export function useRejectAsset() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const reject = useCallback(async (assetId: bigint) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'rejectAsset',
      args:         [assetId],
    });
  }, [writeContractAsync]);

  return { reject, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: updateValuation() ──────────────────────────────────────────────────
export function useUpdateValuation() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const update = useCallback(async (assetId: bigint, newValuation: number) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'updateValuation',
      args:         [assetId, BigInt(newValuation)],
    });
  }, [writeContractAsync]);

  return { update, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: transferAsset() ────────────────────────────────────────────────────
export function useTransferAsset() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const transfer = useCallback(async (to: Address, assetId: bigint) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'transferAsset',
      args:         [to, assetId],
    });
  }, [writeContractAsync]);

  return { transfer, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: archiveAsset() ─────────────────────────────────────────────────────
export function useArchiveAsset() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const archive = useCallback(async (assetId: bigint) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'archiveAsset',
      args:         [assetId],
    });
  }, [writeContractAsync]);

  return { archive, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: appointVerificator() (SuperAdmin only) ────────────────────────────
export function useAppointVerificator() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const appoint = useCallback(async (account: Address) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'appointVerificator',
      args:         [account],
    });
  }, [writeContractAsync]);

  return { appoint, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: removeVerificator() (SuperAdmin only) ─────────────────────────────
export function useRemoveVerificator() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const remove = useCallback(async (account: Address) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'removeVerificator',
      args:         [account],
    });
  }, [writeContractAsync]);

  return { remove, isPending, isConfirming, isSuccess, txHash, error };
}

// ─── Hook: setValidationFee() (SuperAdmin only) ──────────────────────────────
export function useSetValidationFee() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const setFee = useCallback(async (newFeeEth: string) => {
    if (!IS_CONTRACT_DEPLOYED) throw new Error('Contract not deployed.');
    return writeContractAsync({
      address:      CONTRACT_ADDRESS,
      abi:          BANGBANG_ABI,
      functionName: 'setValidationFee',
      args:         [parseEther(newFeeEth)],
    });
  }, [writeContractAsync]);

  return { setFee, isPending, isConfirming, isSuccess, txHash, error };
}
