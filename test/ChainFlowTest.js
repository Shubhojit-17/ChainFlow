// test/ChainFlowTest.js
// Comprehensive test suite for ChainFlow Factor smart contracts
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainFlow Factor - Complete Test Suite", function () {
  // Contract instances
  let mockOracle;
  let mockVerifier;
  let invoiceNFT;
  let lendingPool;

  // Signers
  let owner;
  let sme; // Small/Medium Enterprise (borrower)
  let investor1;
  let investor2;

  // Test constants
  const INVOICE_AMOUNT = ethers.parseEther("1"); // 1 ETH
  const INVESTOR_DEPOSIT = ethers.parseEther("10"); // 10 ETH
  const INTEREST_RATE_BPS = 500n; // 5%
  const BPS_DENOMINATOR = 10000n;

  // Helper function to get future timestamp
  const getFutureTimestamp = (daysFromNow) => {
    return Math.floor(Date.now() / 1000) + daysFromNow * 24 * 60 * 60;
  };

  // Deploy all contracts before each test suite
  beforeEach(async function () {
    // Get signers
    [owner, sme, investor1, investor2] = await ethers.getSigners();

    // Deploy MockOracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();

    // Deploy MockVerifier
    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();

    // Deploy InvoiceNFT
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy(
      await mockOracle.getAddress(),
      await mockVerifier.getAddress()
    );
    await invoiceNFT.waitForDeployment();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(await invoiceNFT.getAddress());
    await lendingPool.waitForDeployment();

    // Link LendingPool to InvoiceNFT
    await invoiceNFT.setLendingPool(await lendingPool.getAddress());
  });

  // ============ Test Suite 1: MockOracle Tests ============
  describe("MockOracle", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await mockOracle.owner()).to.equal(owner.address);
      expect(await mockOracle.defaultVerificationResult()).to.equal(true);
    });

    it("Should verify invoice and emit event", async function () {
      await expect(mockOracle.verifyInvoice(1))
        .to.emit(mockOracle, "InvoiceVerified")
        .withArgs(1, true);
    });

    it("Should allow owner to set verification result", async function () {
      await mockOracle.setVerificationResult(1, false);
      expect(await mockOracle.getVerificationStatus(1)).to.equal(false);
    });

    it("Should reject non-owner setting verification result", async function () {
      await expect(
        mockOracle.connect(sme).setVerificationResult(1, false)
      ).to.be.revertedWith("MockOracle: caller is not the owner");
    });
  });

  // ============ Test Suite 2: MockVerifier Tests ============
  describe("MockVerifier", function () {
    // Sample ZK proof parameters (mock data)
    const mockProof = {
      a: [1n, 2n],
      b: [[3n, 4n], [5n, 6n]],
      c: [7n, 8n],
      input: [123456789n] // Public input (hash of buyer ID + salt)
    };

    it("Should deploy with alwaysAccept = true", async function () {
      expect(await mockVerifier.alwaysAccept()).to.equal(true);
    });

    it("Should verify proof and emit event", async function () {
      await expect(
        mockVerifier.verifyProof(mockProof.a, mockProof.b, mockProof.c, mockProof.input)
      ).to.emit(mockVerifier, "ProofVerified");
    });

    it("Should increment proof counter after verification", async function () {
      const beforeCount = await mockVerifier.totalProofsVerified();
      await mockVerifier.verifyProof(mockProof.a, mockProof.b, mockProof.c, mockProof.input);
      const afterCount = await mockVerifier.totalProofsVerified();
      expect(afterCount).to.equal(beforeCount + 1n);
    });

    it("Should return true for view verification", async function () {
      const result = await mockVerifier.verifyProofView(
        mockProof.a, mockProof.b, mockProof.c, mockProof.input
      );
      expect(result).to.equal(true);
    });
  });

  // ============ Test Suite 3: InvoiceNFT Tests ============
  describe("InvoiceNFT", function () {
    const tokenURI = "ipfs://QmTestHash123456789";
    const dueDate = getFutureTimestamp(30); // 30 days from now

    describe("Test Case 1: User mints an Invoice NFT", function () {
      it("Should mint invoice NFT successfully", async function () {
        const tx = await invoiceNFT.connect(sme).mintInvoice(
          INVOICE_AMOUNT,
          dueDate,
          tokenURI
        );

        await expect(tx)
          .to.emit(invoiceNFT, "InvoiceMinted")
          .withArgs(1, sme.address, INVOICE_AMOUNT, dueDate, tokenURI);

        // Verify NFT ownership
        expect(await invoiceNFT.ownerOf(1)).to.equal(sme.address);

        // Verify invoice data
        const invoice = await invoiceNFT.getInvoice(1);
        expect(invoice.amount).to.equal(INVOICE_AMOUNT);
        expect(invoice.dueDate).to.equal(dueDate);
        expect(invoice.creator).to.equal(sme.address);
        expect(invoice.isVerified).to.equal(false);
        expect(invoice.isFunded).to.equal(false);
        expect(invoice.isRepaid).to.equal(false);
      });

      it("Should reject zero amount invoice", async function () {
        await expect(
          invoiceNFT.connect(sme).mintInvoice(0, dueDate, tokenURI)
        ).to.be.revertedWith("InvoiceNFT: amount must be greater than zero");
      });

      it("Should reject past due date", async function () {
        const pastDate = Math.floor(Date.now() / 1000) - 1000;
        await expect(
          invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, pastDate, tokenURI)
        ).to.be.revertedWith("InvoiceNFT: due date must be in the future");
      });

      it("Should reject empty token URI", async function () {
        await expect(
          invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, "")
        ).to.be.revertedWith("InvoiceNFT: token URI cannot be empty");
      });

      it("Should correctly track creator invoices", async function () {
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);

        const creatorInvoices = await invoiceNFT.getCreatorInvoices(sme.address);
        expect(creatorInvoices.length).to.equal(2);
        expect(creatorInvoices[0]).to.equal(1);
        expect(creatorInvoices[1]).to.equal(2);
      });
    });

    describe("Test Case 2: Mock Oracle verifies the invoice", function () {
      beforeEach(async function () {
        // Mint an invoice first
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
      });

      it("Should verify invoice via Oracle successfully", async function () {
        const tx = await invoiceNFT.connect(sme).verifyWithOracle(1);

        await expect(tx)
          .to.emit(invoiceNFT, "OracleVerificationCompleted")
          .withArgs(1, true);

        const invoice = await invoiceNFT.getInvoice(1);
        expect(invoice.isVerified).to.equal(true);
      });

      it("Should not allow double verification", async function () {
        await invoiceNFT.connect(sme).verifyWithOracle(1);
        
        await expect(
          invoiceNFT.connect(sme).verifyWithOracle(1)
        ).to.be.revertedWith("InvoiceNFT: invoice already verified");
      });

      it("Should handle failed verification", async function () {
        // Set oracle to return false for this invoice
        await mockOracle.setVerificationResult(2, false);
        
        // Mint and try to verify
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
        await invoiceNFT.connect(sme).verifyWithOracle(2);

        const invoice = await invoiceNFT.getInvoice(2);
        expect(invoice.isVerified).to.equal(false);
      });

      it("Should mark invoice as ready for funding after verification", async function () {
        expect(await invoiceNFT.isReadyForFunding(1)).to.equal(false);
        
        await invoiceNFT.connect(sme).verifyWithOracle(1);
        
        expect(await invoiceNFT.isReadyForFunding(1)).to.equal(true);
      });
    });

    describe("ZK Proof Verification", function () {
      const mockProof = {
        a: [1n, 2n],
        b: [[3n, 4n], [5n, 6n]],
        c: [7n, 8n],
        input: [123456789n]
      };

      beforeEach(async function () {
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
      });

      it("Should verify invoice via ZK proof", async function () {
        const tx = await invoiceNFT.connect(sme).verifyWithZK(
          1,
          mockProof.a,
          mockProof.b,
          mockProof.c,
          mockProof.input
        );

        await expect(tx)
          .to.emit(invoiceNFT, "PrivacyProofAccepted")
          .withArgs(1, mockProof.input[0]);

        const invoice = await invoiceNFT.getInvoice(1);
        expect(invoice.isZkVerified).to.equal(true);
      });

      it("Should make invoice ready for funding after ZK verification", async function () {
        await invoiceNFT.connect(sme).verifyWithZK(
          1,
          mockProof.a,
          mockProof.b,
          mockProof.c,
          mockProof.input
        );

        expect(await invoiceNFT.isReadyForFunding(1)).to.equal(true);
      });
    });
  });

  // ============ Test Suite 4: LendingPool Tests ============
  describe("LendingPool", function () {
    const tokenURI = "ipfs://QmTestHash123456789";
    const dueDate = getFutureTimestamp(30);

    describe("Test Case 3: Investor deposits 10 ETH into LendingPool", function () {
      it("Should accept deposit and update balances", async function () {
        const initialBalance = await ethers.provider.getBalance(await lendingPool.getAddress());
        
        const tx = await lendingPool.connect(investor1).deposit({ value: INVESTOR_DEPOSIT });

        await expect(tx)
          .to.emit(lendingPool, "Deposited")
          .withArgs(investor1.address, INVESTOR_DEPOSIT, INVESTOR_DEPOSIT);

        // Check investor balance
        expect(await lendingPool.investorBalances(investor1.address))
          .to.equal(INVESTOR_DEPOSIT);

        // Check pool liquidity
        expect(await lendingPool.totalLiquidity()).to.equal(INVESTOR_DEPOSIT);

        // Check contract balance
        const finalBalance = await ethers.provider.getBalance(await lendingPool.getAddress());
        expect(finalBalance - initialBalance).to.equal(INVESTOR_DEPOSIT);
      });

      it("Should track multiple investors", async function () {
        await lendingPool.connect(investor1).deposit({ value: INVESTOR_DEPOSIT });
        await lendingPool.connect(investor2).deposit({ value: ethers.parseEther("5") });

        expect(await lendingPool.getInvestorCount()).to.equal(2);
        expect(await lendingPool.isInvestor(investor1.address)).to.equal(true);
        expect(await lendingPool.isInvestor(investor2.address)).to.equal(true);
      });

      it("Should reject deposits below minimum", async function () {
        const belowMinimum = ethers.parseEther("0.001");
        await expect(
          lendingPool.connect(investor1).deposit({ value: belowMinimum })
        ).to.be.revertedWith("LendingPool: deposit below minimum");
      });

      it("Should allow withdrawals", async function () {
        await lendingPool.connect(investor1).deposit({ value: INVESTOR_DEPOSIT });
        
        const withdrawAmount = ethers.parseEther("5");
        const balanceBefore = await ethers.provider.getBalance(investor1.address);
        
        const tx = await lendingPool.connect(investor1).withdraw(withdrawAmount);
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        
        const balanceAfter = await ethers.provider.getBalance(investor1.address);
        
        // Check balance increased (minus gas)
        expect(balanceAfter + gasUsed - balanceBefore).to.equal(withdrawAmount);
      });
    });

    describe("Test Case 4: LendingPool funds the Invoice", function () {
      beforeEach(async function () {
        // Setup: Mint and verify an invoice
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
        await invoiceNFT.connect(sme).verifyWithOracle(1);
        
        // Investor deposits funds
        await lendingPool.connect(investor1).deposit({ value: INVESTOR_DEPOSIT });
      });

      it("Should fund verified invoice and transfer ETH to borrower", async function () {
        const smeBalanceBefore = await ethers.provider.getBalance(sme.address);
        const poolBalanceBefore = await ethers.provider.getBalance(await lendingPool.getAddress());

        // Fund the invoice
        const tx = await lendingPool.fundInvoice(1);
        
        // Calculate expected interest
        const expectedInterest = (INVOICE_AMOUNT * INTEREST_RATE_BPS) / BPS_DENOMINATOR;

        await expect(tx)
          .to.emit(lendingPool, "InvoiceFunded")
          .withArgs(1, sme.address, INVOICE_AMOUNT, expectedInterest);

        // Check SME balance increased
        const smeBalanceAfter = await ethers.provider.getBalance(sme.address);
        expect(smeBalanceAfter - smeBalanceBefore).to.equal(INVOICE_AMOUNT);

        // Check pool balance decreased
        const poolBalanceAfter = await ethers.provider.getBalance(await lendingPool.getAddress());
        expect(poolBalanceBefore - poolBalanceAfter).to.equal(INVOICE_AMOUNT);

        // Verify invoice is marked as funded
        const invoice = await invoiceNFT.getInvoice(1);
        expect(invoice.isFunded).to.equal(true);

        // Verify loan record
        const loan = await lendingPool.getLoan(1);
        expect(loan.borrower).to.equal(sme.address);
        expect(loan.principal).to.equal(INVOICE_AMOUNT);
        expect(loan.isActive).to.equal(true);
      });

      it("Should reject funding unverified invoice", async function () {
        // Mint new unverified invoice
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
        
        await expect(lendingPool.fundInvoice(2))
          .to.be.revertedWith("LendingPool: invoice not verified");
      });

      it("Should reject funding already funded invoice", async function () {
        await lendingPool.fundInvoice(1);
        
        await expect(lendingPool.fundInvoice(1))
          .to.be.revertedWith("LendingPool: invoice already funded");
      });

      it("Should reject funding with insufficient liquidity", async function () {
        // Mint a large invoice
        const largeAmount = ethers.parseEther("100");
        await invoiceNFT.connect(sme).mintInvoice(largeAmount, dueDate, tokenURI);
        await invoiceNFT.connect(sme).verifyWithOracle(2);
        
        await expect(lendingPool.fundInvoice(2))
          .to.be.revertedWith("LendingPool: insufficient liquidity");
      });

      it("Should update pool statistics after funding", async function () {
        await lendingPool.fundInvoice(1);
        
        expect(await lendingPool.totalBorrowed()).to.equal(INVOICE_AMOUNT);
        
        const stats = await lendingPool.getPoolStats();
        expect(stats.borrowed).to.equal(INVOICE_AMOUNT);
      });
    });

    describe("Test Case 5: User repays the loan", function () {
      const expectedInterest = (INVOICE_AMOUNT * INTEREST_RATE_BPS) / BPS_DENOMINATOR;
      const totalRepayment = INVOICE_AMOUNT + expectedInterest;

      beforeEach(async function () {
        // Setup: Mint, verify, deposit, and fund
        await invoiceNFT.connect(sme).mintInvoice(INVOICE_AMOUNT, dueDate, tokenURI);
        await invoiceNFT.connect(sme).verifyWithOracle(1);
        await lendingPool.connect(investor1).deposit({ value: INVESTOR_DEPOSIT });
        await lendingPool.fundInvoice(1);
      });

      it("Should repay loan with interest", async function () {
        const poolBalanceBefore = await ethers.provider.getBalance(await lendingPool.getAddress());
        const smeBalanceBefore = await ethers.provider.getBalance(sme.address);

        // Repay the loan
        const tx = await lendingPool.connect(sme).repayLoan(1, { value: totalRepayment });
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        await expect(tx)
          .to.emit(lendingPool, "LoanRepaid")
          .withArgs(1, sme.address, INVOICE_AMOUNT, expectedInterest);

        // Check pool balance increased by total repayment
        const poolBalanceAfter = await ethers.provider.getBalance(await lendingPool.getAddress());
        expect(poolBalanceAfter - poolBalanceBefore).to.equal(totalRepayment);

        // Check SME balance decreased (repayment + gas)
        const smeBalanceAfter = await ethers.provider.getBalance(sme.address);
        expect(smeBalanceBefore - smeBalanceAfter - gasUsed).to.equal(totalRepayment);

        // Verify loan is inactive
        const loan = await lendingPool.getLoan(1);
        expect(loan.isActive).to.equal(false);

        // Verify invoice is marked as repaid
        const invoice = await invoiceNFT.getInvoice(1);
        expect(invoice.isRepaid).to.equal(true);
      });

      it("Should reject repayment from non-borrower", async function () {
        await expect(
          lendingPool.connect(investor1).repayLoan(1, { value: totalRepayment })
        ).to.be.revertedWith("LendingPool: caller is not the borrower");
      });

      it("Should reject insufficient repayment", async function () {
        await expect(
          lendingPool.connect(sme).repayLoan(1, { value: INVOICE_AMOUNT }) // Missing interest
        ).to.be.revertedWith("LendingPool: insufficient repayment amount");
      });

      it("Should refund excess payment", async function () {
        const excessAmount = ethers.parseEther("0.5");
        const paymentWithExcess = totalRepayment + excessAmount;

        const smeBalanceBefore = await ethers.provider.getBalance(sme.address);
        
        const tx = await lendingPool.connect(sme).repayLoan(1, { value: paymentWithExcess });
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const smeBalanceAfter = await ethers.provider.getBalance(sme.address);
        
        // SME should only pay totalRepayment + gas (excess refunded)
        expect(smeBalanceBefore - smeBalanceAfter - gasUsed).to.equal(totalRepayment);
      });

      it("Should update pool statistics after repayment", async function () {
        await lendingPool.connect(sme).repayLoan(1, { value: totalRepayment });

        expect(await lendingPool.totalBorrowed()).to.equal(0);
        expect(await lendingPool.totalInterestEarned()).to.equal(expectedInterest);
        
        const stats = await lendingPool.getPoolStats();
        expect(stats.borrowed).to.equal(0);
        expect(stats.interestEarned).to.equal(expectedInterest);
      });

      it("Should correctly calculate repayment amount", async function () {
        const [principal, interest, total] = await lendingPool.getRepaymentAmount(1);
        
        expect(principal).to.equal(INVOICE_AMOUNT);
        expect(interest).to.equal(expectedInterest);
        expect(total).to.equal(totalRepayment);
      });
    });
  });

  // ============ Integration Tests ============
  describe("Full Flow Integration Test", function () {
    it("Should complete full invoice lifecycle: mint -> verify -> fund -> repay", async function () {
      const tokenURI = "ipfs://QmIntegrationTest";
      const dueDate = getFutureTimestamp(30);
      const invoiceAmount = ethers.parseEther("2");
      const depositAmount = ethers.parseEther("10");

      // Step 1: Investor deposits liquidity
      await lendingPool.connect(investor1).deposit({ value: depositAmount });
      expect(await lendingPool.getAvailableLiquidity()).to.equal(depositAmount);

      // Step 2: SME mints an invoice
      await invoiceNFT.connect(sme).mintInvoice(invoiceAmount, dueDate, tokenURI);
      expect(await invoiceNFT.ownerOf(1)).to.equal(sme.address);

      // Step 3: Oracle verifies the invoice
      await invoiceNFT.connect(sme).verifyWithOracle(1);
      expect((await invoiceNFT.getInvoice(1)).isVerified).to.equal(true);

      // Step 4: LendingPool funds the invoice
      const smeBalanceBefore = await ethers.provider.getBalance(sme.address);
      await lendingPool.fundInvoice(1);
      const smeBalanceAfter = await ethers.provider.getBalance(sme.address);
      expect(smeBalanceAfter - smeBalanceBefore).to.equal(invoiceAmount);

      // Step 5: SME repays the loan with interest
      const expectedInterest = (invoiceAmount * INTEREST_RATE_BPS) / BPS_DENOMINATOR;
      const totalRepayment = invoiceAmount + expectedInterest;
      
      await lendingPool.connect(sme).repayLoan(1, { value: totalRepayment });

      // Final state verification
      const invoice = await invoiceNFT.getInvoice(1);
      expect(invoice.isRepaid).to.equal(true);
      
      const loan = await lendingPool.getLoan(1);
      expect(loan.isActive).to.equal(false);
      
      // Pool should have original deposit + interest earned
      const expectedPoolBalance = depositAmount + expectedInterest;
      expect(await lendingPool.getAvailableLiquidity()).to.equal(expectedPoolBalance);
    });
  });
});
