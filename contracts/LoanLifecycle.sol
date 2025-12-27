// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoanLifecycle
 * @author ChainFlow Team
 * @notice Core contract for managing syndicated loan lifecycle states
 * @dev Implements a state machine for loan progression through defined stages:
 *      Mandated → Credit Approved → Documentation → CP Pending → 
 *      Active → Covenant Monitoring → Amendment → Matured
 * 
 *      This contract serves as the immutable event ledger for loan operations
 *      in the ChainFlow Loan Lifecycle Management Platform.
 */
contract LoanLifecycle is Ownable, ReentrancyGuard {
    // ============ Enums ============
    
    /**
     * @notice Defines the stages in a loan's lifecycle
     */
    enum LoanStage {
        Mandated,           // 0: Agent Bank appointed, mandate letter signed
        CreditApproved,     // 1: Internal credit committee approval
        Documentation,      // 2: Legal documentation drafting
        CPPending,          // 3: Conditions Precedent checklist
        Active,             // 4: Loan drawn, funds disbursed
        CovenantMonitoring, // 5: Ongoing compliance tracking
        Amendment,          // 6: Terms modification in progress
        Matured             // 7: Loan fully repaid, facility closed
    }
    
    /**
     * @notice Defines participant roles in the loan syndicate
     */
    enum ParticipantRole {
        AgentBank,    // Administers the loan, controls lifecycle
        Lender,       // Provides capital, receives interest
        Borrower      // Receives funds, pays interest
    }
    
    /**
     * @notice ESG classification for green/sustainable loans
     */
    enum ESGClassification {
        Standard,           // No ESG classification
        Green,              // Use of proceeds for green projects
        SustainabilityLinked, // Margin linked to ESG KPIs
        Social              // Use of proceeds for social impact
    }
    
    /**
     * @notice Covenant compliance status
     */
    enum CovenantStatus {
        Compliant,   // Within covenant thresholds
        AtRisk,      // Approaching threshold
        Breached     // Threshold violated
    }

    // ============ Structs ============
    
    /**
     * @notice Represents a syndicated loan
     */
    struct Loan {
        bytes32 loanId;                 // Unique identifier
        string facilityName;            // Human-readable name
        uint256 facilityAmount;         // Total facility size in wei
        uint256 createdAt;              // Timestamp of creation
        LoanStage currentStage;         // Current lifecycle stage
        ESGClassification esgClass;     // ESG classification
        address agentBank;              // Administering agent
        address borrower;               // Borrowing entity
        bool isActive;                  // Whether loan is active
    }
    
    /**
     * @notice Represents a loan event recorded on the ledger
     */
    struct LoanEvent {
        bytes32 eventId;
        bytes32 loanId;
        string eventType;
        LoanStage fromStage;
        LoanStage toStage;
        address performedBy;
        uint256 timestamp;
        bytes32 documentHash;           // Optional document hash
        string metadata;                // Additional JSON metadata
    }
    
    /**
     * @notice Represents a lender's participation in a loan
     */
    struct Participation {
        address lender;
        uint256 commitmentAmount;       // Amount committed
        uint256 participationBps;       // Basis points (e.g., 2500 = 25%)
        uint256 joinedAt;
        bool isActive;
    }
    
    /**
     * @notice Represents a covenant definition
     */
    struct Covenant {
        bytes32 covenantId;
        bytes32 loanId;
        string covenantName;            // e.g., "Leverage Ratio"
        uint256 threshold;              // Threshold value (scaled by 1e18)
        string operator;                // "LT", "LTE", "GT", "GTE", "EQ"
        CovenantStatus status;
        uint256 lastTestDate;
        uint256 nextTestDate;
    }

    // ============ State Variables ============
    
    /// @notice Mapping of loan ID to Loan struct
    mapping(bytes32 => Loan) public loans;
    
    /// @notice Array of all loan IDs
    bytes32[] public loanIds;
    
    /// @notice Mapping of loan ID to array of events
    mapping(bytes32 => LoanEvent[]) public loanEvents;
    
    /// @notice Mapping of loan ID to array of participations
    mapping(bytes32 => Participation[]) public loanParticipations;
    
    /// @notice Mapping of loan ID to array of covenants
    mapping(bytes32 => Covenant[]) public loanCovenants;
    
    /// @notice Mapping of addresses to their roles for specific loans
    mapping(bytes32 => mapping(address => ParticipantRole)) public participantRoles;
    
    /// @notice Mapping to check if address is registered as agent bank
    mapping(address => bool) public isAgentBank;
    
    /// @notice Event counter for unique IDs
    uint256 private _eventCounter;
    
    /// @notice Covenant counter for unique IDs
    uint256 private _covenantCounter;
    
    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Events ============
    
    /// @notice Emitted when a new loan is created
    event LoanCreated(
        bytes32 indexed loanId,
        string facilityName,
        uint256 facilityAmount,
        address indexed agentBank,
        address indexed borrower
    );
    
    /// @notice Emitted when a loan stage changes
    event LoanStageAdvanced(
        bytes32 indexed loanId,
        LoanStage indexed fromStage,
        LoanStage indexed toStage,
        address performedBy,
        uint256 timestamp
    );
    
    /// @notice Emitted when a document hash is recorded
    event DocumentHashRecorded(
        bytes32 indexed loanId,
        bytes32 indexed documentHash,
        string documentType,
        address indexed submittedBy,
        uint256 timestamp
    );
    
    /// @notice Emitted when participation is recorded
    event ParticipationRecorded(
        bytes32 indexed loanId,
        address indexed lender,
        uint256 amount,
        uint256 participationBps
    );
    
    /// @notice Emitted when participation is transferred
    event ParticipationTransferred(
        bytes32 indexed loanId,
        address indexed fromLender,
        address indexed toLender,
        uint256 amount
    );
    
    /// @notice Emitted when a covenant is defined
    event CovenantDefined(
        bytes32 indexed loanId,
        bytes32 indexed covenantId,
        string covenantName,
        uint256 threshold
    );
    
    /// @notice Emitted when covenant status changes
    event CovenantStatusChanged(
        bytes32 indexed loanId,
        bytes32 indexed covenantId,
        CovenantStatus fromStatus,
        CovenantStatus toStatus
    );
    
    /// @notice Emitted when ESG classification is set
    event ESGClassificationSet(
        bytes32 indexed loanId,
        ESGClassification classification
    );
    
    /// @notice Emitted for any loan event (generic logging)
    event LoanEventRecorded(
        bytes32 indexed loanId,
        bytes32 indexed eventId,
        string eventType,
        address indexed performedBy
    );

    // ============ Modifiers ============
    
    /// @notice Ensures caller is the agent bank for the loan
    modifier onlyAgentBank(bytes32 loanId) {
        require(
            loans[loanId].agentBank == msg.sender || owner() == msg.sender,
            "LoanLifecycle: caller is not agent bank"
        );
        _;
    }
    
    /// @notice Ensures loan exists
    modifier loanExists(bytes32 loanId) {
        require(loans[loanId].isActive, "LoanLifecycle: loan does not exist");
        _;
    }
    
    /// @notice Ensures caller is a registered agent bank
    modifier onlyRegisteredAgentBank() {
        require(
            isAgentBank[msg.sender] || owner() == msg.sender,
            "LoanLifecycle: caller is not a registered agent bank"
        );
        _;
    }

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        _eventCounter = 0;
        _covenantCounter = 0;
    }

    // ============ Agent Bank Registration ============
    
    /**
     * @notice Registers an address as an agent bank
     * @param agentBank The address to register
     */
    function registerAgentBank(address agentBank) external onlyOwner {
        require(agentBank != address(0), "LoanLifecycle: invalid address");
        isAgentBank[agentBank] = true;
    }
    
    /**
     * @notice Removes agent bank registration
     * @param agentBank The address to unregister
     */
    function unregisterAgentBank(address agentBank) external onlyOwner {
        isAgentBank[agentBank] = false;
    }

    // ============ Loan Management ============
    
    /**
     * @notice Creates a new loan in Mandated stage
     * @param facilityName Human-readable facility name
     * @param facilityAmount Total facility size in wei
     * @param borrower Address of the borrowing entity
     * @return loanId The unique identifier for the created loan
     */
    function createLoan(
        string calldata facilityName,
        uint256 facilityAmount,
        address borrower
    ) external onlyRegisteredAgentBank nonReentrant returns (bytes32 loanId) {
        require(bytes(facilityName).length > 0, "LoanLifecycle: empty facility name");
        require(facilityAmount > 0, "LoanLifecycle: invalid amount");
        require(borrower != address(0), "LoanLifecycle: invalid borrower");
        
        // Generate unique loan ID
        loanId = keccak256(
            abi.encodePacked(facilityName, facilityAmount, borrower, block.timestamp, msg.sender)
        );
        
        require(!loans[loanId].isActive, "LoanLifecycle: loan already exists");
        
        // Create loan
        loans[loanId] = Loan({
            loanId: loanId,
            facilityName: facilityName,
            facilityAmount: facilityAmount,
            createdAt: block.timestamp,
            currentStage: LoanStage.Mandated,
            esgClass: ESGClassification.Standard,
            agentBank: msg.sender,
            borrower: borrower,
            isActive: true
        });
        
        loanIds.push(loanId);
        
        // Set roles
        participantRoles[loanId][msg.sender] = ParticipantRole.AgentBank;
        participantRoles[loanId][borrower] = ParticipantRole.Borrower;
        
        // Record creation event
        _recordEvent(loanId, "LOAN_CREATED", LoanStage.Mandated, LoanStage.Mandated, bytes32(0), "");
        
        emit LoanCreated(loanId, facilityName, facilityAmount, msg.sender, borrower);
        
        return loanId;
    }
    
    /**
     * @notice Advances a loan to the next lifecycle stage
     * @param loanId The loan to advance
     * @param notes Optional notes about the transition
     */
    function advanceStage(
        bytes32 loanId,
        string calldata notes
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        Loan storage loan = loans[loanId];
        LoanStage currentStage = loan.currentStage;
        
        require(currentStage != LoanStage.Matured, "LoanLifecycle: loan already matured");
        
        // Determine next stage
        LoanStage nextStage;
        if (currentStage == LoanStage.Mandated) {
            nextStage = LoanStage.CreditApproved;
        } else if (currentStage == LoanStage.CreditApproved) {
            nextStage = LoanStage.Documentation;
        } else if (currentStage == LoanStage.Documentation) {
            nextStage = LoanStage.CPPending;
        } else if (currentStage == LoanStage.CPPending) {
            nextStage = LoanStage.Active;
        } else if (currentStage == LoanStage.Active) {
            nextStage = LoanStage.CovenantMonitoring;
        } else if (currentStage == LoanStage.CovenantMonitoring) {
            nextStage = LoanStage.Matured;
        } else if (currentStage == LoanStage.Amendment) {
            nextStage = LoanStage.Active;
        } else {
            revert("LoanLifecycle: invalid stage transition");
        }
        
        loan.currentStage = nextStage;
        
        _recordEvent(loanId, "STAGE_TRANSITION", currentStage, nextStage, bytes32(0), notes);
        
        emit LoanStageAdvanced(loanId, currentStage, nextStage, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Moves a loan into Amendment stage
     * @param loanId The loan to amend
     */
    function initiateAmendment(
        bytes32 loanId
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        Loan storage loan = loans[loanId];
        require(
            loan.currentStage == LoanStage.Active || 
            loan.currentStage == LoanStage.CovenantMonitoring,
            "LoanLifecycle: can only amend active loans"
        );
        
        LoanStage previousStage = loan.currentStage;
        loan.currentStage = LoanStage.Amendment;
        
        _recordEvent(loanId, "AMENDMENT_INITIATED", previousStage, LoanStage.Amendment, bytes32(0), "");
        
        emit LoanStageAdvanced(loanId, previousStage, LoanStage.Amendment, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Marks a loan as matured
     * @param loanId The loan to mature
     */
    function matureLoan(
        bytes32 loanId
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        Loan storage loan = loans[loanId];
        require(
            loan.currentStage == LoanStage.Active || 
            loan.currentStage == LoanStage.CovenantMonitoring,
            "LoanLifecycle: loan not in valid state for maturity"
        );
        
        LoanStage previousStage = loan.currentStage;
        loan.currentStage = LoanStage.Matured;
        
        _recordEvent(loanId, "LOAN_MATURED", previousStage, LoanStage.Matured, bytes32(0), "");
        
        emit LoanStageAdvanced(loanId, previousStage, LoanStage.Matured, msg.sender, block.timestamp);
    }

    // ============ Document Hashing ============
    
    /**
     * @notice Records a document hash on the ledger
     * @param loanId The loan the document belongs to
     * @param documentHash SHA-256 hash of the document
     * @param documentType Type of document (e.g., "MANDATE_LETTER")
     */
    function recordDocumentHash(
        bytes32 loanId,
        bytes32 documentHash,
        string calldata documentType
    ) external loanExists(loanId) nonReentrant {
        require(documentHash != bytes32(0), "LoanLifecycle: invalid hash");
        require(bytes(documentType).length > 0, "LoanLifecycle: empty document type");
        
        // Verify caller is a participant
        require(
            loans[loanId].agentBank == msg.sender ||
            loans[loanId].borrower == msg.sender ||
            _isLender(loanId, msg.sender),
            "LoanLifecycle: not a participant"
        );
        
        _recordEvent(loanId, "DOCUMENT_SUBMITTED", loans[loanId].currentStage, loans[loanId].currentStage, documentHash, documentType);
        
        emit DocumentHashRecorded(loanId, documentHash, documentType, msg.sender, block.timestamp);
    }

    // ============ Participation Management ============
    
    /**
     * @notice Records initial participation in a loan
     * @param loanId The loan
     * @param lender Lender address
     * @param amount Commitment amount
     * @param participationBps Participation percentage in basis points
     */
    function recordParticipation(
        bytes32 loanId,
        address lender,
        uint256 amount,
        uint256 participationBps
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        require(lender != address(0), "LoanLifecycle: invalid lender");
        require(amount > 0, "LoanLifecycle: invalid amount");
        require(participationBps > 0 && participationBps <= BPS_DENOMINATOR, "LoanLifecycle: invalid participation");
        
        loanParticipations[loanId].push(Participation({
            lender: lender,
            commitmentAmount: amount,
            participationBps: participationBps,
            joinedAt: block.timestamp,
            isActive: true
        }));
        
        participantRoles[loanId][lender] = ParticipantRole.Lender;
        
        _recordEvent(loanId, "PARTICIPATION_RECORDED", loans[loanId].currentStage, loans[loanId].currentStage, bytes32(0), "");
        
        emit ParticipationRecorded(loanId, lender, amount, participationBps);
    }
    
    /**
     * @notice Records a participation transfer (secondary trade)
     * @param loanId The loan
     * @param fromLender Selling lender
     * @param toLender Buying lender
     * @param amount Amount transferred
     */
    function recordParticipationTransfer(
        bytes32 loanId,
        address fromLender,
        address toLender,
        uint256 amount
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        require(fromLender != address(0) && toLender != address(0), "LoanLifecycle: invalid addresses");
        require(amount > 0, "LoanLifecycle: invalid amount");
        
        _recordEvent(loanId, "PARTICIPATION_TRANSFER", loans[loanId].currentStage, loans[loanId].currentStage, bytes32(0), "");
        
        emit ParticipationTransferred(loanId, fromLender, toLender, amount);
    }

    // ============ Covenant Management ============
    
    /**
     * @notice Defines a new covenant for a loan
     * @param loanId The loan
     * @param covenantName Name of the covenant
     * @param threshold Threshold value (scaled)
     * @param operator Comparison operator
     * @param nextTestDate Next testing date
     */
    function defineCovenant(
        bytes32 loanId,
        string calldata covenantName,
        uint256 threshold,
        string calldata operator,
        uint256 nextTestDate
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant returns (bytes32 covenantId) {
        require(bytes(covenantName).length > 0, "LoanLifecycle: empty name");
        
        _covenantCounter++;
        covenantId = keccak256(abi.encodePacked(loanId, covenantName, _covenantCounter));
        
        loanCovenants[loanId].push(Covenant({
            covenantId: covenantId,
            loanId: loanId,
            covenantName: covenantName,
            threshold: threshold,
            operator: operator,
            status: CovenantStatus.Compliant,
            lastTestDate: 0,
            nextTestDate: nextTestDate
        }));
        
        emit CovenantDefined(loanId, covenantId, covenantName, threshold);
        
        return covenantId;
    }
    
    /**
     * @notice Updates covenant status after testing
     * @param loanId The loan
     * @param covenantIndex Index of the covenant
     * @param newStatus New compliance status
     */
    function updateCovenantStatus(
        bytes32 loanId,
        uint256 covenantIndex,
        CovenantStatus newStatus
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        require(covenantIndex < loanCovenants[loanId].length, "LoanLifecycle: invalid covenant");
        
        Covenant storage covenant = loanCovenants[loanId][covenantIndex];
        CovenantStatus previousStatus = covenant.status;
        
        covenant.status = newStatus;
        covenant.lastTestDate = block.timestamp;
        
        string memory eventType;
        if (newStatus == CovenantStatus.Breached) {
            eventType = "COVENANT_BREACHED";
        } else if (newStatus == CovenantStatus.AtRisk) {
            eventType = "COVENANT_AT_RISK";
        } else {
            eventType = "COVENANT_COMPLIANT";
        }
        
        _recordEvent(loanId, eventType, loans[loanId].currentStage, loans[loanId].currentStage, covenant.covenantId, "");
        
        emit CovenantStatusChanged(loanId, covenant.covenantId, previousStatus, newStatus);
    }

    // ============ ESG Management ============
    
    /**
     * @notice Sets ESG classification for a loan
     * @param loanId The loan
     * @param classification ESG classification
     */
    function setESGClassification(
        bytes32 loanId,
        ESGClassification classification
    ) external onlyAgentBank(loanId) loanExists(loanId) nonReentrant {
        loans[loanId].esgClass = classification;
        
        _recordEvent(loanId, "ESG_CLASSIFICATION_SET", loans[loanId].currentStage, loans[loanId].currentStage, bytes32(0), "");
        
        emit ESGClassificationSet(loanId, classification);
    }
    
    /**
     * @notice Records an ESG report submission
     * @param loanId The loan
     * @param reportHash Hash of the ESG report
     * @param kpiName Name of the KPI reported
     */
    function recordESGReport(
        bytes32 loanId,
        bytes32 reportHash,
        string calldata kpiName
    ) external loanExists(loanId) nonReentrant {
        require(
            loans[loanId].esgClass != ESGClassification.Standard,
            "LoanLifecycle: not an ESG loan"
        );
        
        _recordEvent(loanId, "ESG_REPORT_SUBMITTED", loans[loanId].currentStage, loans[loanId].currentStage, reportHash, kpiName);
        
        emit DocumentHashRecorded(loanId, reportHash, "ESG_REPORT", msg.sender, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Gets loan details
     * @param loanId The loan ID
     */
    function getLoan(bytes32 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    /**
     * @notice Gets all events for a loan
     * @param loanId The loan ID
     */
    function getLoanEvents(bytes32 loanId) external view returns (LoanEvent[] memory) {
        return loanEvents[loanId];
    }
    
    /**
     * @notice Gets event count for a loan
     * @param loanId The loan ID
     */
    function getLoanEventCount(bytes32 loanId) external view returns (uint256) {
        return loanEvents[loanId].length;
    }
    
    /**
     * @notice Gets all participations for a loan
     * @param loanId The loan ID
     */
    function getLoanParticipations(bytes32 loanId) external view returns (Participation[] memory) {
        return loanParticipations[loanId];
    }
    
    /**
     * @notice Gets all covenants for a loan
     * @param loanId The loan ID
     */
    function getLoanCovenants(bytes32 loanId) external view returns (Covenant[] memory) {
        return loanCovenants[loanId];
    }
    
    /**
     * @notice Gets total loan count
     */
    function getLoanCount() external view returns (uint256) {
        return loanIds.length;
    }
    
    /**
     * @notice Gets loan ID at index
     * @param index The index
     */
    function getLoanIdAtIndex(uint256 index) external view returns (bytes32) {
        require(index < loanIds.length, "LoanLifecycle: index out of bounds");
        return loanIds[index];
    }
    
    /**
     * @notice Checks if address is a participant
     * @param loanId The loan
     * @param participant The address to check
     */
    function isParticipant(bytes32 loanId, address participant) external view returns (bool) {
        return loans[loanId].agentBank == participant ||
               loans[loanId].borrower == participant ||
               _isLender(loanId, participant);
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Records an event to the loan's event log
     */
    function _recordEvent(
        bytes32 loanId,
        string memory eventType,
        LoanStage fromStage,
        LoanStage toStage,
        bytes32 documentHash,
        string memory metadata
    ) internal {
        _eventCounter++;
        bytes32 eventId = keccak256(abi.encodePacked(loanId, eventType, block.timestamp, _eventCounter));
        
        loanEvents[loanId].push(LoanEvent({
            eventId: eventId,
            loanId: loanId,
            eventType: eventType,
            fromStage: fromStage,
            toStage: toStage,
            performedBy: msg.sender,
            timestamp: block.timestamp,
            documentHash: documentHash,
            metadata: metadata
        }));
        
        emit LoanEventRecorded(loanId, eventId, eventType, msg.sender);
    }
    
    /**
     * @notice Checks if address is a lender in the loan
     */
    function _isLender(bytes32 loanId, address addr) internal view returns (bool) {
        Participation[] storage participations = loanParticipations[loanId];
        for (uint256 i = 0; i < participations.length; i++) {
            if (participations[i].lender == addr && participations[i].isActive) {
                return true;
            }
        }
        return false;
    }
}
