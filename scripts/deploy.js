// scripts/deploy.js
// Deployment script for ChainFlow Loan Lifecycle Management Platform
// Run with: npx hardhat run scripts/deploy.js --network localhost

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 ChainFlow - Loan Lifecycle Management Platform");
  console.log("================================================");
  console.log("   LMA Edge Hackathon Submission");
  console.log("================================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ============ Step 1: Deploy LoanLifecycle ============
  console.log("1️⃣  Deploying LoanLifecycle (Core State Engine)...");
  const LoanLifecycle = await ethers.getContractFactory("LoanLifecycle");
  const loanLifecycle = await LoanLifecycle.deploy();
  await loanLifecycle.waitForDeployment();
  const loanLifecycleAddress = await loanLifecycle.getAddress();
  console.log("   ✅ LoanLifecycle deployed to:", loanLifecycleAddress);

  // ============ Step 2: Deploy MockOracle (Legacy Support) ============
  console.log("\n2️⃣  Deploying MockOracle (Document Verification Mock)...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy();
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();
  console.log("   ✅ MockOracle deployed to:", mockOracleAddress);

  // ============ Step 3: Deploy MockVerifier (Legacy Support) ============
  console.log("\n3️⃣  Deploying MockVerifier (Attestation Mock)...");
  const MockVerifier = await ethers.getContractFactory("MockVerifier");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log("   ✅ MockVerifier deployed to:", mockVerifierAddress);

  // ============ Step 4: Deploy InvoiceNFT (Legacy Support) ============
  console.log("\n4️⃣  Deploying InvoiceNFT (Legacy Compatibility)...");
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy(mockOracleAddress, mockVerifierAddress);
  await invoiceNFT.waitForDeployment();
  const invoiceNFTAddress = await invoiceNFT.getAddress();
  console.log("   ✅ InvoiceNFT deployed to:", invoiceNFTAddress);

  // ============ Step 5: Deploy LendingPool (Legacy Support) ============
  console.log("\n5️⃣  Deploying LendingPool (Legacy Compatibility)...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(invoiceNFTAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("   ✅ LendingPool deployed to:", lendingPoolAddress);

  // ============ Step 6: Configure Contracts ============
  console.log("\n6️⃣  Configuring contract relationships...");
  const setPoolTx = await invoiceNFT.setLendingPool(lendingPoolAddress);
  await setPoolTx.wait();
  console.log("   ✅ InvoiceNFT linked to LendingPool");

  // Register deployer as Agent Bank
  const registerAgentTx = await loanLifecycle.registerAgentBank(deployer.address);
  await registerAgentTx.wait();
  console.log("   ✅ Deployer registered as Agent Bank");

  // ============ Deployment Summary ============
  console.log("\n================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("================================================\n");
  
  console.log("📋 Contract Addresses:");
  console.log("┌───────────────────┬──────────────────────────────────────────────┐");
  console.log(`│ LoanLifecycle     │ ${loanLifecycleAddress} │`);
  console.log(`│ MockOracle        │ ${mockOracleAddress} │`);
  console.log(`│ MockVerifier      │ ${mockVerifierAddress} │`);
  console.log(`│ InvoiceNFT        │ ${invoiceNFTAddress} │`);
  console.log(`│ LendingPool       │ ${lendingPoolAddress} │`);
  console.log("└───────────────────┴──────────────────────────────────────────────┘\n");

  console.log("📝 Platform Features:");
  console.log("   • Loan Lifecycle State Engine (8 stages)");
  console.log("   • Covenant Monitoring & Compliance Tracking");
  console.log("   • Document Hash Registry");
  console.log("   • ESG & Green Loan Classification");
  console.log("   • Ownership & Participation Tracking\n");

  console.log("🔧 Next Steps:");
  console.log("   1. Run tests: npx hardhat test");
  console.log("   2. Interact via console: npx hardhat console --network localhost");
  console.log("   3. Start frontend: cd frontend && npm run dev\n");

  // Return deployed addresses for programmatic use
  return {
    loanLifecycle: loanLifecycleAddress,
    mockOracle: mockOracleAddress,
    mockVerifier: mockVerifierAddress,
    invoiceNFT: invoiceNFTAddress,
    lendingPool: lendingPoolAddress
  };
}

// Execute deployment
main()
  .then((addresses) => {
    console.log("✨ Deployment script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
