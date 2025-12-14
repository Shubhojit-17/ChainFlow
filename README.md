# ChainFlow Factor

Decentralized, privacy-preserving supply chain invoice financing. Invoices are minted as NFTs, verified (oracle or ZK), funded by a lending pool, and repaid with flat 5% interest distributed to liquidity providers.

## Architecture
- **InvoiceNFT**: Mints invoice NFTs, tracks verification, funded/repaid flags; linked to the lending pool.
- **LendingPool**: Holds liquidity, funds verified invoices, and distributes 5% flat interest to investors on repayment.
- **MockOracle / MockVerifier**: Development-only verification mocks.
- **Frontend (Next.js + wagmi/viem/RainbowKit)**: Investor portal, issuer invoice flow, activity dashboards.

## Prerequisites
- Node.js 18+
- PNPM or NPM
- MetaMask (localhost chain)

## Local Development
### 1) Start Hardhat node
```bash
pnpm compile # or: npx hardhat compile
pnpm node    # or: npx hardhat node
```

### 2) Deploy contracts to localhost
```bash
pnpm deploy  # or: npx hardhat run scripts/deploy.js --network localhost
```
Deployment prints addresses for MockOracle, MockVerifier, InvoiceNFT, and LendingPool.

### 3) Frontend setup
Create `frontend/.env.local` with your WalletConnect project id and the deployed contract addresses. Example keys (use your own values):
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=...
NEXT_PUBLIC_MOCK_VERIFIER_ADDRESS=...
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=...
NEXT_PUBLIC_LENDING_POOL_ADDRESS=...
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```
Install deps and run the app:
```bash
cd frontend
pnpm install # or npm install
pnpm run dev # or npm run dev
```
Open http://localhost:3000 and connect MetaMask to chain 31337.

## Workflows
- **Investor**: Deposit ETH → fund verified invoices → on repayment, 5% interest is distributed to investor balances → withdraw deposit + interest from the pool.
- **Invoice Issuer**: Mint invoice NFT → verify (oracle or ZK mock) → request funding → repay principal + 5%.

## Commands
- Compile: `pnpm compile`
- Tests: `pnpm test`
- Local node: `pnpm node`
- Deploy local: `pnpm deploy`
- Frontend dev: `cd frontend && pnpm dev`

## Notes & Troubleshooting
- If transactions hang, reset MetaMask account (Advanced → Clear activity) and reconnect to chain 31337.
- Kill stale nodes on port 8545 before restarting Hardhat.
- Do **not** commit `.env` or other ignored files (`.next/`, `node_modules/`, `artifacts/`, `cache/`).
