# Team 3 → Teams 1 & 2 Handoff

**Status:** Team 3 deliverables are complete and verified on Avalanche Fuji. This doc tells Teams 1 and 2 what's been built, where it lives, and how to plug it in.

---

## TL;DR for Teams 1 & 2

1. Copy the env block in [§1](#1-env-block-paste-into-your-projects) into your project.
2. Copy the helper libs in [§2](#2-frontend-helper-libs-team-1) into Team 1's `src/lib/`.
3. Use the function signatures in [§3](#3-functions-you-can-call-now) — they all work today against live contracts.
4. Live proof of the full flow in [§4](#4-end-to-end-flow-already-verified-on-chain) — every Snowtrace link is clickable.

---

## 1. Env block (paste into your projects)

```env
NEXT_PUBLIC_MOCK_DNZD_ADDRESS=0x781A1Df150974E8dE40044F08eBdf4a0D7253D19
NEXT_PUBLIC_INVOICE_ADDRESS=0x2cB8295DF6F0B4AadD83686F316250a4f6fF156A
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0x94068b5a38685dEe492e57189C8e8dE9AB4E9653
NEXT_PUBLIC_EAS_ADDRESS=0xf65bC03e69f5C1a295f744c615Fc7Da79B6D0E8F
NEXT_PUBLIC_SCHEMA_UID=0xc50bb95df2ea22c7b91ea506a44e1744cb19be30870bbc433d57c8951ef07d96
```

All five live on **Avalanche Fuji (chain ID 43113)**, RPC `https://api.avax-test.network/ext/bc/C/rpc`.

---

## 2. Frontend helper libs (Team 1)

Team 3 wrote and tested three helper modules. They live at `C:\Users\Anuj0\KiwiContract\lib\`. Copy them into Team 1's Next.js project at `src/lib/`:

| File | What it does |
|---|---|
| `contracts.ts` | ABIs + addresses + `createOnChainInvoice`, `payContractor`, `getDNZDBalance`, `markInvoicePaid` |
| `attestations.ts` | EAS SDK wrappers — `createContractorAttestation`, `hashDocument` |
| `binance-tools.ts` | Read-only market intelligence — `checkMarketHealth`, `checkSocialSentiment` (no API key needed) |

**Important:** these expect an **ethers v6 `Signer`** from the connected wallet. wagmi v2 hands you a viem `WalletClient`, so you need the bridge:

```ts
// src/lib/ethers-adapter.ts (Pothole 7 in the project plan)
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

export function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  const network = { chainId: chain!.id, name: chain!.name };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account!.address);
}
```

Then in any AI tool's `execute`:

```ts
import { useWalletClient } from 'wagmi';
import { walletClientToSigner } from '@/lib/ethers-adapter';
import { payContractor } from '@/lib/contracts';

const { data: walletClient } = useWalletClient();
const signer = walletClientToSigner(walletClient!);
const { txHash } = await payContractor(signer, contractor.wallet_address, 920);
```

---

## 3. Functions you can call now

### Read-only (any provider, no wallet needed)

```ts
getDNZDBalance(provider, address) → "100000.0"  // string in NZD
checkMarketHealth() → { status, pegStable, recommendation, ... }
checkSocialSentiment() → { ... }
```

### Write (needs ethers v6 Signer)

```ts
createOnChainInvoice(signer, contractorAddress, amountNZD, gstAmountNZD, description)
  → { txHash, receipt }

payContractor(signer, contractorAddress, totalAmountNZD)
  → { txHash, receipt }

markInvoicePaid(signer, invoiceId)
  → { txHash, receipt }

createContractorAttestation(signer, contractorAddress, documentHash, civicPassId)
  → attestationUID  // string

hashDocument(content) → "0x..."  // keccak256 helper
```

All amounts are passed as plain numbers in NZD. The libs handle wei conversion (18 decimals).

---

## 4. End-to-end flow already verified on-chain

Team 3 ran the full demo flow against the deployed contracts. Every step has a real Snowtrace tx — judges can click these mid-pitch:

| Step | What happened | Snowtrace |
|---|---|---|
| 1 | Mint 100k dNZD to business treasury | https://testnet.snowtrace.io/tx/0xd75480ab79f7bcfa5750cc5543e8e8cd951b58f02f9ebc2b81ef9a0effbaebc2 |
| 2 | Create invoice ($800 + $120 GST = $920) | https://testnet.snowtrace.io/tx/0xcd3f7b781e1937252708ad4f293db78709a1a7117456131c798715cea7ab6b2b |
| 3 | Transfer 920 dNZD to contractor | https://testnet.snowtrace.io/tx/0x0633d8427f9a70d2c3607c4782b7ad5b938d1b17374cf53c8f3f86db54f3ad6d |
| 4 | Mark invoice paid | https://testnet.snowtrace.io/tx/0x9b7320e97043f3cd68d73116bf981d234f9623034d993ef83a96c0643e863eed |
| 5 | Create EAS attestation | https://testnet.snowtrace.io/tx/0x4f5a9d6933ede262ef46aea031e5226f67ae6ac07c8bd77180924f70ca06e785 |

**Demo contractor wallet** (Sarah): `0x635B5c22889127D976eFeC1160a103f06b5a7Aff` — currently holds 920 dNZD as live proof of payment.

**Business treasury** (Team 3 deployer): `0xD700306E42E545CC7cb22BD99b4a6d362c3CE607` — holds ~1,099,080 dNZD and ~0.39 AVAX. Use this as the "business" wallet for any further demo runs.

---

## 5. Files Team 3 produced

```
C:\Users\Anuj0\KiwiContract\
├── DEPLOYED_ADDRESSES.md        ← live addresses + Snowtrace tx links
├── TEAM3_HANDOFF.md              ← this file
├── PITCH_ROADMAP.md              ← bounty checklist, judge Q&A, future roadmap
│
├── lib/                          ← copy these into Team 1's src/lib/
│   ├── contracts.ts
│   ├── attestations.ts
│   └── binance-tools.ts
│
└── contracts/                    ← Team 3's Hardhat workspace (no need to touch)
    ├── contracts/
    │   ├── MockDNZD.sol          (deployed)
    │   ├── Invoice.sol           (deployed)
    │   └── EASImports.sol        (re-exports SchemaRegistry + EAS, deployed)
    ├── scripts/
    │   ├── deploy.ts             ← initial deploy
    │   ├── deploy-eas.ts         ← EAS-only deploy
    │   ├── new-wallet.ts         ← generates a fresh demo wallet
    │   └── e2e.ts                ← runs the full mint→invoice→pay→attest flow
    ├── skills/
    │   └── contractor-compliance/SKILL.md   ← Binance Skills Hub manifest
    ├── hardhat.config.ts         (Solidity 0.8.20 + 0.8.27, Fuji configured)
    ├── package.json
    └── README.md
```

---

## 6. What Teams 1 & 2 still own

### Team 1 (Frontend)
- **Hour 0–1:** scaffold Next.js, RainbowKit + wagmi v2, Fuji-only chain config (the plan's Pothole 5 example).
- **Hour 1–2:** dashboard skeleton with mock data — contractor list, status badges, invite form.
- **Hour 2–3:** AI chat route at `src/app/api/chat/route.ts` (Vercel AI SDK + Anthropic). Tools: `inviteContractor`, `createInvoice`, `checkTokenHealth`, `processPayment` — wire them to Team 3's helper functions ([§3](#3-functions-you-can-call-now)).
- **Hour 3–4:** swap mock data for Supabase queries (Team 2 supplies); add `<CivicStub>` component.
- **Hour 4–5:** Lumin Sign manual flow — generate PDF, open Lumin link, capture signed doc, hash with `hashDocument()`, call `createContractorAttestation()`.
- **Hour 5–7:** polish, NZ touches (GST toggle, NZD formatting), demo script.

### Team 2 (Backend)
- **Hour 0–0.5:** Supabase project + Auth.
- **Hour 0.5–1.5:** schema (businesses, contractors, invoices, attestations) with RLS — full SQL is in the project plan.
- **Hour 1.5–2.5:** Edge Functions: `invite-contractor`, `update-contractor-status`, `log-payment`.
- **Hour 2.5–3.5:** Next.js API routes that wrap Supabase queries for the AI agent's tools to call.
- **Hour 3.5–5:** integration with Team 1; share Supabase URL + anon key.
- **Hour 5–7:** seed demo data, simple tax summary endpoint (total payments, GST, withholding).

---

## 7. How to keep Team 3 in the loop

If you hit issues during integration, ping Team 3 with:
1. The error message verbatim.
2. Which helper function you were calling.
3. A snippet of the calling code.

Team 3 has scripts to redeploy any contract in ~30 seconds, mint more dNZD on demand, and run another e2e against any contractor address you supply for the live demo.

### Quick reference: re-running anything

```bash
cd C:\Users\Anuj0\KiwiContract\contracts

npm run compile            # recompile contracts
npm run deploy:fuji        # full redeploy (uses ~0.15 AVAX)
npx hardhat run scripts/e2e.ts --network fuji    # rerun the full demo flow
npx hardhat run scripts/new-wallet.ts            # generate another demo wallet
```

---

## 8. What's left across all teams (post-handoff)

| # | Item | Owner |
|---|---|---|
| 1 | Wire env block + helper libs into Next.js | Team 1 |
| 2 | Wire Supabase queries to the AI agent's tool calls | Teams 1 + 2 |
| 3 | Pre-fund a designated demo contractor wallet with dNZD + dust AVAX | Team 3 (give Team 3 the address) |
| 4 | Rehearse 3-minute demo script (in `PITCH_ROADMAP.md`) | All |
| 5 | Submit Binance skill PR to Skills Hub (post-hackathon) | Anyone |
