// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is ERC721, AccessControl {
    bytes32 public constant ADMIN_BPN_ROLE = keccak256("ADMIN_BPN_ROLE");
    bytes32 public constant BPN_WILAYAH_ROLE = keccak256("BPN_WILAYAH_ROLE");
    bytes32 public constant NOTARIS_ROLE = keccak256("NOTARIS_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    uint256 private _tokenIdCounter;
    uint256 private _requestIdCounter;

    struct Land {
        string gpsCoordinates;
        uint256 area;
        string nib;
        string[] ipfsHashes;
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

    struct LandRequest {
        address to;
        string gpsCoordinates;
        uint256 area;
        string nib;
        string[] ipfsHashes;
        bool isProcessed;
        bool isRejected;
    }

    mapping(uint256 => LandRequest) public landRequests;
    mapping(uint256 => Land) public lands;
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(uint256 => address[]) public ownershipHistory;

    event AssetMinted(uint256 indexed tokenId, address indexed owner, string nib);
    event LandRequested(uint256 indexed requestId, address indexed to, string nib);
    event LandApproved(uint256 indexed requestId, uint256 indexed tokenId);
    event LandRejected(uint256 indexed requestId);
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

    function requestLandMinting(
        address to,
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes
    ) external onlyRole(BPN_WILAYAH_ROLE) {
        uint256 requestId = _requestIdCounter++;
        
        landRequests[requestId] = LandRequest({
            to: to,
            gpsCoordinates: gpsCoordinates,
            area: area,
            nib: nib,
            ipfsHashes: ipfsHashes,
            isProcessed: false,
            isRejected: false
        });

        emit LandRequested(requestId, to, nib);
    }

    function approveLandRequest(uint256 requestId) external onlyRole(ADMIN_BPN_ROLE) {
        LandRequest storage req = landRequests[requestId];
        require(!req.isProcessed, "Request already processed");
        require(!req.isRejected, "Request already rejected");

        uint256 tokenId = _tokenIdCounter++;
        
        lands[tokenId] = Land({
            gpsCoordinates: req.gpsCoordinates,
            area: req.area,
            nib: req.nib,
            ipfsHashes: req.ipfsHashes,
            isDisputed: false
        });

        req.isProcessed = true;

        _safeMint(req.to, tokenId);
        ownershipHistory[tokenId].push(req.to);

        emit AssetMinted(tokenId, req.to, req.nib);
        emit LandApproved(requestId, tokenId);
    }

    function rejectLandRequest(uint256 requestId) external onlyRole(ADMIN_BPN_ROLE) {
        LandRequest storage req = landRequests[requestId];
        require(!req.isProcessed, "Request already processed");
        require(!req.isRejected, "Request already rejected");

        req.isRejected = true;
        emit LandRejected(requestId);
    }

    function mintLand(
        address to,
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes
    ) external onlyRole(BPN_WILAYAH_ROLE) {
        uint256 tokenId = _tokenIdCounter++;
        
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
        
        lands[tokenId].ipfsHashes.push(ajbIpfsHash);
        
        emit NotarisApproved(tokenId, msg.sender, ajbIpfsHash);
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
        return _tokenIdCounter;
    }

    function getTotalRequests() external view returns (uint256) {
        return _requestIdCounter;
    }

    function getRequestDetails(uint256 requestId) external view returns (LandRequest memory) {
        return landRequests[requestId];
    }

    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 total = _tokenIdCounter;
        uint256 count = 0;
        for (uint256 i = 0; i < total; i++) {
            try this.ownerOf(i) returns (address tokenOwner) {
                if (tokenOwner == owner) count++;
            } catch {}
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            try this.ownerOf(i) returns (address tokenOwner) {
                if (tokenOwner == owner) {
                    result[idx++] = i;
                }
            } catch {}
        }
        return result;
    }

    function getTokenByNIB(string memory nib) external view returns (uint256 tokenId, bool found) {
        uint256 total = _tokenIdCounter;
        for (uint256 i = 0; i < total; i++) {
            if (keccak256(bytes(lands[i].nib)) == keccak256(bytes(nib))) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function getTransferStatus(uint256 tokenId) external view returns (
        bool isActive,
        address seller,
        address buyer,
        bool sellerApproved,
        bool buyerApproved,
        bool notarisApproved
    ) {
        TransferRequest storage req = transferRequests[tokenId];
        return (
            req.isActive,
            req.seller,
            req.buyer,
            req.sellerApproved,
            req.buyerApproved,
            req.notarisApproved
        );
    }
}
