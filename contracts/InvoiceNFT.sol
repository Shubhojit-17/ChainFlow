// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for the Mock Oracle
interface IMockOracle {
    function verifyInvoice(uint256 invoiceId) external returns (bool);
    function getVerificationStatus(uint256 invoiceId) external view returns (bool);
}

// Interface for the Mock ZK Verifier
interface IMockVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) external returns (bool);
}

/**
 * @title InvoiceNFT
 * @author ChainFlow Factor Team
 * @notice ERC721 token representing tokenized invoices for supply chain financing
 * @dev Each NFT represents a real-world invoice that can be:
 *      1. Verified via Oracle (delivery confirmation)
 *      2. Validated via ZK-Proof (privacy-preserving authenticity)
 *      3. Used as collateral for financing from the LendingPool
 */
contract InvoiceNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // ============ Structs ============
    
    /**
     * @notice Represents a tokenized invoice
     * @param amount The invoice amount in wei (or smallest unit)
     * @param dueDate Unix timestamp when the invoice is due
     * @param creator Original creator/owner of the invoice
     * @param isVerified Whether Oracle verification passed
     * @param isZkVerified Whether ZK proof verification passed
     * @param isFunded Whether the invoice has been funded
     * @param isRepaid Whether the loan has been repaid
     * @param createdAt Timestamp when the invoice was minted
     */
    struct Invoice {
        uint256 amount;
        uint256 dueDate;
        address creator;
        bool isVerified;
        bool isZkVerified;
        bool isFunded;
        bool isRepaid;
        uint256 createdAt;
    }

    // ============ State Variables ============
    
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @notice Reference to the Mock Oracle contract
    IMockOracle public oracle;
    
    /// @notice Reference to the Mock ZK Verifier contract
    IMockVerifier public zkVerifier;
    
    /// @notice Address of the LendingPool contract (authorized to update funding status)
    address public lendingPool;
    
    /// @notice Mapping from token ID to Invoice data
    mapping(uint256 => Invoice) public invoices;
    
    /// @notice Mapping from creator address to their invoice token IDs
    mapping(address => uint256[]) public creatorInvoices;

    // ============ Events ============
    
    /// @notice Emitted when a new invoice NFT is minted
    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount,
        uint256 dueDate,
        string tokenURI
    );
    
    /// @notice Emitted when an invoice is verified via Oracle
    event OracleVerificationCompleted(uint256 indexed tokenId, bool success);
    
    /// @notice Emitted when a ZK privacy proof is accepted
    event PrivacyProofAccepted(uint256 indexed tokenId, uint256 publicInput);
    
    /// @notice Emitted when an invoice funding status changes
    event InvoiceFundingStatusChanged(uint256 indexed tokenId, bool isFunded);
    
    /// @notice Emitted when an invoice is marked as repaid
    event InvoiceRepaid(uint256 indexed tokenId);
    
    /// @notice Emitted when the LendingPool address is updated
    event LendingPoolUpdated(address indexed oldPool, address indexed newPool);

    // ============ Modifiers ============
    
    /// @notice Restricts function to LendingPool contract only
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "InvoiceNFT: caller is not the lending pool");
        _;
    }
    
    /// @notice Ensures the token exists
    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "InvoiceNFT: token does not exist");
        _;
    }

    // ============ Constructor ============
    
    /**
     * @notice Initializes the InvoiceNFT contract
     * @param _oracle Address of the MockOracle contract
     * @param _zkVerifier Address of the MockVerifier contract
     */
    constructor(
        address _oracle,
        address _zkVerifier
    ) ERC721("ChainFlow Invoice", "CFINV") Ownable(msg.sender) {
        require(_oracle != address(0), "InvoiceNFT: oracle is zero address");
        require(_zkVerifier != address(0), "InvoiceNFT: verifier is zero address");
        
        oracle = IMockOracle(_oracle);
        zkVerifier = IMockVerifier(_zkVerifier);
        _tokenIdCounter = 0;
    }

    // ============ External Functions ============
    
    /**
     * @notice Mints a new Invoice NFT
     * @dev Creates a new NFT representing a tokenized invoice
     * @param amount The invoice amount in wei
     * @param dueDate Unix timestamp for invoice due date
     * @param _tokenURI IPFS URI pointing to invoice metadata
     * @return tokenId The ID of the newly minted token
     */
    function mintInvoice(
        uint256 amount,
        uint256 dueDate,
        string calldata _tokenURI
    ) external nonReentrant returns (uint256 tokenId) {
        require(amount > 0, "InvoiceNFT: amount must be greater than zero");
        require(dueDate > block.timestamp, "InvoiceNFT: due date must be in the future");
        require(bytes(_tokenURI).length > 0, "InvoiceNFT: token URI cannot be empty");
        
        // Increment and get new token ID
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;
        
        // Mint the NFT to the sender
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Store invoice data
        invoices[tokenId] = Invoice({
            amount: amount,
            dueDate: dueDate,
            creator: msg.sender,
            isVerified: false,
            isZkVerified: false,
            isFunded: false,
            isRepaid: false,
            createdAt: block.timestamp
        });
        
        // Track creator's invoices
        creatorInvoices[msg.sender].push(tokenId);
        
        emit InvoiceMinted(tokenId, msg.sender, amount, dueDate, _tokenURI);
        
        return tokenId;
    }
    
    /**
     * @notice Verifies an invoice using the Oracle
     * @dev Calls the MockOracle to simulate delivery verification
     *      In production, this triggers a Chainlink Function
     * @param tokenId The ID of the invoice to verify
     */
    function verifyWithOracle(uint256 tokenId) external tokenExists(tokenId) nonReentrant {
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.isVerified, "InvoiceNFT: invoice already verified");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "InvoiceNFT: caller not authorized"
        );
        
        // Call the oracle for verification
        bool success = oracle.verifyInvoice(tokenId);
        
        if (success) {
            invoice.isVerified = true;
        }
        
        emit OracleVerificationCompleted(tokenId, success);
    }
    
    /**
     * @notice Verifies an invoice using a Zero-Knowledge proof
     * @dev Validates the ZK-SNARK proof that proves invoice validity
     *      without revealing sensitive buyer information
     * @param tokenId The ID of the invoice to verify
     * @param a First element of the Groth16 proof
     * @param b Second element of the Groth16 proof
     * @param c Third element of the Groth16 proof
     * @param input Public inputs (hash of buyer ID + salt)
     */
    function verifyWithZK(
        uint256 tokenId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) external tokenExists(tokenId) nonReentrant {
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.isZkVerified, "InvoiceNFT: ZK proof already verified");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "InvoiceNFT: caller not authorized"
        );
        
        // Verify the ZK proof
        bool success = zkVerifier.verifyProof(a, b, c, input);
        require(success, "InvoiceNFT: ZK proof verification failed");
        
        invoice.isZkVerified = true;
        
        emit PrivacyProofAccepted(tokenId, input[0]);
    }

    // ============ LendingPool Functions ============
    
    /**
     * @notice Marks an invoice as funded
     * @dev Only callable by the LendingPool contract
     * @param tokenId The ID of the funded invoice
     */
    function setFunded(uint256 tokenId) external onlyLendingPool tokenExists(tokenId) {
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.isFunded, "InvoiceNFT: already funded");
        
        invoice.isFunded = true;
        emit InvoiceFundingStatusChanged(tokenId, true);
    }
    
    /**
     * @notice Marks an invoice as repaid
     * @dev Only callable by the LendingPool contract
     * @param tokenId The ID of the repaid invoice
     */
    function setRepaid(uint256 tokenId) external onlyLendingPool tokenExists(tokenId) {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.isFunded, "InvoiceNFT: not funded");
        require(!invoice.isRepaid, "InvoiceNFT: already repaid");
        
        invoice.isRepaid = true;
        emit InvoiceRepaid(tokenId);
    }

    // ============ View Functions ============
    
    /**
     * @notice Gets the full invoice data for a token
     * @param tokenId The ID of the invoice
     * @return The Invoice struct
     */
    function getInvoice(uint256 tokenId) external view tokenExists(tokenId) returns (Invoice memory) {
        return invoices[tokenId];
    }
    
    /**
     * @notice Checks if an invoice is ready for funding
     * @dev An invoice must be verified (oracle OR zk) and not already funded
     * @param tokenId The ID of the invoice
     * @return Whether the invoice can be funded
     */
    function isReadyForFunding(uint256 tokenId) external view tokenExists(tokenId) returns (bool) {
        Invoice memory invoice = invoices[tokenId];
        return (invoice.isVerified || invoice.isZkVerified) && !invoice.isFunded && !invoice.isRepaid;
    }
    
    /**
     * @notice Gets all invoice IDs created by an address
     * @param creator The address to query
     * @return Array of token IDs
     */
    function getCreatorInvoices(address creator) external view returns (uint256[] memory) {
        return creatorInvoices[creator];
    }
    
    /**
     * @notice Gets the current token ID counter
     * @return The current counter value
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Sets the LendingPool contract address
     * @dev Only callable by owner
     * @param _lendingPool The address of the LendingPool contract
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "InvoiceNFT: lending pool is zero address");
        address oldPool = lendingPool;
        lendingPool = _lendingPool;
        emit LendingPoolUpdated(oldPool, _lendingPool);
    }
    
    /**
     * @notice Updates the Oracle contract address
     * @dev Only callable by owner
     * @param _oracle The new oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "InvoiceNFT: oracle is zero address");
        oracle = IMockOracle(_oracle);
    }
    
    /**
     * @notice Updates the ZK Verifier contract address
     * @dev Only callable by owner
     * @param _zkVerifier The new verifier address
     */
    function setZkVerifier(address _zkVerifier) external onlyOwner {
        require(_zkVerifier != address(0), "InvoiceNFT: verifier is zero address");
        zkVerifier = IMockVerifier(_zkVerifier);
    }
}
