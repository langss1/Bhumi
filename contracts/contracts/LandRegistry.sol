// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LandRegistry is ERC721, AccessControl, IERC721Receiver {
    bytes32 public constant ADMIN_BPN_ROLE = keccak256("ADMIN_BPN_ROLE");
    bytes32 public constant BPN_WILAYAH_ROLE = keccak256("BPN_WILAYAH_ROLE");
    bytes32 public constant NOTARIS_ROLE = keccak256("NOTARIS_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    uint256 private _nextTokenId;
    uint256 private _requestCount;

    struct Land {
        string gpsCoordinates;
        uint256 area;
        string nib;
        string[] ipfsHashes; 
        bool isDisputed;
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
    mapping(uint256 => LandRequest) public landRequests;
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(uint256 => address[]) public ownershipHistory;

    event AssetMinted(uint256 indexed tokenId, address indexed owner, string nib);
    event LandRequested(uint256 indexed requestId, address indexed to, string nib);
    event LandApproved(uint256 indexed requestId, uint256 indexed tokenId);
    event LandRejected(uint256 indexed requestId);
    event TransferProposed(uint256 indexed tokenId, address indexed seller, address indexed buyer);
    event TransferCompleted(uint256 indexed tokenId, address indexed seller, address indexed buyer);
    event TransferCancelled(uint256 indexed tokenId, address indexed seller);
    event EnforcementStatusChanged(uint256 indexed tokenId, bool isDisputed);

    constructor() ERC721("LandToken", "LND") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_BPN_ROLE, msg.sender);
        _grantRole(BPN_WILAYAH_ROLE, msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // --- ALUR PENDAFTARAN TANAH (REQUEST -> APPROVE) ---

    function requestLandMinting(
        address to,
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes
    ) external onlyRole(BPN_WILAYAH_ROLE) {
        uint256 requestId = _requestCount++;
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
        require(!req.isProcessed && !req.isRejected, "Request already processed");

        req.isProcessed = true;
        uint256 tokenId = _nextTokenId++;
        
        lands[tokenId] = Land(req.gpsCoordinates, req.area, req.nib, req.ipfsHashes, false);
        _safeMint(req.to, tokenId);
        ownershipHistory[tokenId].push(req.to);
        
        emit AssetMinted(tokenId, req.to, req.nib);
        emit LandApproved(requestId, tokenId);
    }

    function rejectLandRequest(uint256 requestId) external onlyRole(ADMIN_BPN_ROLE) {
        LandRequest storage req = landRequests[requestId];
        require(!req.isProcessed && !req.isRejected, "Request already processed");
        
        req.isRejected = true;
        emit LandRejected(requestId);
    }

    // Legacy / Admin Direct Mint
    function mintLand(
        address to,
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes
    ) external onlyRole(ADMIN_BPN_ROLE) {
        uint256 tokenId = _nextTokenId++;
        lands[tokenId] = Land(gpsCoordinates, area, nib, ipfsHashes, false);
        _safeMint(to, tokenId);
        ownershipHistory[tokenId].push(to);
        emit AssetMinted(tokenId, to, nib);
    }

    // --- LOGIK TRANSFER ---

    function proposeTransfer(uint256 tokenId, address buyer) external {
        require(ownerOf(tokenId) == msg.sender, "Bukan pemilik");
        require(!lands[tokenId].isDisputed, "Tanah dalam sengketa");
        require(!transferRequests[tokenId].isActive, "Permohonan aktif sudah ada");

        transferRequests[tokenId] = TransferRequest({
            seller: msg.sender,
            buyer: buyer,
            notaris: address(0),
            sellerApproved: true,
            buyerApproved: false,
            notarisApproved: false,
            isActive: true
        });

        _transfer(msg.sender, address(this), tokenId);
        emit TransferProposed(tokenId, msg.sender, buyer);
    }

    function approveTransferBuyer(uint256 tokenId) external {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "Tiada permohonan aktif");
        require(req.buyer == msg.sender, "Bukan pembeli");
        req.buyerApproved = true;
    }

    function approveTransferNotaris(uint256 tokenId, string memory ajbIpfsHash) external onlyRole(NOTARIS_ROLE) {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "Tiada permohonan aktif");
        require(req.sellerApproved && req.buyerApproved, "Penjual/Pembeli belum setuju");
        require(!lands[tokenId].isDisputed, "Tanah dalam sengketa");

        req.notaris = msg.sender;
        req.notarisApproved = true;
        lands[tokenId].ipfsHashes.push(ajbIpfsHash);

        _executeTransfer(tokenId);
    }

    function _executeTransfer(uint256 tokenId) internal {
        TransferRequest storage req = transferRequests[tokenId];
        address buyer = req.buyer;
        address seller = req.seller;

        req.isActive = false;
        _transfer(address(this), buyer, tokenId);
        ownershipHistory[tokenId].push(buyer);

        emit TransferCompleted(tokenId, seller, buyer);
    }

    function cancelTransfer(uint256 tokenId) external {
        TransferRequest storage req = transferRequests[tokenId];
        require(req.isActive, "Tiada permohonan aktif");
        require(msg.sender == req.seller || hasRole(ADMIN_BPN_ROLE, msg.sender), "Tiada autoriti");

        req.isActive = false;
        _transfer(address(this), req.seller, tokenId);
        emit TransferCancelled(tokenId, req.seller);
    }

    function setEnforcement(uint256 tokenId, bool isDisputed) external onlyRole(ADMIN_BPN_ROLE) {
        lands[tokenId].isDisputed = isDisputed;
        emit EnforcementStatusChanged(tokenId, isDisputed);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // --- HELPERS ---

    function getTokenByNIB(string memory nib) external view returns (uint256 tokenId, bool found) {
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (keccak256(abi.encodePacked(lands[i].nib)) == keccak256(abi.encodePacked(nib))) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function getTotalLands() external view returns (uint256) {
        return _nextTokenId;
    }

    function getTotalRequests() external view returns (uint256) {
        return _requestCount;
    }

    function getLandDetails(uint256 tokenId) external view returns (
        string memory gpsCoordinates,
        uint256 area,
        string memory nib,
        string[] memory ipfsHashes,
        bool isDisputed
    ) {
        Land storage land = lands[tokenId];
        return (land.gpsCoordinates, land.area, land.nib, land.ipfsHashes, land.isDisputed);
    }

    function getRequestDetails(uint256 requestId) external view returns (
        address to,
        string memory nib,
        uint256 area,
        string memory gpsCoordinates,
        bool isProcessed,
        bool isRejected,
        string[] memory ipfsHashes
    ) {
        LandRequest storage req = landRequests[requestId];
        return (req.to, req.nib, req.area, req.gpsCoordinates, req.isProcessed, req.isRejected, req.ipfsHashes);
    }

    function getOwnershipHistory(uint256 tokenId) external view returns (address[] memory) {
        return ownershipHistory[tokenId];
    }
}
