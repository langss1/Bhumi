// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is ERC721, AccessControl {
    bytes32 public constant ADMIN_BPN_ROLE = keccak256("ADMIN_BPN_ROLE");
    bytes32 public constant BPN_WILAYAH_ROLE = keccak256("BPN_WILAYAH_ROLE");
    bytes32 public constant NOTARIS_ROLE = keccak256("NOTARIS_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    uint256 private _nextTokenId;

    struct Land {
        string gpsCoordinates;
        uint256 area;
        string nib;
        string[] ipfsHashes; // Index 0: Warkah, 1: Foto Batas, 2+ : AJB
        bool isDisputed;
    }

    struct TransferRequest {
        address seller;
        address buyer;
        address notaris;
        bool sellerApproved;
        bool buyerApproved;
        bool notarisApproved;
        bool isActive;
    }

    mapping(uint256 => Land) public lands;
    mapping(uint256 => TransferRequest) public transferRequests;
    
    // Track ownership history for traceability
    mapping(uint256 => address[]) public ownershipHistory;

    event AssetMinted(uint256 indexed tokenId, address indexed owner, string nib);
    event TransferProposed(uint256 indexed tokenId, address indexed seller, address indexed buyer);
    event BuyerApproved(uint256 indexed tokenId, address indexed buyer);
    event NotarisApproved(uint256 indexed tokenId, address indexed notaris, string ajbIpfsHash);
    event TransferCompleted(uint256 indexed tokenId, address indexed seller, address indexed buyer);
    event EnforcementStatusChanged(uint256 indexed tokenId, bool isDisputed);

    constructor() ERC721("LandToken", "LND") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_BPN_ROLE, msg.sender);
        _grantRole(BPN_WILAYAH_ROLE, msg.sender);
    }

    function mintLand(
        address to,
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes // Warkah, Foto batas, etc
    ) external onlyRole(BPN_WILAYAH_ROLE) {
        uint256 tokenId = _nextTokenId++;
        
        lands[tokenId] = Land({
            gpsCoordinates: gpsCoordinates,
            area: area,
            nib: nib,
            ipfsHashes: ipfsHashes,
            isDisputed: false
        });

        _safeMint(to, tokenId);
        ownershipHistory[tokenId].push(to);

        emit AssetMinted(tokenId, to, nib);
    }

    function proposeTransfer(uint256 tokenId, address buyer) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!lands[tokenId].isDisputed, "Land is in dispute");
        require(!transferRequests[tokenId].isActive, "Active transfer exists");

        transferRequests[tokenId] = TransferRequest({
            seller: msg.sender,
            buyer: buyer,
            notaris: address(0),
            sellerApproved: true,
            buyerApproved: false,
            notarisApproved: false,
            isActive: true
        });

        emit TransferProposed(tokenId, msg.sender, buyer);
    }

    function approveTransferBuyer(uint256 tokenId) external {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "No active transfer");
        require(req.buyer == msg.sender, "Not the buyer");
        require(!lands[tokenId].isDisputed, "Land is in dispute");

        req.buyerApproved = true;
        emit BuyerApproved(tokenId, msg.sender);
    }

    function approveTransferNotaris(uint256 tokenId, string memory ajbIpfsHash) external onlyRole(NOTARIS_ROLE) {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "No active transfer");
        require(req.sellerApproved && req.buyerApproved, "Seller or buyer hasn't approved");
        require(!lands[tokenId].isDisputed, "Land is in dispute");

        req.notaris = msg.sender;
        req.notarisApproved = true;
        
        // Add AJB hash to land records
        lands[tokenId].ipfsHashes.push(ajbIpfsHash);
        
        emit NotarisApproved(tokenId, msg.sender, ajbIpfsHash);

        // Execute transfer
        _executeTransfer(tokenId);
    }

    function _executeTransfer(uint256 tokenId) internal {
        TransferRequest storage req = transferRequests[tokenId];
        address seller = req.seller;
        address buyer = req.buyer;

        req.isActive = false;

        _transfer(seller, buyer, tokenId);
        ownershipHistory[tokenId].push(buyer);

        emit TransferCompleted(tokenId, seller, buyer);
    }

    function cancelTransfer(uint256 tokenId) external {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "No active transfer");
        require(msg.sender == req.seller || msg.sender == req.buyer, "Not authorized");

        req.isActive = false;
    }

    function setEnforcement(uint256 tokenId, bool isDisputed) external {
        require(hasRole(ADMIN_BPN_ROLE, msg.sender), "Not authorized");
        lands[tokenId].isDisputed = isDisputed;

        emit EnforcementStatusChanged(tokenId, isDisputed);
    }

    // Overrides required by Solidity

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function getOwnershipHistory(uint256 tokenId) external view returns (address[] memory) {
        return ownershipHistory[tokenId];
    }
    
    function getLandDetails(uint256 tokenId) external view returns (Land memory) {
        return lands[tokenId];
    }

    function getTotalLands() external view returns (uint256) {
        return _nextTokenId;
    }
}
