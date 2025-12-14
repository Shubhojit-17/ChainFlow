// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @author ChainFlow Factor Team
 * @notice Simulates Chainlink Functions for local Hardhat development
 * @dev This mock replaces Chainlink's decentralized oracle network for testing
 *      In production, this would be replaced with actual Chainlink Functions
 *      that verify delivery status via external shipping APIs (FedEx, UPS, etc.)
 */
contract MockOracle {
    // ============ State Variables ============
    
    /// @notice Contract owner with admin privileges
    address public owner;
    
    /// @notice Mapping of invoice IDs to their verification status
    mapping(uint256 => bool) public invoiceVerificationStatus;
    
    /// @notice Default verification result (true for demo purposes)
    bool public defaultVerificationResult;
    
    /// @notice Tracks if an invoice has been explicitly verified
    mapping(uint256 => bool) public hasBeenVerified;

    // ============ Events ============
    
    /// @notice Emitted when an invoice verification is completed
    /// @param invoiceId The ID of the verified invoice
    /// @param success Whether the verification was successful
    event InvoiceVerified(uint256 indexed invoiceId, bool success);
    
    /// @notice Emitted when the default verification result is changed
    /// @param newDefault The new default verification result
    event DefaultResultChanged(bool newDefault);
    
    /// @notice Emitted when ownership is transferred
    /// @param previousOwner The previous owner address
    /// @param newOwner The new owner address
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============
    
    /// @notice Restricts function access to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "MockOracle: caller is not the owner");
        _;
    }

    // ============ Constructor ============
    
    /// @notice Initializes the MockOracle with default settings
    constructor() {
        owner = msg.sender;
        defaultVerificationResult = true; // Default to true for demo
    }

    // ============ External Functions ============
    
    /**
     * @notice Verifies an invoice's delivery status
     * @dev Simulates an oracle call to an external shipping API
     *      In production, this would trigger a Chainlink Function that:
     *      1. Fetches tracking data from shipping provider
     *      2. Confirms delivery status
     *      3. Returns verification result on-chain
     * @param invoiceId The unique identifier of the invoice to verify
     * @return success Whether the invoice passed verification
     */
    function verifyInvoice(uint256 invoiceId) external returns (bool success) {
        // Check if a specific result was set for this invoice
        if (hasBeenVerified[invoiceId]) {
            success = invoiceVerificationStatus[invoiceId];
        } else {
            // Use the default result
            success = defaultVerificationResult;
            invoiceVerificationStatus[invoiceId] = success;
            hasBeenVerified[invoiceId] = true;
        }
        
        emit InvoiceVerified(invoiceId, success);
        return success;
    }
    
    /**
     * @notice Gets the verification status of an invoice without modifying state
     * @param invoiceId The invoice ID to check
     * @return Whether the invoice is verified
     */
    function getVerificationStatus(uint256 invoiceId) external view returns (bool) {
        if (hasBeenVerified[invoiceId]) {
            return invoiceVerificationStatus[invoiceId];
        }
        return defaultVerificationResult;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Sets the verification result for a specific invoice
     * @dev Only callable by owner - used for testing different scenarios
     * @param invoiceId The invoice ID to configure
     * @param result The verification result to set
     */
    function setVerificationResult(uint256 invoiceId, bool result) external onlyOwner {
        invoiceVerificationStatus[invoiceId] = result;
        hasBeenVerified[invoiceId] = true;
    }
    
    /**
     * @notice Sets the default verification result for new invoices
     * @dev Only callable by owner
     * @param _defaultResult The new default result
     */
    function setDefaultResult(bool _defaultResult) external onlyOwner {
        defaultVerificationResult = _defaultResult;
        emit DefaultResultChanged(_defaultResult);
    }
    
    /**
     * @notice Resets the verification status of an invoice
     * @dev Useful for re-testing verification flows
     * @param invoiceId The invoice ID to reset
     */
    function resetVerification(uint256 invoiceId) external onlyOwner {
        hasBeenVerified[invoiceId] = false;
        invoiceVerificationStatus[invoiceId] = false;
    }
    
    /**
     * @notice Transfers ownership of the contract
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MockOracle: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
