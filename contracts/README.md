# KiwiContract — Team 3 (Blockchain)

Hardhat workspace for Avalanche Fuji deployments.

## Setup

```bash
cd contracts
npm install
cp .env.example .env
# edit .env: paste DEPLOYER_PRIVATE_KEY funded with Fuji test AVAX
# faucet: https://faucet.avax.network/  (Fuji C-Chain)
```

## Compile + deploy

```bash
npm run compile
npm run deploy:fuji
```

The deploy script prints addresses in `NEXT_PUBLIC_*` env-var form. **Paste those into the team chat immediately** — Teams 1 & 2 are blocked until they have them.

## What's in here

- `contracts/MockDNZD.sol` — ERC-20 dNZD testnet token (1M minted, public `mint`)
- `contracts/Invoice.sol` — on-chain invoice with status enum
- `scripts/deploy.ts` — deploys MockDNZD + Invoice + EAS SchemaRegistry + EAS, registers schema
- `skills/contractor-compliance/SKILL.md` — Binance Skills Hub manifest

## Sibling files (drop into Team 1's Next.js `src/lib/`)

- `../lib/contracts.ts` — addresses, ABIs, helpers (`createOnChainInvoice`, `payContractor`, `getDNZDBalance`, `markInvoicePaid`)
- `../lib/attestations.ts` — EAS SDK wrappers (`createContractorAttestation`, `hashDocument`)
- `../lib/binance-tools.ts` — read-only market intelligence (`checkMarketHealth`, `checkSocialSentiment`)
