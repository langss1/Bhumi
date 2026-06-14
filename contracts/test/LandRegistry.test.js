import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("LandRegistry RBAC and Core Flow", function () {
  let landRegistry;
  let admin, bpnWilayah, notaris, auditor, user1, user2;

  beforeEach(async function () {
    [admin, bpnWilayah, notaris, auditor, user1, user2] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    
    // Assign roles
    const BPN_WILAYAH_ROLE = await landRegistry.BPN_WILAYAH_ROLE();
    const NOTARIS_ROLE = await landRegistry.NOTARIS_ROLE();
    const ADMIN_BPN_ROLE = await landRegistry.ADMIN_BPN_ROLE();

    await landRegistry.grantRole(BPN_WILAYAH_ROLE, bpnWilayah.address);
    await landRegistry.grantRole(NOTARIS_ROLE, notaris.address);
    // admin already has ADMIN_BPN_ROLE from constructor
  });

  it("Should allow BPN Wilayah to request land minting", async function () {
    await expect(
      landRegistry.connect(bpnWilayah).requestLandMinting(
        user1.address,
        "12.34,-56.78",
        1000,
        "NIB-12345",
        ["ipfsHash1"]
      )
    ).to.emit(landRegistry, "LandRequested").withArgs(0, user1.address, "NIB-12345");
  });

  it("Should revert if non-BPN Wilayah tries to request land minting", async function () {
    await expect(
      landRegistry.connect(user1).requestLandMinting(
        user1.address,
        "12.34,-56.78",
        1000,
        "NIB-12345",
        ["ipfsHash1"]
      )
    ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
  });

  it("Should allow Admin BPN to approve land request", async function () {
    await landRegistry.connect(bpnWilayah).requestLandMinting(
      user1.address,
      "12.34,-56.78",
      1000,
      "NIB-12345",
      ["ipfsHash1"]
    );

    await expect(
      landRegistry.connect(admin).approveLandRequest(0)
    ).to.emit(landRegistry, "AssetMinted").withArgs(0, user1.address, "NIB-12345")
     .and.to.emit(landRegistry, "LandApproved").withArgs(0, 0);
  });
});
