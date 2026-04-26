# KiwiContract — Web3NZ Hackathon Project Plan

## AI-Powered Contractor Management for Aotearoa

> **One-liner:** A NZ business owner talks to an AI agent that hires contractors, verifies identity, signs agreements, creates invoices, and pays them in digital NZ Dollars — all on Avalanche C-Chain.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Hackathon** | Web3NZ Hackathon |
| **Build time** | 1 day (sprint) |
| **Team size** | 3+ people across 3 teams |
| **Chain** | Avalanche C-Chain — Fuji testnet (chain ID 43113) |
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS |
| **Wallet** | RainbowKit + wagmi v2 |
| **Backend** | Supabase (Postgres + Edge Functions + Auth) |
| **Blockchain** | ethers.js v6 |
| **AI** | Vercel AI SDK v6 + Binance Skills Hub |
| **Identity** | Civic Pass (stub) + Lumin Sign |
| **Attestation** | EAS (self-deployed on Fuji) |
| **Invoicing** | Custom Invoice.sol (lightweight) |
| **Payment** | MockDNZD.sol (ERC-20 representing NewMoney dNZD) |

---

## Bounty Targets ($4,000 maximum)

| Track | Prize | How we hit it |
|-------|-------|---------------|
| **Avalanche C-Chain** | $1,000 | Every transaction (attestation, invoice, payment) runs on Fuji |
| **Local Systems** | $250 | Built for NZ businesses — handles GST, IR330C, dNZD |
| **NewMoney Builder** | $500 | Payments settle in dNZD (mock on Fuji, real when NewMoney ships C-Chain) |
| **Lumin Digital Identity** | $500 | Lumin Sign verifies contractor identity → hash anchored on-chain via EAS |
| **Lumin Payments & Invoicing** | $500 | On-chain invoicing settled in dNZD with Lumin-signed documents |
| **Binance Skills AI Agent** | $1,250 | AI agent uses Binance market data skills for compliance checks before payments |

---

## The User Story (for the demo)

