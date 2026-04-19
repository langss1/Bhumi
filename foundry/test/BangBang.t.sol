// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BangBang.sol";
import "../src/models/AssetSchema.sol";

/// @title BangBangTest - Suite Pengujian Lengkap untuk Protokol Bang Bang
/// @notice Mencakup pengujian RBAC, CRUD Aset, Escrow, dan kasus-kasus kegagalan.
/// @dev Jalankan dengan: forge test -vvvv
contract BangBangTest is Test {

    BangBang public bangBang;

    // Pelaku dalam skenario pengujian
    address public superAdmin = address(0x1);
    address public verificator = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public stranger = address(0x5);

    uint256 constant VALIDATION_FEE = 0.001 ether;

    // ==========================================================
    // SETUP
    // ==========================================================

    function setUp() public {
        // Deploy kontrak sebagai superAdmin
        vm.prank(superAdmin);
        bangBang = new BangBang(VALIDATION_FEE);

        // Beri saldo ETH kepada semua pelaku
        vm.deal(superAdmin, 10 ether);
        vm.deal(verificator, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(stranger, 1 ether);
    }

    // ==========================================================
    // RBAC TESTS
    // ==========================================================

    function test_DeployerIsOwner() public view {
        assertEq(bangBang.owner(), superAdmin);
    }

    function test_AppointVerificator_Success() public {
        vm.prank(superAdmin);
        bangBang.appointVerificator(verificator);
        assertTrue(bangBang.isVerificator(verificator));
    }

    function test_AppointVerificator_RevertIfNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert("BangBang: Akses ditolak. Hanya SuperAdmin.");
        bangBang.appointVerificator(verificator);
    }

    function test_RemoveVerificator_Success() public {
        vm.startPrank(superAdmin);
        bangBang.appointVerificator(verificator);
        bangBang.removeVerificator(verificator);
        vm.stopPrank();
        assertFalse(bangBang.isVerificator(verificator));
    }

    // ==========================================================
    // CRUD ASSET TESTS
    // ==========================================================

    function test_RegisterAsset_Success() public {
        vm.prank(user1);
        uint256 assetId = bangBang.registerAsset{value: VALIDATION_FEE}(
            "Villa Dago Pakar",
            AssetCategory.Property,
            850_000 ether,
            "QmHash123abc"
        );

        assertEq(assetId, 1);
        Asset memory asset = bangBang.getAssetDetails(1);
        assertEq(asset.owner, user1);
        assertEq(uint(asset.state), uint(AssetState.Pending));
        assertEq(asset.assetName, "Villa Dago Pakar");
    }

    function test_RegisterAsset_RevertIfInsufficientFee() public {
        vm.prank(user1);
        vm.expectRevert("BangBang: Biaya validasi tidak mencukupi.");
        bangBang.registerAsset{value: 0.0001 ether}(
            "Villa Dago",
            AssetCategory.Property,
            100 ether,
            "QmHash"
        );
    }

    function test_VerifyAsset_Success_AndDistributesFee() public {
        // Setup: daftarkan verifikator dan aset
        vm.prank(superAdmin);
        bangBang.appointVerificator(verificator);

        vm.prank(user1);
        bangBang.registerAsset{value: VALIDATION_FEE}(
            "Gold Bullion",
            AssetCategory.Gold,
            7500 ether,
            "QmGoldHash"
        );

        uint256 verificatorBalanceBefore = verificator.balance;
        uint256 adminBalanceBefore = superAdmin.balance;

        // Verifikasi aset
        vm.prank(verificator);
        bangBang.verifyAsset(1);

        // Periksa state aset
        Asset memory asset = bangBang.getAssetDetails(1);
        assertEq(uint(asset.state), uint(AssetState.Verified));
        assertEq(asset.verifiedBy, verificator);

        // Periksa distribusi fee (80/20)
        uint256 expectedVerificatorFee = (VALIDATION_FEE * 80) / 100;
        uint256 expectedAdminFee = VALIDATION_FEE - expectedVerificatorFee;

        assertEq(verificator.balance, verificatorBalanceBefore + expectedVerificatorFee);
        assertEq(superAdmin.balance, adminBalanceBefore + expectedAdminFee);
    }

    function test_TransferAsset_Success() public {
        // Setup
        vm.prank(superAdmin);
        bangBang.appointVerificator(verificator);

        vm.prank(user1);
        bangBang.registerAsset{value: VALIDATION_FEE}(
            "Porsche 911 GT3",
            AssetCategory.Vehicle,
            220000 ether,
            "QmBPKB"
        );

        vm.prank(verificator);
        bangBang.verifyAsset(1);

        // Transfer aset ke user2
        vm.prank(user1);
        bangBang.transferAsset(user2, 1);

        Asset memory asset = bangBang.getAssetDetails(1);
        assertEq(asset.owner, user2);
    }

    function test_UpdateValuation_Success() public {
        vm.prank(user1);
        bangBang.registerAsset{value: VALIDATION_FEE}(
            "Penthouse Menteng",
            AssetCategory.Property,
            420000 ether,
            "QmPentHash"
        );

        vm.prank(user1);
        bangBang.updateValuation(1, 500000 ether);

        Asset memory asset = bangBang.getAssetDetails(1);
        assertEq(asset.valuation, 500000 ether);
    }

    function test_ArchiveAsset_Success() public {
        vm.prank(user1);
        bangBang.registerAsset{value: VALIDATION_FEE}(
            "Land Parcel A",
            AssetCategory.Property,
            100000 ether,
            "QmSHM"
        );

        vm.prank(user1);
        bangBang.archiveAsset(1);

        Asset memory asset = bangBang.getAssetDetails(1);
        assertEq(uint(asset.state), uint(AssetState.Archived));
    }

    function test_GetAssetsByOwner() public {
        vm.startPrank(user1);
        bangBang.registerAsset{value: VALIDATION_FEE}("Asset A", AssetCategory.Gold, 100 ether, "QmA");
        bangBang.registerAsset{value: VALIDATION_FEE}("Asset B", AssetCategory.Vehicle, 200 ether, "QmB");
        vm.stopPrank();

        uint256[] memory assets = bangBang.getAssetsByOwner(user1);
        assertEq(assets.length, 2);
        assertEq(assets[0], 1);
        assertEq(assets[1], 2);
    }
}
