// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BangBang.sol";

/// @title DeployBangBang - Script Deployment untuk Protokol Bang Bang
/// @notice Digunakan untuk men-deploy kontrak BangBang ke Testnet (Base Sepolia / Ethereum Sepolia).
///
///         ROLE MAPPING Validator sesuai kategori aset:
///           Property → BPN     (Badan Pertanahan Nasional)
///           Vehicle  → Samsat  (Sistem Administrasi Manunggal Satu Atap)
///           Gold     → Pegadaian
///           Other    → Kemenkeu (Kementerian Keuangan)
///
/// @dev Jalankan dengan:
///      forge script script/Deploy.s.sol:DeployBangBang \
///        --rpc-url $RPC_URL \
///        --broadcast \
///        --verify \
///        --etherscan-api-key $ETHERSCAN_API_KEY \
///        -vvvv
///
///      Environment variables yang dibutuhkan (.env):
///        PRIVATE_KEY         = 0x... (private key deployer)
///        RPC_URL             = https://sepolia.base.org
///        ETHERSCAN_API_KEY   = (dari Basescan)

contract DeployBangBang is Script {

    // ── Constants ──────────────────────────────────────────────────────────────

    /// @notice Biaya validasi awal = 0.001 ETH dalam Wei
    uint256 constant INITIAL_VALIDATION_FEE = 0.001 ether;

    // ── Demo Validator Addresses (untuk testnet mock) ──────────────────────────
    // Ganti dengan address nyata saat deploying ke mainnet
    address constant DEMO_BPN_VALIDATOR        = address(0); // BPN
    address constant DEMO_SAMSAT_VALIDATOR     = address(0); // Samsat
    address constant DEMO_PEGADAIAN_VALIDATOR  = address(0); // Pegadaian
    address constant DEMO_KEMENKEU_VALIDATOR   = address(0); // Kemenkeu

    function run() external {
        // Ambil private key dari environment variable (aman, tidak hardcode di kode)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("   Bang Bang Protocol - Deployment Script        ");
        console.log("=================================================");
        console.log("Deployer (SuperAdmin):", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Validation Fee:", INITIAL_VALIDATION_FEE, "Wei (0.001 ETH)");
        console.log("-------------------------------------------------");
        console.log("Role Mapping:");
        console.log("  Property (Tanah) -> Validator: BPN");
        console.log("  Vehicle  (Kendaraan) -> Validator: Samsat");
        console.log("  Gold     (Emas) -> Validator: Pegadaian");
        console.log("  Other    (Lainnya) -> Validator: Kemenkeu");
        console.log("-------------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy kontrak utama BangBang
        BangBang bangBang = new BangBang(INITIAL_VALIDATION_FEE);
        console.log("BangBang Contract deployed at:", address(bangBang));

        // 2. Appoint demo validators (hanya jika address non-zero dikonfigurasi)
        //    Signature baru: appointVerificator(address, string institution)
        if (DEMO_BPN_VALIDATOR != address(0)) {
            bangBang.appointVerificator(DEMO_BPN_VALIDATOR, "BPN");
            console.log("  [+] BPN Validator appointed:", DEMO_BPN_VALIDATOR);
        }
        if (DEMO_SAMSAT_VALIDATOR != address(0)) {
            bangBang.appointVerificator(DEMO_SAMSAT_VALIDATOR, "Samsat");
            console.log("  [+] Samsat Validator appointed:", DEMO_SAMSAT_VALIDATOR);
        }
        if (DEMO_PEGADAIAN_VALIDATOR != address(0)) {
            bangBang.appointVerificator(DEMO_PEGADAIAN_VALIDATOR, "Pegadaian");
            console.log("  [+] Pegadaian Validator appointed:", DEMO_PEGADAIAN_VALIDATOR);
        }
        if (DEMO_KEMENKEU_VALIDATOR != address(0)) {
            bangBang.appointVerificator(DEMO_KEMENKEU_VALIDATOR, "Kemenkeu");
            console.log("  [+] Kemenkeu Validator appointed:", DEMO_KEMENKEU_VALIDATOR);
        }

        vm.stopBroadcast();

        // 3. Print deployment summary
        console.log("=================================================");
        console.log("Deployment Summary:");
        console.log("  Contract  :", address(bangBang));
        console.log("  Owner     :", bangBang.owner());
        console.log("  Fee (Wei) :", bangBang.validationFee());
        console.log("=================================================");
        console.log("Next steps:");
        console.log("  1. Copy contract address to frontend/.env.local");
        console.log("  2. Update NEXT_PUBLIC_CONTRACT_ADDRESS");
        console.log("  3. Run: npx wagmi generate (update ABI)");
        console.log("=================================================");
    }
}
