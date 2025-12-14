# ChainFlow Factor

## Inspiration
- Supply-chain financing is slow and opaque; we wanted a transparent, on-chain rail where invoices become verifiable, fundable assets.
- SMEs struggle to prove invoice legitimacy and unlock capital quickly—tokenizing invoices with lightweight verification bridges that gap.

## What it does
- Turns invoices into NFTs that carry amount, due date, and state (verified, funded, repaid).
- Verifies invoices via oracle or ZK mock before funding.
- Pools investor liquidity to fund verified invoices and charges a flat 5% interest on repayment.
- Distributes interest proportionally to investor balances; investors can withdraw deposit + earned interest.

## How we built it
- **Smart contracts**: Solidity + Hardhat + OpenZeppelin. Contracts: InvoiceNFT, LendingPool, MockOracle, MockVerifier.
- **Frontend**: Next.js, TypeScript, Tailwind, framer-motion, wagmi/viem, RainbowKit for wallets.
- **Flow**: Issuer mints and verifies → pool funds → issuer repays principal + 5% → pool distributes interest to investors → investors withdraw.

## Challenges we ran into
- Ensuring interest distribution updated actual investor balances (not just virtual shares).
- Keeping contract/ABI addresses in sync across redeploys.
- Handling wallet UX (MetaMask flow, retries, and error surfacing) for funding/repay/withdraw.

## Accomplishments that we're proud of
- Working end-to-end flow: mint → verify → fund → repay with automatic interest distribution → withdraw.
- Simple flat-rate model with clear, proportional interest sharing for investors.
- Clean dual-role UI for issuers and investors in one app.

## What we learned
- Importance of syncing contract addresses and reflecting on-chain balances in the UI.
- Clear error handling and state refresh are critical for multi-step DeFi flows.
- Flat-rate interest keeps UX simple for a demo, while still exercising funding/repay mechanics.

## What's next for ChainFlow Factor
- Real oracle/attestor integrations and production ZK proofs.
- Dynamic risk-based interest rates and tranche-style pools.
- Invoice marketplace filtering by risk/tenor and partial fills.
- Audits, monitoring, and improved wallet/user guidance.
