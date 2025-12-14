// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IInvoiceNFT
 * @notice Interface for the InvoiceNFT contract
 */
interface IInvoiceNFT {
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
    
    function getInvoice(uint256 tokenId) external view returns (Invoice memory);
    function ownerOf(uint256 tokenId) external view returns (address);
    function isReadyForFunding(uint256 tokenId) external view returns (bool);
    function setFunded(uint256 tokenId) external;
    function setRepaid(uint256 tokenId) external;
}

/**
 * @title LendingPool
 * @author ChainFlow Factor Team
 * @notice Decentralized lending pool for supply chain invoice financing
 * @dev This contract manages:
 *      1. Investor deposits (ETH)
 *      2. Invoice funding (loans to invoice owners)
 *      3. Loan repayments with interest
 *      4. Interest distribution to liquidity providers
 * 
 *      Interest Model: Flat 5% interest on the invoice amount
 *      This is a simplified model for hackathon purposes.
 *      Production would use dynamic rates based on risk scoring.
 */
contract LendingPool is Ownable, ReentrancyGuard {
    // ============ Constants ============
    
    /// @notice Interest rate in basis points (500 = 5%)
    uint256 public constant INTEREST_RATE_BPS = 500;
    
    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Minimum deposit amount (0.01 ETH)
    uint256 public constant MIN_DEPOSIT = 0.01 ether;

    // ============ State Variables ============
    
    /// @notice Reference to the InvoiceNFT contract
    IInvoiceNFT public invoiceNFT;
    
    /// @notice Total liquidity available in the pool
    uint256 public totalLiquidity;
    
    /// @notice Total amount currently lent out
    uint256 public totalBorrowed;
    
    /// @notice Total interest earned by the pool
    uint256 public totalInterestEarned;
    
    /// @notice Mapping of investor address to their deposited balance
    mapping(address => uint256) public investorBalances;
    
    /// @notice Mapping of token ID to loan information
    mapping(uint256 => Loan) public loans;
    
    /// @notice List of all investors
    address[] public investors;
    
    /// @notice Mapping to check if address is an investor
    mapping(address => bool) public isInvestor;

    // ============ Structs ============
    
    /**
     * @notice Represents an active loan
     * @param borrower Address of the borrower (invoice owner)
     * @param principal Original loan amount
     * @param interestAmount Calculated interest amount
     * @param fundedAt Timestamp when the loan was funded
     * @param isActive Whether the loan is currently active
     */
    struct Loan {
        address borrower;
        uint256 principal;
        uint256 interestAmount;
        uint256 fundedAt;
        bool isActive;
    }

    // ============ Events ============
    
    /// @notice Emitted when an investor deposits ETH
    event Deposited(address indexed investor, uint256 amount, uint256 newBalance);
    
    /// @notice Emitted when an investor withdraws ETH
    event Withdrawn(address indexed investor, uint256 amount, uint256 newBalance);
    
    /// @notice Emitted when an invoice is funded
    event InvoiceFunded(
        uint256 indexed tokenId,
        address indexed borrower,
        uint256 principal,
        uint256 interestAmount
    );
    
    /// @notice Emitted when a loan is repaid
    event LoanRepaid(
        uint256 indexed tokenId,
        address indexed borrower,
        uint256 principal,
        uint256 interestPaid
    );
    
    /// @notice Emitted when the InvoiceNFT contract is updated
    event InvoiceNFTUpdated(address indexed oldAddress, address indexed newAddress);

    // ============ Constructor ============
    
    /**
     * @notice Initializes the LendingPool contract
     * @param _invoiceNFT Address of the InvoiceNFT contract
     */
    constructor(address _invoiceNFT) Ownable(msg.sender) {
        require(_invoiceNFT != address(0), "LendingPool: invoice NFT is zero address");
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
    }

    // ============ Investor Functions ============
    
    /**
     * @notice Deposit ETH into the lending pool
     * @dev Investors earn a share of interest from funded invoices
     */
    function deposit() external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "LendingPool: deposit below minimum");
        
        // Track new investors
        if (!isInvestor[msg.sender]) {
            investors.push(msg.sender);
            isInvestor[msg.sender] = true;
        }
        
        // Update balances
        investorBalances[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        
        emit Deposited(msg.sender, msg.value, investorBalances[msg.sender]);
    }
    
    /**
     * @notice Withdraw ETH from the lending pool
     * @dev Investors can only withdraw their available balance
     *      (deposits not currently lent out)
     * @param amount The amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: amount must be greater than zero");
        require(investorBalances[msg.sender] >= amount, "LendingPool: insufficient balance");
        require(getAvailableLiquidity() >= amount, "LendingPool: insufficient pool liquidity");
        
        // Update balances
        investorBalances[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        // Transfer ETH to investor
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "LendingPool: ETH transfer failed");
        
        emit Withdrawn(msg.sender, amount, investorBalances[msg.sender]);
    }

    // ============ Lending Functions ============
    
    /**
     * @notice Fund a verified invoice
     * @dev Sends the invoice amount to the invoice owner
     *      Only invoices that pass verification can be funded
     * @param tokenId The ID of the invoice NFT to fund
     */
    function fundInvoice(uint256 tokenId) external nonReentrant {
        // Get invoice data
        IInvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        
        // Validation checks
        require(
            invoice.isVerified || invoice.isZkVerified,
            "LendingPool: invoice not verified"
        );
        require(!invoice.isFunded, "LendingPool: invoice already funded");
        require(!invoice.isRepaid, "LendingPool: invoice already repaid");
        require(invoice.amount > 0, "LendingPool: invalid invoice amount");
        
        // Check pool has sufficient liquidity
        uint256 availableLiquidity = getAvailableLiquidity();
        require(availableLiquidity >= invoice.amount, "LendingPool: insufficient liquidity");
        
        // Calculate interest (5% flat rate)
        uint256 interestAmount = (invoice.amount * INTEREST_RATE_BPS) / BPS_DENOMINATOR;
        
        // Get the invoice owner (borrower)
        address borrower = invoiceNFT.ownerOf(tokenId);
        require(borrower != address(0), "LendingPool: invalid borrower");
        
        // Create loan record
        loans[tokenId] = Loan({
            borrower: borrower,
            principal: invoice.amount,
            interestAmount: interestAmount,
            fundedAt: block.timestamp,
            isActive: true
        });
        
        // Update pool state
        totalBorrowed += invoice.amount;
        
        // Mark invoice as funded in the NFT contract
        invoiceNFT.setFunded(tokenId);
        
        // Transfer funds to borrower
        (bool success, ) = payable(borrower).call{value: invoice.amount}("");
        require(success, "LendingPool: ETH transfer to borrower failed");
        
        emit InvoiceFunded(tokenId, borrower, invoice.amount, interestAmount);
    }
    
    /**
     * @notice Repay a loan with interest
     * @dev Borrower must send principal + 5% interest
     *      Interest is distributed proportionally to all investors
     * @param tokenId The ID of the funded invoice
     */
    function repayLoan(uint256 tokenId) external payable nonReentrant {
        Loan storage loan = loans[tokenId];
        
        // Validation
        require(loan.isActive, "LendingPool: no active loan for this invoice");
        require(msg.sender == loan.borrower, "LendingPool: caller is not the borrower");
        
        // Calculate total repayment required
        uint256 totalRepayment = loan.principal + loan.interestAmount;
        require(msg.value >= totalRepayment, "LendingPool: insufficient repayment amount");
        
        // Update loan state
        loan.isActive = false;
        
        // Update pool state
        totalBorrowed -= loan.principal;
        totalLiquidity += loan.principal; // Principal returns to pool
        totalInterestEarned += loan.interestAmount;
        
        // Distribute interest proportionally to all investors
        uint256 interestToDistribute = loan.interestAmount;
        if (totalLiquidity > 0 && investors.length > 0) {
            for (uint256 i = 0; i < investors.length; i++) {
                address investor = investors[i];
                uint256 investorShare = investorBalances[investor];
                if (investorShare > 0) {
                    // Calculate proportional interest share
                    uint256 interestShare = (interestToDistribute * investorShare) / totalLiquidity;
                    investorBalances[investor] += interestShare;
                }
            }
        }
        
        // Interest is added to total liquidity (distributed to pool)
        totalLiquidity += loan.interestAmount;
        
        // Mark invoice as repaid in the NFT contract
        invoiceNFT.setRepaid(tokenId);
        
        // Refund excess payment if any
        uint256 excess = msg.value - totalRepayment;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "LendingPool: refund failed");
        }
        
        emit LoanRepaid(tokenId, msg.sender, loan.principal, loan.interestAmount);
    }

    // ============ View Functions ============
    
    /**
     * @notice Gets the available liquidity in the pool
     * @return The amount of ETH available for lending
     */
    function getAvailableLiquidity() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Gets the total value locked in the pool
     * @return Total ETH (available + lent out)
     */
    function getTotalValueLocked() external view returns (uint256) {
        return totalLiquidity + totalBorrowed;
    }
    
    /**
     * @notice Gets loan details for an invoice
     * @param tokenId The invoice token ID
     * @return The Loan struct
     */
    function getLoan(uint256 tokenId) external view returns (Loan memory) {
        return loans[tokenId];
    }
    
    /**
     * @notice Gets the repayment amount for a loan
     * @param tokenId The invoice token ID
     * @return principal The loan principal
     * @return interest The interest amount
     * @return total The total repayment required
     */
    function getRepaymentAmount(uint256 tokenId) external view returns (
        uint256 principal,
        uint256 interest,
        uint256 total
    ) {
        Loan memory loan = loans[tokenId];
        require(loan.isActive, "LendingPool: no active loan");
        
        return (loan.principal, loan.interestAmount, loan.principal + loan.interestAmount);
    }
    
    /**
     * @notice Gets the number of investors
     * @return The count of unique investors
     */
    function getInvestorCount() external view returns (uint256) {
        return investors.length;
    }
    
    /**
     * @notice Gets pool statistics
     * @return available Available liquidity
     * @return borrowed Total borrowed amount
     * @return interestEarned Total interest earned
     * @return investorCount Number of investors
     */
    function getPoolStats() external view returns (
        uint256 available,
        uint256 borrowed,
        uint256 interestEarned,
        uint256 investorCount
    ) {
        return (
            getAvailableLiquidity(),
            totalBorrowed,
            totalInterestEarned,
            investors.length
        );
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Updates the InvoiceNFT contract address
     * @dev Only callable by owner
     * @param _invoiceNFT The new InvoiceNFT address
     */
    function setInvoiceNFT(address _invoiceNFT) external onlyOwner {
        require(_invoiceNFT != address(0), "LendingPool: invoice NFT is zero address");
        address oldAddress = address(invoiceNFT);
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
        emit InvoiceNFTUpdated(oldAddress, _invoiceNFT);
    }

    // ============ Receive Function ============
    
    /**
     * @notice Allows the contract to receive ETH directly
     * @dev Used for repayments and emergency deposits
     */
    receive() external payable {
        // Accept ETH transfers (e.g., for repayments)
    }
}