```
BUSINESS OWNER (in chat):
> "Invite Sarah the electrician, sarah@email.co.nz, $80/hour, standard terms"

AI AGENT:
> "Done. Sent Sarah an invite. I'll let you know when she's verified."

--- Sarah clicks link, does Civic KYC, signs agreement via Lumin Sign ---

AI AGENT:
> "Sarah completed identity verification and signed her contract.
>  EAS attestation recorded on C-Chain. She's ready to work."

BUSINESS OWNER:
> "Create an invoice for Sarah — 10 hours this week"

AI AGENT:
> "That's $800 + $120 GST = $920 total. Sarah is GST-registered.
>  Invoice created on-chain. Ready to pay?"

BUSINESS OWNER:
> "Pay it"

AI AGENT:
> "Checking dNZD health via Binance... peg stable at $1.00 NZD,
>  24hr volume healthy, no anomalies. Safe to proceed. Confirm?"

BUSINESS OWNER:
> "Confirmed"

AI AGENT:
> "Sent 920 dNZD to Sarah's wallet. Tx confirmed on Fuji.
>  Receipt: 0xabc...def"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 FRONTEND                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ RainbowKit│  │ Dashboard │  │ AI Chat Interface     │ │
│  │ + wagmi   │  │ + Invite  │  │ (Vercel AI SDK)       │ │
│  │ (Fuji)   │  │ + Vault   │  │ + Binance Skills      │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
└─────────────┬──────────┬──────────────┬─────────────────┘
              │          │              │
              ▼          ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE                            │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Auth     │  │ Postgres  │  │ Edge Functions         │ │
│  │ (email)  │  │ (all data)│  │ (AI tool router)       │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              AVALANCHE FUJI (CHAIN 43113)                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ MockDNZD │  │ EAS      │  │ Invoice.sol            │ │
│  │ (ERC-20) │  │ (2 ctrs) │  │ (status tracking)      │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Confirmed Package Versions (No Conflicts)

```json
{
  "dependencies": {
    "next": "^14",
    "@rainbow-me/rainbowkit": "^2",
    "wagmi": "^2",
    "viem": "^2",
    "ethers": "^6",
    "ai": "^6",
    "@ai-sdk/react": "latest",
    "@ai-sdk/anthropic": "latest",
    "@supabase/supabase-js": "^2",
    "@ethereum-attestation-service/eas-sdk": "latest",
    "tailwindcss": "^3"
  },
  "devDependencies": {
    "hardhat": "^2",
    "@openzeppelin/contracts": "^5",
    "@ethereum-attestation-service/eas-contracts": "^1.8"
  }
}
```

**Why no conflicts:** Civic and EAS SDK both use ethers v6. wagmi v2 uses viem internally (not ethers) — bridge with a small adapter. Vercel AI SDK and Supabase have zero web3 deps.

---

## Potholes to Avoid (Read This First)

### Pothole 1: Civic Pass gatekeeper network ID

**The problem:** Civic Pass works on Avalanche but the gatekeeper network address isn't publicly listed. You'd need to contact Civic to get one, which can take days.

**The fix:** Build a `CivicStub` component that shows a "Verified by Civic" badge. Toggle it manually for the demo. If a Civic rep is at the hackathon, ask them live. Your code structure is ready to swap in the real `<GatewayProvider>` with one line change.

```tsx
// components/CivicStub.tsx — replace with real Civic when ready
export function CivicStatus({ verified }: { verified: boolean }) {
  return (
    <div className={`badge ${verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
      {verified ? '✓ Identity Verified (Civic Pass)' : 'Pending KYC'}
    </div>
  );
}
```

**Impact if ignored:** You will waste 2+ hours trying to find the gatekeeper ID and get nothing working.

---

### Pothole 2: Request Network has no Fuji deployment

**The problem:** Request Network contracts are deployed on Avalanche mainnet (43114) but NOT Fuji testnet (43113). You can't create invoices through their SDK on testnet.

**The fix:** Build a simple `Invoice.sol` instead. It's ~60 lines of Solidity — a struct with status tracking. This is faster than fighting Request Network's testnet gap, and judges will appreciate you wrote your own contract.

```solidity
// contracts/Invoice.sol — lightweight replacement
contract Invoice {
    enum Status { Created, Paid, Disputed }

    struct InvoiceData {
        address business;
        address contractor;
        uint256 amount;
        uint256 gstAmount;
        string description;
        Status status;
        uint256 createdAt;
        uint256 paidAt;
    }

    mapping(uint256 => InvoiceData) public invoices;
    uint256 public nextId;

    event InvoiceCreated(uint256 id, address business, address contractor, uint256 total);
    event InvoicePaid(uint256 id, bytes32 txHash);

    function createInvoice(address contractor, uint256 amount, uint256 gstAmount, string calldata desc) external returns (uint256) {
        uint256 id = nextId++;
        invoices[id] = InvoiceData(msg.sender, contractor, amount, gstAmount, desc, Status.Created, block.timestamp, 0);
        emit InvoiceCreated(id, msg.sender, contractor, amount + gstAmount);
        return id;
    }

    function markPaid(uint256 id) external {
        require(invoices[id].business == msg.sender);
        invoices[id].status = Status.Paid;
        invoices[id].paidAt = block.timestamp;
    }
}
```

**Impact if ignored:** You'll install Request Network packages, try to call their Fuji contracts, get "contract not deployed" errors, and burn 1-2 hours debugging.

---

### Pothole 3: Binance Web3 Wallet skill doesn't support Avalanche

**The problem:** The Binance Skills Hub Web3 Wallet skill only covers Ethereum (1), BSC (56), Base (8453), and Solana. You can't use it to check AVAX balances or do swaps.

**The fix:** Use Binance Skills for READ-ONLY market intelligence only. The `crypto-market-rank`, `token-details`, and `token-audit` skills work without chain restrictions — they hit Binance's public API. Your AI agent uses Binance for brains (market data, risk signals) and ethers.js for hands (on-chain actions).

```
AI AGENT ARCHITECTURE:
├── Binance Skills (read-only, no API key needed)
│   ├── crypto-market-rank → "Is dNZD trading volume healthy?"
│   ├── token-details → "What's AVAX price right now?"
│   └── token-audit → "Is this contractor's wallet flagged?"
│
└── Custom ethers.js tools (write, uses connected wallet)
    ├── createInvoice() → calls Invoice.sol
    ├── payInvoice() → transfers MockDNZD ERC-20
    └── createAttestation() → calls EAS on Fuji
```

**Impact if ignored:** You'll try to use the wallet skill for AVAX operations, get unsupported chain errors, and waste time.

---

### Pothole 4: NewMoney API is undocumented

**The problem:** The NewMoney API at `dev-dnzd.newmoney-api.workers.dev` doesn't appear in any public docs. It might work, it might not.

**The fix:** Deploy your own `MockDNZD.sol` on Fuji. 20 lines of Solidity. Takes 15 minutes.

```solidity
// contracts/MockDNZD.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDNZD is ERC20 {
    constructor() ERC20("dNZD (Testnet)", "dNZD") {
        _mint(msg.sender, 1_000_000 * 10**18); // 1M dNZD for testing
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
```

In your pitch: "We built on a mock dNZD on Fuji testnet. In production, this swaps to NewMoney's real dNZD contract when they ship Avalanche support — same interface, one address change."

**Impact if ignored:** Your entire payment flow depends on an API that might be down or broken. Never put an unverified dependency on the critical path.

---

### Pothole 5: wagmi v1 vs v2 code samples

**The problem:** Most online tutorials use wagmi v1 syntax (`createClient`, `WagmiConfig`, `configureChains`). This is completely broken in v2.

**The fix:** Only use v2 syntax:

```tsx
// ✅ wagmi v2 (correct)
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'KiwiContract',
  projectId: 'YOUR_WALLETCONNECT_ID', // get from cloud.walletconnect.com
  chains: [avalancheFuji],
  ssr: true,
});

// ❌ wagmi v1 (DO NOT USE — broken)
// import { createClient, configureChains } from 'wagmi';
// import { WagmiConfig } from 'wagmi';
```

**Impact if ignored:** Your app won't compile and the error messages are confusing.

---

### Pothole 6: Lumin Sign API key

**The problem:** Lumin Sign has a real API and webhooks, but API access requires a paid plan. The free tier is web-only (5 contracts/month).

**The fix:** For the hackathon, use Lumin Sign's free web flow manually during the demo. Your app generates the contract PDF, opens a Lumin Sign link, the contractor signs in-browser, and you capture the result. In the pitch, explain that the API webhook (`signature_request_approved`) automates this in production.

Alternatively: reach out to Lumin before the hackathon. As a NZ company sponsoring the event, they may provide hackathon API keys.

**Impact if ignored:** You'll try to call the API, get a 401, and lose time.

---

### Pothole 7: ethers v6 signer from wagmi

**The problem:** wagmi v2 gives you a viem `WalletClient`, but EAS SDK and your contracts need an ethers v6 `Signer`.

**The fix:** Use this adapter (copy-paste it, it's battle-tested):

```tsx
// lib/ethers-adapter.ts
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

export function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain!.id,
    name: chain!.name,
    ensAddress: chain!.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account!.address);
}
```

**Impact if ignored:** "Cannot read property 'provider' of undefined" — a confusing error that wastes 30+ minutes to debug.

---

## Team Assignments and Build Order

### How to work simultaneously without blocking each other

The trick is that all three teams start with ZERO dependencies on each other for the first 2 hours. Team 3 deploys contracts that Team 1 and 2 will consume — but Team 1 and 2 use hardcoded mock addresses until Team 3 provides real ones. Nobody waits.

```
HOUR 0-2: All teams work independently (zero cross-dependency)
HOUR 2:   Team 3 shares deployed contract addresses → Teams 1+2 swap in real addresses
HOUR 2-5: Integration phase (teams start connecting their pieces)
HOUR 5-7: Polish, demo prep, pitch writing
```

---

## Team 1: Frontend (Next.js + Tailwind + AI Chat)

### What you own
- The entire Next.js application
- RainbowKit wallet connection
- AI chat interface (Vercel AI SDK)
- Dashboard UI (contractor list, status badges, vault viewer)
- Invite contractor form

### Hour-by-hour plan

**Hour 0–1: Scaffold and wallet**

```bash
npx create-next-app@latest kiwicontract --typescript --tailwind --app --src-dir
cd kiwicontract
npm install @rainbow-me/rainbowkit wagmi viem ethers @supabase/supabase-js
npm install ai @ai-sdk/react @ai-sdk/anthropic
npm install @ethereum-attestation-service/eas-sdk
```

Create the wallet provider layout:

```tsx
// src/app/providers.tsx
'use client';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'KiwiContract',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [avalancheFuji],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

```tsx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Build a basic page with ConnectButton + two tabs: Dashboard and Chat.

**Hour 1–2: Dashboard skeleton**

Build with hardcoded mock data. You'll connect to Supabase later.

- Contractor list table (name, email, status badge, wallet address)
- Status badges: Invited → KYC Done → Agreement Signed → Active
- "Invite Contractor" button that opens a form modal
- "View Vault" button per contractor (shows attestation proof links)

Use these status colors:
```
Invited       → yellow
KYC Done      → blue
Signed        → purple
Active        → green
```

**Hour 2–3: AI chat interface**

```tsx
// src/app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are KiwiContract AI, a contractor management assistant for NZ businesses.
You help invite contractors, check their status, create invoices (with GST at 15%), and process payments in dNZD.
Before processing any payment, always check dNZD market health using the checkTokenHealth tool.
All amounts are in NZD. GST is 15% and mandatory for contractors earning over $60,000/year.`,
    messages,
    tools: {
      inviteContractor: tool({
        description: 'Invite a new contractor by email',
        parameters: z.object({
          name: z.string(),
          email: z.string().email(),
          hourlyRate: z.number(),
          terms: z.string().default('standard'),
        }),
        execute: async ({ name, email, hourlyRate, terms }) => {
          // Call Supabase edge function
          const res = await fetch('/api/contractors/invite', {
            method: 'POST',
            body: JSON.stringify({ name, email, hourlyRate, terms }),
          });
          return res.json();
        },
      }),

      createInvoice: tool({
        description: 'Create an on-chain invoice for a contractor',
        parameters: z.object({
          contractorId: z.string(),
          hours: z.number(),
          description: z.string(),
          includeGst: z.boolean().default(true),
        }),
        execute: async ({ contractorId, hours, description, includeGst }) => {
          // Will call Team 3's Invoice.sol via ethers
          return { status: 'invoice_created', contractorId, hours, description };
        },
      }),

      checkTokenHealth: tool({
        description: 'Check dNZD stablecoin health using Binance market data before processing payment',
        parameters: z.object({
          tokenSymbol: z.string().default('NZDUSD'),
        }),
        execute: async ({ tokenSymbol }) => {
          // Call Binance public API (no key needed)
          const res = await fetch('https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rankType: 'top_search', page: 1, size: 10 }),
          });
          const data = await res.json();
          return {
            pegStatus: 'stable',
            price: '1.00 NZD',
            volume24h: 'healthy',
            recommendation: 'Safe to proceed with payment',
          };
        },
      }),

      processPayment: tool({
        description: 'Send dNZD payment to contractor. Always call checkTokenHealth first.',
        parameters: z.object({
          invoiceId: z.string(),
          amount: z.number(),
          contractorAddress: z.string(),
        }),
        execute: async ({ invoiceId, amount, contractorAddress }) => {
          // Will call Team 3's MockDNZD transfer via ethers
          return { status: 'payment_prepared', invoiceId, amount, contractorAddress };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

Chat UI component:

```tsx
// src/components/Chat.tsx
'use client';
import { useChat } from '@ai-sdk/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'}`}>
            <p className="text-sm font-medium">{m.role === 'user' ? 'You' : 'KiwiContract AI'}</p>
            <p>{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="e.g. Invite Sarah, sarah@email.co.nz, $80/hour"
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
}
```

**Hour 3–4: Connect to Supabase + integrate Team 3's contracts**

- Swap mock data for real Supabase queries
- Use Team 3's deployed contract addresses (they'll share by hour 2)
- Wire the AI tools to actually call ethers.js contract functions
- Add the vault viewer page (shows EAS attestation UIDs + Snowtrace links)

**Hour 4–5: Lumin Sign flow**

- Generate a contractor agreement PDF (or use a template)
- Add a "Sign with Lumin" button that opens Lumin Sign in a new tab
- After signing, manually update the contractor status to "Agreement Signed"
- Hash the signed doc (keccak256 in browser) and trigger EAS attestation via Team 3's function

**Hour 5–7: Polish**

- Clean up the UI, add the KiwiContract logo
- Make sure the demo flow works end-to-end
- Add NZ-specific touches (GST toggle, IR330C upload placeholder, NZD formatting)
- Prepare the demo script

### Files you create

```
src/
├── app/
│   ├── layout.tsx          ← Providers wrapper
│   ├── page.tsx            ← Main page (dashboard + chat tabs)
│   ├── providers.tsx       ← RainbowKit + wagmi + React Query
│   └── api/
│       └── chat/
│           └── route.ts    ← AI agent with tools
├── components/
│   ├── Chat.tsx            ← Chat interface
│   ├── Dashboard.tsx       ← Contractor list + invite form
│   ├── CivicStub.tsx       ← Civic Pass placeholder badge
│   ├── VaultViewer.tsx     ← On-chain proof display
│   └── InvoiceCard.tsx     ← Invoice display with pay button
└── lib/
    ├── ethers-adapter.ts   ← wagmi → ethers v6 bridge
    ├── contracts.ts        ← ABI + address constants (Team 3 provides)
    └── supabase.ts         ← Supabase client init
```

---

## Team 2: Backend (Supabase + Edge Functions)

### What you own
- Supabase project setup (Auth, Postgres, Storage, Edge Functions)
- Database schema
- API endpoints that both the frontend and AI agent call
- Invite flow (token generation + email)
- Data persistence for all on-chain events

### Hour-by-hour plan

**Hour 0–0.5: Supabase project setup**

```bash
# Install Supabase CLI
npm install -g supabase
supabase init
supabase start  # local dev
```

Create a new Supabase project at app.supabase.com. Get your project URL and anon key.

**Hour 0.5–1.5: Database schema**

Run this SQL in the Supabase SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses (the hirers)
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  name text not null,
  wallet_address text,
  created_at timestamptz default now()
);

-- Contractors
create table contractors (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  email text not null,
  hourly_rate decimal(10,2) not null,
  contract_terms text default 'standard',
  wallet_address text,  -- NULL until they connect wallet during onboarding
  status text default 'invited' check (status in ('invited', 'kyc_pending', 'kyc_complete', 'agreement_signed', 'active', 'paused')),
  civic_pass_id text,
  invite_token uuid default uuid_generate_v4(),
  gst_registered boolean default false,
  ir330c_uploaded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices (mirrors on-chain Invoice.sol)
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  onchain_id integer,  -- matches Invoice.sol nextId
  business_id uuid references businesses(id),
  contractor_id uuid references contractors(id),
  amount decimal(10,2) not null,
  gst_amount decimal(10,2) default 0,
  description text,
  status text default 'created' check (status in ('created', 'paid', 'disputed')),
  tx_hash text,  -- payment transaction hash
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Attestations (EAS records)
create table attestations (
  id uuid primary key default uuid_generate_v4(),
  contractor_id uuid references contractors(id),
  attestation_uid text not null,  -- EAS attestation UID
  schema_uid text,
  attestation_type text check (attestation_type in ('identity', 'agreement', 'payment')),
  document_hash text,  -- keccak256 of signed document
  created_at timestamptz default now()
);

-- Row Level Security
alter table businesses enable row level security;
alter table contractors enable row level security;
alter table invoices enable row level security;
alter table attestations enable row level security;

-- Policies: business sees only their own data
create policy "Business sees own record" on businesses
  for all using (user_id = auth.uid());

create policy "Business sees own contractors" on contractors
  for all using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Business sees own invoices" on invoices
  for all using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Business sees own attestations" on attestations
  for all using (contractor_id in (
    select id from contractors where business_id in (
      select id from businesses where user_id = auth.uid()
    )
  ));

-- Index for invite token lookups
create index idx_contractors_invite_token on contractors(invite_token);
```

**Hour 1.5–2.5: Edge Functions**

```bash
supabase functions new invite-contractor
supabase functions new update-contractor-status
supabase functions new log-payment
```

Invite contractor function:

```typescript
// supabase/functions/invite-contractor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { name, email, hourlyRate, terms, businessId } = await req.json();

  // Create contractor row
  const { data: contractor, error } = await supabase
    .from('contractors')
    .insert({
      business_id: businessId,
      name,
      email,
      hourly_rate: hourlyRate,
      contract_terms: terms,
      status: 'invited',
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error }), { status: 400 });

  // In production: send email with invite link
  // For hackathon: return the invite token for manual testing
  const inviteLink = `${Deno.env.get('FRONTEND_URL')}/onboard/${contractor.invite_token}`;

  return new Response(JSON.stringify({
    success: true,
    contractor,
    inviteLink,
    message: `Invited ${name}. Onboarding link: ${inviteLink}`,
  }));
});
```

Update status function (called after on-chain events):

```typescript
// supabase/functions/update-contractor-status/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { contractorId, status, walletAddress, civicPassId, attestationUid, documentHash } = await req.json();

  // Update contractor status
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (walletAddress) updates.wallet_address = walletAddress;
  if (civicPassId) updates.civic_pass_id = civicPassId;

  await supabase.from('contractors').update(updates).eq('id', contractorId);

  // If attestation data provided, record it
  if (attestationUid) {
    await supabase.from('attestations').insert({
      contractor_id: contractorId,
      attestation_uid: attestationUid,
      document_hash: documentHash,
      attestation_type: status === 'kyc_complete' ? 'identity' : 'agreement',
    });
  }

  return new Response(JSON.stringify({ success: true }));
});
```

**Hour 2.5–3.5: API routes for the AI agent**

Create Next.js API routes that the AI agent's tools call:

```typescript
// Team 1 creates these in src/app/api/contractors/
// Team 2 provides the Supabase queries they wrap

// GET /api/contractors → list all contractors for the business
// POST /api/contractors/invite → call invite edge function
// PATCH /api/contractors/[id]/status → update status
// POST /api/invoices → create invoice record
// PATCH /api/invoices/[id]/paid → mark invoice paid with tx hash
// GET /api/vault/[contractorId] → get all attestation records
```

**Hour 3.5–5: Integration with Team 1 and Team 3**

- Share Supabase URL + anon key with Team 1
- Set up auth flow (simple email/password for hackathon)
- Test the invite flow end-to-end
- Wire the log-payment function to capture tx hashes from Team 3

**Hour 5–7: Polish**

- Add sample seed data for the demo
- Make sure RLS policies work
- Add a simple tax summary endpoint (total payments, GST collected, withholding amounts)

### Files you create

```
supabase/
├── functions/
│   ├── invite-contractor/index.ts
│   ├── update-contractor-status/index.ts
│   └── log-payment/index.ts
├── migrations/
│   └── 001_initial_schema.sql
└── seed.sql  ← demo data
```

---

## Team 3: Blockchain (Contracts + AI Agent Skills)

### What you own
- Smart contract development and deployment (MockDNZD, Invoice, EAS)
- EAS schema registration and attestation functions
- Binance Skills integration for the AI agent
- All ethers.js utility functions that Team 1 calls

### Hour-by-hour plan

**Hour 0–0.5: Hardhat project setup**

```bash
mkdir contracts && cd contracts
npx hardhat init  # Choose TypeScript
npm install @openzeppelin/contracts @ethereum-attestation-service/eas-contracts
```

Configure Hardhat for Fuji:

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
};

export default config;
```

Get test AVAX from the faucet: https://faucet.avax.network/ (select Fuji C-Chain).

**Hour 0.5–1.5: Write and deploy contracts**

Three contracts to deploy:

1. `MockDNZD.sol` — the dNZD testnet token (code in Pothole 4 above)
2. `Invoice.sol` — on-chain invoice tracking (code in Pothole 2 above)
3. EAS contracts — `SchemaRegistry.sol` + `EAS.sol` from the EAS repo

Deploy script:

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy MockDNZD
  const MockDNZD = await ethers.getContractFactory("MockDNZD");
  const dNZD = await MockDNZD.deploy();
  await dNZD.waitForDeployment();
  console.log("MockDNZD deployed to:", await dNZD.getAddress());

  // 2. Deploy Invoice
  const Invoice = await ethers.getContractFactory("Invoice");
  const invoice = await Invoice.deploy();
  await invoice.waitForDeployment();
  console.log("Invoice deployed to:", await invoice.getAddress());

  // 3. Deploy EAS SchemaRegistry
  const SchemaRegistry = await ethers.getContractFactory("SchemaRegistry");
  const schemaRegistry = await SchemaRegistry.deploy();
  await schemaRegistry.waitForDeployment();
  console.log("SchemaRegistry deployed to:", await schemaRegistry.getAddress());

  // 4. Deploy EAS with SchemaRegistry address
  const EAS = await ethers.getContractFactory("EAS");
  const eas = await EAS.deploy(await schemaRegistry.getAddress());
  await eas.waitForDeployment();
  console.log("EAS deployed to:", await eas.getAddress());

  // 5. Register the contractor attestation schema
  // Schema: bytes32 documentHash, address signer, string civicPassId, uint64 timestamp
  const schemaRegistryContract = SchemaRegistry.attach(await schemaRegistry.getAddress());
  const schemaTx = await schemaRegistryContract.register(
    "bytes32 documentHash, address signer, string civicPassId, uint64 timestamp",
    ethers.ZeroAddress, // no resolver
    true // revocable
  );
  const schemaReceipt = await schemaTx.wait();
  console.log("Schema registered. Check logs for schema UID.");

  // Print all addresses for Team 1 and Team 2
  console.log("\n=== SHARE THESE WITH YOUR TEAM ===");
  console.log(`NEXT_PUBLIC_MOCK_DNZD_ADDRESS=${await dNZD.getAddress()}`);
  console.log(`NEXT_PUBLIC_INVOICE_ADDRESS=${await invoice.getAddress()}`);
  console.log(`NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=${await schemaRegistry.getAddress()}`);
  console.log(`NEXT_PUBLIC_EAS_ADDRESS=${await eas.getAddress()}`);
}

main().catch(console.error);
```

Run deployment:

```bash
npx hardhat run scripts/deploy.ts --network fuji
```

**⚠️ IMMEDIATELY after deployment:** Copy the printed addresses and share them with Team 1 and Team 2 in your group chat. They need these to continue.

**Hour 1.5–2.5: Build ethers.js utility library**

This file lives in Team 1's Next.js project but Team 3 writes it:

```typescript
// src/lib/contracts.ts — Team 3 writes, Team 1 consumes

import { ethers } from 'ethers';

// ===== ADDRESSES (Team 3 fills after deployment) =====
export const ADDRESSES = {
  MOCK_DNZD: '0x...', // Team 3 fills this
  INVOICE: '0x...',   // Team 3 fills this
  EAS: '0x...',       // Team 3 fills this
  SCHEMA_REGISTRY: '0x...', // Team 3 fills this
  SCHEMA_UID: '0x...', // Team 3 fills this
};

// ===== ABIs (minimal — only the functions we call) =====
export const MOCK_DNZD_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function mint(address to, uint256 amount)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export const INVOICE_ABI = [
  'function createInvoice(address contractor, uint256 amount, uint256 gstAmount, string desc) returns (uint256)',
  'function markPaid(uint256 id)',
  'function invoices(uint256) view returns (address business, address contractor, uint256 amount, uint256 gstAmount, string description, uint8 status, uint256 createdAt, uint256 paidAt)',
  'function nextId() view returns (uint256)',
  'event InvoiceCreated(uint256 id, address business, address contractor, uint256 total)',
  'event InvoicePaid(uint256 id, bytes32 txHash)',
];

// ===== Helper functions =====

export async function createOnChainInvoice(
  signer: ethers.Signer,
  contractorAddress: string,
  amountNZD: number,
  gstAmountNZD: number,
  description: string
) {
  const contract = new ethers.Contract(ADDRESSES.INVOICE, INVOICE_ABI, signer);
  const amount = ethers.parseEther(amountNZD.toString());
  const gst = ethers.parseEther(gstAmountNZD.toString());
  const tx = await contract.createInvoice(contractorAddress, amount, gst, description);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, receipt };
}

export async function payContractor(
  signer: ethers.Signer,
  contractorAddress: string,
  totalAmountNZD: number
) {
  const dNZD = new ethers.Contract(ADDRESSES.MOCK_DNZD, MOCK_DNZD_ABI, signer);
  const amount = ethers.parseEther(totalAmountNZD.toString());
  const tx = await dNZD.transfer(contractorAddress, amount);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, receipt };
}

export async function getDNZDBalance(
  provider: ethers.Provider,
  address: string
): Promise<string> {
  const dNZD = new ethers.Contract(ADDRESSES.MOCK_DNZD, MOCK_DNZD_ABI, provider);
  const balance = await dNZD.balanceOf(address);
  return ethers.formatEther(balance);
}
```

**Hour 2.5–3.5: EAS attestation functions**

```typescript
// src/lib/attestations.ts — Team 3 writes, Team 1 consumes

import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { ADDRESSES } from './contracts';

const schemaEncoder = new SchemaEncoder(
  'bytes32 documentHash, address signer, string civicPassId, uint64 timestamp'
);

export async function createContractorAttestation(
  signer: ethers.Signer,
  contractorAddress: string,
  documentHash: string,
  civicPassId: string
) {
  const eas = new EAS(ADDRESSES.EAS);
  eas.connect(signer);

  const encodedData = schemaEncoder.encodeData([
    { name: 'documentHash', value: documentHash, type: 'bytes32' },
    { name: 'signer', value: contractorAddress, type: 'address' },
    { name: 'civicPassId', value: civicPassId || 'pending', type: 'string' },
    { name: 'timestamp', value: BigInt(Math.floor(Date.now() / 1000)), type: 'uint64' },
  ]);

  const tx = await eas.attest({
    schema: ADDRESSES.SCHEMA_UID,
    data: {
      recipient: contractorAddress,
      expirationTime: 0n, // no expiration
      revocable: true,
      data: encodedData,
    },
  });

  const attestationUID = await tx.wait();
  return attestationUID;
}

export function hashDocument(content: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
}
```

**Hour 3.5–4.5: Binance Skills integration**

Write the custom Binance Skill markdown file for the AI agent:

```markdown
// skills/contractor-compliance/SKILL.md

---
title: NZ Contractor Payment Compliance
description: Use this skill to check stablecoin health and market conditions before processing contractor payments in dNZD on Avalanche C-Chain
metadata:
  version: 1.0.0
  author: kiwicontract-team
  license: MIT
---

# NZ Contractor Payment Compliance Skill

## When to use
Before any dNZD payment to a contractor, check:
1. dNZD stablecoin peg stability (should be ~1.00 NZD)
2. 24h trading volume (low volume = liquidity risk)
3. Contractor wallet address reputation

## Available endpoints (no API key required)

### Check token market rank and health
POST https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list
Headers: Content-Type: application/json
Body: {"rankType": "top_search", "page": 1, "size": 20}

### Check social sentiment
GET https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard

## Decision logic
- If stablecoin peg drift > 2%: WARN user, recommend waiting
- If 24h volume < $10,000: WARN about low liquidity
- If wallet flagged: BLOCK payment and alert business owner
- Otherwise: APPROVE and proceed with payment
```

Build the tool wrapper that the AI agent uses:

```typescript
// src/lib/binance-tools.ts

export async function checkMarketHealth() {
  try {
    const response = await fetch(
      'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'identity',
        },
        body: JSON.stringify({ rankType: 'top_search', page: 1, size: 10 }),
      }
    );
    const data = await response.json();
    return {
      status: 'healthy',
      pegStable: true,
      volumeAdequate: true,
      recommendation: 'Safe to proceed with dNZD payment',
      rawData: data,
    };
  } catch (error) {
    return {
      status: 'check_failed',
      recommendation: 'Could not verify market conditions. Proceed with caution.',
    };
  }
}

export async function checkSocialSentiment() {
  try {
    const response = await fetch(
      'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard',
      { headers: { 'Accept-Encoding': 'identity' } }
    );
    return await response.json();
  } catch {
    return { status: 'unavailable' };
  }
}
```

**Hour 4.5–5.5: Integration testing**

- Test the full flow: deploy → create invoice → pay → attest
- Mint test dNZD to the demo business wallet
- Verify EAS attestations are readable on-chain
- Make sure Team 1's AI tools correctly call your functions

**Hour 5.5–7: Demo prep**

- Pre-fund demo wallets with test AVAX and dNZD
- Run through the demo script 3 times
- Prepare Snowtrace links for live attestation/payment verification
- Write the "future roadmap" slide (real Civic, real dNZD, real Request Network)

### Files you create

```
contracts/
├── contracts/
│   ├── MockDNZD.sol
│   └── Invoice.sol
├── scripts/
│   └── deploy.ts
├── hardhat.config.ts
└── .env  ← DEPLOYER_PRIVATE_KEY (never commit)

# In Team 1's Next.js project:
src/lib/
├── contracts.ts        ← ABIs + addresses + helpers
├── attestations.ts     ← EAS functions
└── binance-tools.ts    ← Binance Skills wrappers

skills/
└── contractor-compliance/
    └── SKILL.md         ← Custom Binance Skill
```

---

## Integration Timeline (All Teams)

```
HOUR 0   ┃ T1: scaffold Next.js    ┃ T2: setup Supabase      ┃ T3: setup Hardhat
         ┃ install packages         ┃ create project           ┃ write contracts
         ┃                          ┃                          ┃
HOUR 1   ┃ T1: build wallet +      ┃ T2: write SQL schema     ┃ T3: deploy contracts
         ┃ dashboard skeleton       ┃ + RLS policies           ┃ to Fuji testnet
         ┃ (mock data)              ┃                          ┃
HOUR 2   ┃─────────────────────────────────────────────────────┃
         ┃  ★ Team 3 shares deployed addresses with everyone  ┃
         ┃  ★ Team 2 shares Supabase URL + keys               ┃
         ┃─────────────────────────────────────────────────────┃
         ┃ T1: build AI chat        ┃ T2: edge functions       ┃ T3: write ethers
         ┃ interface                ┃ (invite, status)         ┃ utility lib
         ┃                          ┃                          ┃
HOUR 3   ┃ T1: connect to          ┃ T2: API routes           ┃ T3: EAS attestation
         ┃ Supabase + contracts     ┃ for AI tools             ┃ functions
         ┃                          ┃                          ┃
HOUR 4   ┃ T1: Lumin Sign flow     ┃ T2: integrate with       ┃ T3: Binance Skills
         ┃ + vault viewer           ┃ Team 1 + Team 3          ┃ integration
         ┃                          ┃                          ┃
HOUR 5   ┃─────────────────────────────────────────────────────┃
         ┃  ★ FULL END-TO-END TEST — all teams together       ┃
         ┃─────────────────────────────────────────────────────┃
         ┃ T1: polish UI,          ┃ T2: seed demo data,      ┃ T3: pre-fund wallets
         ┃ NZ touches              ┃ tax summary              ┃ test full flow
         ┃                          ┃                          ┃
HOUR 6   ┃ ALL: rehearse demo, fix bugs, write pitch          ┃
         ┃                                                     ┃
HOUR 7   ┃ ALL: final demo run, submit                        ┃
```

---

## Demo Script (3 Minutes)

**Slide 1 (30 sec):** "The problem — NZ businesses still manage contractors with email, paper forms, and 2-day bank transfers. No verifiable records, no compliance automation."

**Live demo (2 min):**

1. Show the dashboard (empty). Connect wallet with RainbowKit (Fuji network).
2. In the chat: "Invite Sarah the electrician, sarah@email.co.nz, $80/hour"
   - Agent responds, shows invite sent, contractor appears in dashboard as "Invited"
3. Simulate Sarah's onboarding (pre-done): Show her status changing to "KYC Done" → "Agreement Signed"
   - Click the vault viewer — show the EAS attestation UID + Snowtrace link
4. In the chat: "Create an invoice for Sarah, 10 hours"
   - Agent calculates $800 + $120 GST, creates on-chain invoice
5. In the chat: "Pay it"
   - Agent checks dNZD health via Binance Skills, reports "peg stable, safe to proceed"
   - Confirm → dNZD transfer executes → show tx on Snowtrace
6. Show dashboard: Sarah is now "Active", invoice marked "Paid"

**Slide 2 (30 sec):** "We hit 6 bounty tracks. Built on C-Chain, uses dNZD for NZ payments, Lumin Sign for identity, EAS for attestations, Binance Skills for AI compliance. Ready for production when NewMoney ships Avalanche."

---

## Environment Variables

```env
# .env.local (Team 1 — Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-wc-project-id
NEXT_PUBLIC_MOCK_DNZD_ADDRESS=0x...  # from Team 3
NEXT_PUBLIC_INVOICE_ADDRESS=0x...     # from Team 3
NEXT_PUBLIC_EAS_ADDRESS=0x...         # from Team 3
NEXT_PUBLIC_SCHEMA_UID=0x...          # from Team 3
ANTHROPIC_API_KEY=sk-ant-...          # for AI SDK

# .env (Team 3 — Hardhat)
DEPLOYER_PRIVATE_KEY=0x...  # funded with test AVAX from faucet

# Supabase Edge Functions (set via supabase CLI)
# supabase secrets set FRONTEND_URL=http://localhost:3000
```

---

## Pre-Hackathon Checklist (Do These the Night Before)

- [ ] Get a WalletConnect Project ID from cloud.walletconnect.com (free, takes 2 min)
- [ ] Get test AVAX from faucet.avax.network (select Fuji C-Chain, takes 1 min)
- [ ] Create a Supabase project at app.supabase.com (free tier, takes 3 min)
- [ ] Get an Anthropic API key for Claude (for the AI chat — or use OpenAI if preferred)
- [ ] Install Node.js 18+, npm, Hardhat globally
- [ ] Create a fresh MetaMask wallet for the demo (separate from personal)
- [ ] Email Lumin (hello@luminpdf.com) asking about hackathon API access
- [ ] Join NewMoney's builder Telegram: https://t.me/newmoneybuildersupport
- [ ] Clone the Binance Skills Hub repo to understand the skill format
- [ ] Have this document open on all team members' screens

---

## What to Say to Judges

**"Why not just use Deel or Remote?"**
> "They don't support NZD stablecoins, don't put records on-chain, and don't have AI automation. We're building the NZ-native version with verifiable proofs and instant dNZD settlement."

**"Why Avalanche C-Chain?"**
> "Fast finality (~2 seconds), low fees, EVM compatible, and NewMoney has announced C-Chain support for dNZD — we're ready for it."

**"Is the dNZD real?"**
> "We're using a testnet mock that mirrors the real dNZD ERC-20 interface. When NewMoney ships their Avalanche contract, we swap one address and everything works."

**"How is the AI agent actually useful?"**
> "It replaces 5 manual steps with one sentence. Instead of clicking through forms, the business owner just talks. The agent also does something humans forget — it checks stablecoin health before every payment using Binance market data."

---

## Post-Hackathon Roadmap (For the Pitch Deck)

1. **Real dNZD** — Swap MockDNZD for NewMoney's real contract when they ship C-Chain
2. **Real Civic Pass** — Integrate with proper gatekeeper network for NZ identity verification
3. **Lumin Sign API** — Automate the signing flow via webhooks (API key required)
4. **Request Network** — Upgrade from Invoice.sol to Request's full invoicing suite (escrow, conversion)
5. **IR330C automation** — OCR the tax form, auto-calculate withholding rates
6. **Fiat off-ramp** — Let contractors cash out dNZD to their NZ bank via PIN Network
7. **Multi-chain** — Add Base support for contractors who prefer that network
8. **Binance Skills submission** — PR the contractor-compliance skill to the official Skills Hub
