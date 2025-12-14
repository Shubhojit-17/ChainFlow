// scripts/deploy.js
// Deployment script for ChainFlow Factor smart contracts
// Run with: npx hardhat run scripts/deploy.js --network localhost

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 ChainFlow Factor - Smart Contract Deployment");
  console.log("================================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ============ Step 1: Deploy MockOracle ============
  console.log("1️⃣  Deploying MockOracle...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy();
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();
  console.log("   ✅ MockOracle deployed to:", mockOracleAddress);

  // ============ Step 2: Deploy MockVerifier ============
  console.log("\n2️⃣  Deploying MockVerifier...");
  const MockVerifier = await ethers.getContractFactory("MockVerifier");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log("   ✅ MockVerifier deployed to:", mockVerifierAddress);

  // ============ Step 3: Deploy InvoiceNFT ============
  console.log("\n3️⃣  Deploying InvoiceNFT...");
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy(mockOracleAddress, mockVerifierAddress);
  await invoiceNFT.waitForDeployment();
  const invoiceNFTAddress = await invoiceNFT.getAddress();
  console.log("   ✅ InvoiceNFT deployed to:", invoiceNFTAddress);
  console.log("   📎 Linked to Oracle:", mockOracleAddress);
  console.log("   📎 Linked to Verifier:", mockVerifierAddress);

  // ============ Step 4: Deploy LendingPool ============
  console.log("\n4️⃣  Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(invoiceNFTAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("   ✅ LendingPool deployed to:", lendingPoolAddress);
  console.log("   📎 Linked to InvoiceNFT:", invoiceNFTAddress);

  // ============ Step 5: Link LendingPool to InvoiceNFT ============
  console.log("\n5️⃣  Configuring InvoiceNFT with LendingPool address...");
  const setPoolTx = await invoiceNFT.setLendingPool(lendingPoolAddress);
  await setPoolTx.wait();
  console.log("   ✅ InvoiceNFT now recognizes LendingPool");

  // ============ Deployment Summary ============
  console.log("\n================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("================================================\n");
  
  console.log("📋 Contract Addresses:");
  console.log("┌─────────────────┬──────────────────────────────────────────────┐");
  console.log(`│ MockOracle      │ ${mockOracleAddress} │`);
  console.log(`│ MockVerifier    │ ${mockVerifierAddress} │`);
  console.log(`│ InvoiceNFT      │ ${invoiceNFTAddress} │`);
  console.log(`│ LendingPool     │ ${lendingPoolAddress} │`);
  console.log("└─────────────────┴──────────────────────────────────────────────┘\n");

  console.log("📝 Next Steps:");
  console.log("   1. Run tests: npx hardhat test");
  console.log("   2. Interact via console: npx hardhat console --network localhost");
  console.log("   3. Start frontend and connect to these addresses\n");

  // Return deployed addresses for programmatic use
  return {
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
