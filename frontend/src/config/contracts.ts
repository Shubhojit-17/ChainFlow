// Contract addresses for local Hardhat deployment
export const CONTRACT_ADDRESSES = {
  MOCK_ORACLE: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  MOCK_VERIFIER: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  INVOICE_NFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  LENDING_POOL: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
} as const;

// Chain configuration for local Hardhat
export const HARDHAT_CHAIN_ID = 31337;

// InvoiceNFT ABI
export const INVOICE_NFT_ABI = [
  {
    "inputs": [{"name": "amount", "type": "uint256"}, {"name": "dueDate", "type": "uint256"}, {"name": "_tokenURI", "type": "string"}],
    "name": "mintInvoice",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "verifyWithOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "tokenId", "type": "uint256"},
      {"name": "a", "type": "uint256[2]"},
      {"name": "b", "type": "uint256[2][2]"},
      {"name": "c", "type": "uint256[2]"},
      {"name": "input", "type": "uint256[1]"}
    ],
    "name": "verifyWithZK",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getInvoice",
    "outputs": [
      {
        "components": [
          {"name": "amount", "type": "uint256"},
          {"name": "dueDate", "type": "uint256"},
          {"name": "creator", "type": "address"},
          {"name": "isVerified", "type": "bool"},
          {"name": "isZkVerified", "type": "bool"},
          {"name": "isFunded", "type": "bool"},
          {"name": "isRepaid", "type": "bool"},
          {"name": "createdAt", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "isReadyForFunding",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentTokenId",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getCreatorInvoices",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "creator", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "dueDate", "type": "uint256"},
      {"indexed": false, "name": "tokenURI", "type": "string"}
    ],
    "name": "InvoiceMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "success", "type": "bool"}
    ],
    "name": "OracleVerificationCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "publicInput", "type": "uint256"}
    ],
    "name": "PrivacyProofAccepted",
    "type": "event"
  }
] as const;

// LendingPool ABI
export const LENDING_POOL_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "fundInvoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableLiquidity",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolStats",
    "outputs": [
      {"name": "available", "type": "uint256"},
      {"name": "borrowed", "type": "uint256"},
      {"name": "interestEarned", "type": "uint256"},
      {"name": "investorCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getLoan",
    "outputs": [
      {
        "components": [
          {"name": "borrower", "type": "address"},
          {"name": "principal", "type": "uint256"},
          {"name": "interestAmount", "type": "uint256"},
          {"name": "fundedAt", "type": "uint256"},
          {"name": "isActive", "type": "bool"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getRepaymentAmount",
    "outputs": [
      {"name": "principal", "type": "uint256"},
      {"name": "interest", "type": "uint256"},
      {"name": "total", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "investorBalances",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalLiquidity",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBorrowed",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalInterestEarned",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "investor", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "newBalance", "type": "uint256"}
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "borrower", "type": "address"},
      {"indexed": false, "name": "principal", "type": "uint256"},
      {"indexed": false, "name": "interestAmount", "type": "uint256"}
    ],
    "name": "InvoiceFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "borrower", "type": "address"},
      {"indexed": false, "name": "principal", "type": "uint256"},
      {"indexed": false, "name": "interestPaid", "type": "uint256"}
    ],
    "name": "LoanRepaid",
    "type": "event"
  }
] as const;

// Interest rate (5%)
export const INTEREST_RATE_PERCENT = 5;
