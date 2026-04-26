# KiwiContract — Project To-Do & QA Status

_Last updated: 2026-04-25 (post read-only validation + 5 fixes)_

This is the single source of truth for what's done, what's left, and what has actually been verified vs. what still needs hands-on confirmation.

---

## 1. Status legend

| Symbol | Meaning |
|---|---|
| ✅ Done | Implemented AND verified by an evidence-backed check (code read, RPC call, REST probe, type-check) |
| 🟢 Done, untested | Implemented but no runtime confirmation yet — needs a browser walkthrough |
| 🟡 In progress | Partially done OR done but blocked on something external |
| 🔴 Blocked | Cannot proceed without external action (user, Team 2/3, or third party) |
| ⚪ Not started | Future work |

---

## 2. What has been DONE

### 2.1 Smart contracts (Team 3) — ✅ Done & verified

| Item | Evidence |
|---|---|
| `MockDNZD.sol` deployed to Fuji at `0x781A1Df1…D7253D19` | `eth_getCode` returned 3,852 chars of bytecode |
| `Invoice.sol` deployed at `0x2cB8295D…f6fF156A` | `eth_getCode` 3,738 chars; `nextId() = 1` |
| EAS deployed at `0xf65bC03e…9B6D0E8F` | `eth_getCode` 30,220 chars |
| SchemaRegistry deployed at `0x94068b5a…AB4E9653` | `eth_getCode` 4,454 chars |
| Contractor schema registered (UID `0xc50bb95df…`) | `getSchema()` returned full type string |
| End-to-end demo executed once on chain | All 5 documented tx hashes returned `status: 0x1` (success) |
| Treasury holds 1,099,080 dNZD | `balanceOf(0xD7003…)` decoded |
| Sarah holds 920 dNZD (paid invoice) | `balanceOf(0x635B5…)` decoded |
| ABIs in frontend match deployed Solidity | Diffed `lib/contracts.ts` vs `Invoice.sol` + `MockDNZD.sol` — clean |

### 2.2 Frontend scaffolding (Team 1) — ✅ Done & verified

| Item | Evidence |
|---|---|
| Next.js 16 + Tailwind 4 + Turbopack workspace builds | `npx tsc --noEmit` exits clean |
| RainbowKit + wagmi v2 on Fuji-only chain config | `app/providers.tsx` line 20 |
| Helper libs imported (`contracts.ts`, `attestations.ts`, `binance-tools.ts`, `ethers-adapter.ts`, `snowtrace.ts`, `supabase.ts`, `supabase-queries.ts`) | All present in `frontend/lib/` |
| AI chat route streaming via Vercel AI SDK v6 (`gpt-4.1-mini`) | `app/api/chat/route.ts` |
| 4 AI tools defined (`inviteContractor`, `createInvoice`, `checkTokenHealth`, `processPayment`) | route.ts:39-112 |
| `kiwi-state.tsx` fires real on-chain txs when wallet connected | `createOnChainInvoice` at line 472, `payContractor` at line 538 |
| `LuminSignButton` → real EAS attestation → Supabase write | `LuminSignButton.tsx:54,61` |
| All 6 `supabase-queries.ts` exports have call sites | Audit found zero dead exports |

### 2.3 Validation pass (this session) — ✅ Done

| Item | Evidence |
|---|---|
| Static + secrets hygiene check | `.env.local` gitignored (`git check-ignore` confirms); no hardcoded secrets in source |
| Supabase REST probe per table | All 4 tables exist (HTTP 401, code 42501 — RLS blocks anon; not 42P01) |
| On-chain bytecode + state probe | All 4 contracts deployed; balances + nextId match handoff doc |
| External services smoke test | Lumin reachable; Fuji RPC reachable; Snowtrace reachable in browser; Binance public API reachable (specific endpoint was broken — fixed below) |

### 2.4 Fixes applied this session — 🟢 Done, untested in browser

| # | Fix | Files | What changed |
|---|---|---|---|
| 1 | **Binance endpoint** | `lib/binance-tools.ts` | Swapped broken `web3.binance.com/.../pulse/unified/rank/list` (HTTP 400 "illegal parameter") for `api.binance.com/v3/ticker/24hr?symbol=USDCUSDT`. Returns real peg/volume numbers. Added missing `response.ok` guard. |
| 2 | **AI tool → state wiring** | `components/AIChatLive.tsx` | `useEffect` watches `messages` for `tool-${name}` parts in state `output-available`; dispatches `inviteContractor` / `createInvoice` / `payInvoice` from `useKiwiState()` exactly once per `toolCallId` (deduped via `useRef<Set>`). |
| 3 | **Wrong-chain guard** | `app/kiwi-components.tsx` (`WalletPanel`) | `useChainId()` + `useSwitchChain()`. If `chainId !== 43113`, amber alert with "Switch to Fuji" button. |
| 4 | **NZ polish** | `app/kiwi-components.tsx` | `formatNzd()` using `Intl.NumberFormat('en-NZ', currency: 'NZD')` for invoice + hourly-rate display. GST-registered checkbox with $60k explainer. IR330C file-upload placeholder. |
| 5 | **Env var rename** | `app/api/chat/route.ts`, `.env.example` | Route reads `OPENAI_API_KEY` first, falls back to `ANTHROPIC_API_KEY`. `.env.example` documents canonical name. |

All 5 changes pass `npx tsc --noEmit` with zero errors.

---

## 3. What is REMAINING

### 3.1 Blocked — needs you or another human

| Priority | Item | Owner | Action |
|---|---|---|---|
| 🔴 P0 | **Supabase RLS disable** | You (Supabase dashboard) | In SQL editor at `https://supabase.com/dashboard/project/jqqondvcxreffukewznp/sql` run: `alter table businesses disable row level security; alter table contractors disable row level security; alter table invoices disable row level security; alter table attestations disable row level security;` — 30 sec. Without this, every dashboard write silently no-ops. |
| 🟡 P2 | **Rename env var in `.env.local`** | You | Change `ANTHROPIC_API_KEY=…` to `OPENAI_API_KEY=…` (same value). Code already accepts both. |

### 3.2 Code work — ⚪ Not started

| Priority | Item | Estimated time | Notes |
|---|---|---|---|
| 🟡 P2 | Snowtrace footer with all 4 contract addresses | 10 min | Per `TEAM1_STATUS.md` — gives judges click-through proof |
| 🟡 P2 | Replace 3 hardcoded window-cleaning rows with live Supabase query | 15 min | Per `TEAM1_STATUS.md` |
| 🟡 P2 | Persist chat history (localStorage or Supabase) | 20 min | Demo robustness — survives accidental refresh |
| ⚪ P3 | `event InvoicePaid` declared in `Invoice.sol:22` but never emitted by `markPaid()` | 5 min Solidity + redeploy | Cosmetic; nothing breaks |
| ⚪ P3 | Wire Team 2's edge functions or formally decide they're unused | depends | Currently writing direct from browser |

### 3.3 Cross-team coordination — 🟡 In progress

| Item | Owner | Notes |
|---|---|---|
| Team 2 edge functions: optional or required? | Team 1 ↔ Team 2 | Frontend currently bypasses them; document the decision |
| Standby coverage during demo | Team 3 | Confirm someone can remint dNZD / redeploy if a tx hash goes stale |
| Submit `contractor-compliance` Binance Skill PR to Skills Hub | Anyone, post-hackathon | Manifest at `KiwiContract/contracts/skills/contractor-compliance/SKILL.md` |

### 3.4 Demo prep — ⚪ Not started

| Item | Estimated time |
|---|---|
| Full e2e dry run × 3 (capture 5 fresh Snowtrace tx hashes) | 30 min |
| 3-minute pitch script rehearsal | 30 min |
| Pre-fund a designated "business" demo wallet with AVAX gas + dNZD | 10 min (needs Team 3) |
| Slide deck: "what we built" / "what's next" / bounty checklist | 30 min |

---

## 4. QA status — what has been CHECKED vs. what NEEDS CHECKING

### 4.1 Cleared QA (verified by hard evidence)

| ✅ Cleared | Evidence |
|---|---|
| All 4 contracts deployed at expected Fuji addresses | `eth_getCode` returned bytecode for each |
| Chain ID is 43113 (Fuji) | `eth_chainId` → `0xa869` |
| Schema UID is registered with correct type string | `getSchema(0xc50bb95df…)` returned `bytes32 documentHash, address signer, string civicPassId, uint64 timestamp` |
| Treasury and Sarah balances match handoff doc | `balanceOf` decoded to 1,099,080 and 920 dNZD |
| 5 documented demo txs all succeeded | `eth_getTransactionReceipt` × 5 returned `status: 0x1` |
| Frontend ABIs match Solidity sources | Manual diff |
| `.env.local` is gitignored | `git check-ignore -v .env.local` confirmed |
| No hardcoded secrets/contract addresses leaked into source | `Grep` across `frontend/` for known values returned only `.env.example` |
| All 9 expected env var names present in `.env.local` | `grep -c "^VAR=" .env.local` for each |
| AI provider key has correct shape | length 163 + prefix `sk-` (consistent with OpenAI sk-proj-* key) |
| Supabase tables exist | All 4 returned 42501 (RLS deny), not 42P01 (missing) |
| Binance ticker endpoint reachable + healthy stablecoin numbers | `curl /api/v3/ticker/24hr?symbol=USDCUSDT` returned 200 with peg ≈ $1.00 |
| Lumin Sign domain reachable | HTTP 301 (normal redirect) |
| Avalanche Fuji RPC reachable | Returns chainId on demand |
| All 5 code edits type-check cleanly | `npx tsc --noEmit` exits 0 |
| Audit confirms `addToolResult`/`onToolCall` was missing in original code | `Grep` returned zero matches before fix |
| Audit confirms wrong-chain guard was missing | `Grep` for `useChainId|switchChain` returned zero matches before fix |
| `LuminSignButton` calls real EAS + Supabase | Code trace through `LuminSignButton.tsx:54,61` |

### 4.2 NEEDS verification (untested in real browser/runtime)

These changes ship with type-check confidence but no live confirmation. Walk through each in a browser before the demo.

| 🔍 Verify | How to test | Pass criteria |
|---|---|---|
| **Supabase RLS disabled correctly** | Re-run Phase 2 probe: `curl … /rest/v1/contractors?select=*&limit=5` with anon key | HTTP 200 with JSON array (not 401) |
| **Browser-side write actually persists** | After RLS disabled: invite a contractor, then refresh and confirm the row hydrates from Supabase | `fetchDemoContractor` returns the row on mount |
| **AI tool → state wiring (task #7)** | `npm run dev`, open `/client`, ask the AI `"Invite Sarah, sarah@email.co.nz, $80/hour"` | Sarah appears in the dashboard within 1-2 seconds (not just in chat) |
| **AI createInvoice tool fires kiwi-state** | After Sarah is invited, ask `"Create an invoice for Sarah for 10 hours"` | Invoice card appears with NZ$800 / NZ$120 / NZ$920 |
| **AI processPayment tool fires kiwi-state** | After invoice exists + wallet connected on Fuji, ask `"Pay it"` | MetaMask prompts for dNZD transfer; on confirm, status flips to PAID with real Snowtrace tx |
| **Tool dedupe works** | Re-send the same prompt twice in quick succession | Mutation only fires once per unique `toolCallId` |
| **Wrong-chain guard (task #8)** | Connect wallet, then switch MetaMask to Ethereum mainnet | Amber "Switch to Fuji" alert appears in WalletPanel |
| **switchChain button works** | Click "Switch to Fuji" in the alert | MetaMask prompts to add/switch to Avalanche Fuji; on confirm, alert disappears |
| **NZD formatting (task #9)** | Open a created invoice | Subtotal/GST/Total render as `NZ$800.00` (not `$800.00`); hourly rate shows `NZ$80.00/hr` |
| **GST checkbox + IR330C field render** | Open `InviteContractorForm` | Both fields visible with explanatory text; file picker accepts `.pdf,.png,.jpg,.jpeg` |
| **Binance health check (task #6)** | Open chat, ask `"Check dNZD market health"` | Tool returns `status: "healthy"`, real `pegPrice` ≈ `$1.00`, real `volume24hUsd`, recommendation cites the actual numbers |
| **Pre-payment narration uses real numbers** | Trigger `payInvoice` flow | Chat says peg/volume numbers from Binance, not generic "stable" |
| **Env var fallback (task #10)** | Without renaming `.env.local`, restart dev server and chat | AI still streams (proves `?? process.env.ANTHROPIC_API_KEY` fallback works) |
| **`@ai-sdk/react` v6 part-shape assumption** | First end-to-end run (task #7 verification) | If the dispatcher never fires, console-log a part to confirm `type: "tool-${name}"` and `state: "output-available"` are correct for installed version |
| **EAS attestation full loop** | Click "Sign with Lumin" on `/contractor`, complete the flow | New attestation UID appears; `recordAttestation` write succeeds (post-RLS-fix); Snowtrace tx visible |
| **Wallet → ethers signer bridge stable** | Create invoice while wallet is connected | No "Cannot read property 'provider' of undefined" (Pothole 7) |

### 4.3 Out of scope for QA right now

| ❌ Skipped | Why |
|---|---|
| Live Civic Pass gatekeeper integration | Stubbed per project plan Pothole 1; demo uses `<CivicStub>` |
| Lumin Sign API webhook automation | Free tier is web-only; manual flow per Pothole 6 |
| Request Network invoicing on Fuji | Not deployed on Fuji; replaced by `Invoice.sol` per Pothole 2 |
| NewMoney real dNZD | Not yet on Avalanche; `MockDNZD.sol` is the placeholder per Pothole 4 |
| Binance Web3 Wallet skill on AVAX | Not supported; we use read-only market data only per Pothole 3 |

---

## 5. Critical files reference

```
KiwiContract/
├── DEPLOYED_ADDRESSES.md            # all live Fuji addresses + Snowtrace tx links
├── TEAM3_HANDOFF.md                 # contracts + helper lib handoff
├── PITCH_ROADMAP.md                 # judge Q&A, future roadmap
├── PROJECT_TODO.md                  # this file
└── contracts/                       # Hardhat workspace (read-only after deploy)

AgentHire/
├── TEAM1_STATUS.md                  # detailed frontend status
└── frontend/
    ├── .env.local                   # secrets (gitignored, never read directly)
    ├── .env.example                 # template
    ├── app/
    │   ├── api/chat/route.ts        # AI agent (4 tools, OpenAI gpt-4.1-mini)
    │   ├── kiwi-state.tsx           # global state, on-chain mutations
    │   ├── kiwi-components.tsx      # WalletPanel, InvoicePanel, InviteContractorForm
    │   ├── client/page.tsx          # business view
    │   └── contractor/page.tsx      # contractor view
    ├── components/
    │   ├── AIChatLive.tsx           # chat UI + tool-result dispatcher
    │   ├── CivicStub.tsx            # Civic Pass placeholder
    │   └── LuminSignButton.tsx      # Lumin → EAS → Supabase
    └── lib/
        ├── contracts.ts             # ABIs + ethers helpers
        ├── attestations.ts          # EAS SDK wrapper
        ├── binance-tools.ts         # market health (USDCUSDT proxy)
        ├── ethers-adapter.ts        # wagmi viem → ethers v6 bridge
        ├── supabase.ts              # client init
        ├── supabase-queries.ts      # 6 query helpers (all called)
        └── snowtrace.ts             # Fuji explorer URL helpers

backend/                              # Team 2 (edge functions present, not currently called)
└── supabase/
    ├── functions/                   # invite-contractor, update-status, log-payment
    └── migrations/0001_init.sql     # schema (applied; RLS blocks anon)
```

---

## 6. Recommended sequence to demo-ready

```
1. Disable Supabase RLS              (you, 30 sec)        [P0 unblocker]
2. Rename ANTHROPIC_API_KEY in       (you, 30 sec)        [optional cleanup]
   .env.local → OPENAI_API_KEY
3. npm run dev + manual walkthrough  (15 min)             [proves §4.2 items]
4. Snowtrace footer                  (10 min)             [P2 polish]
5. Live Supabase contractor query    (15 min)             [P2 polish]
6. Full e2e dry run × 3              (30 min)             [demo confidence]
7. Pitch rehearsal                   (30 min)
```

Total to demo-ready: **~1.5–2 hours** active work.

---

## 7. Bounty checklist (sanity check before pitching)

| Track | $ | Demoable proof | Status |
|---|---|---|---|
| Avalanche C-Chain | $1,000 | All txs on Fuji 43113; 5 verified Snowtrace links | ✅ |
| Local Systems | $250 | NZ$ formatting, GST checkbox, IR330C field, NZD-denominated invoices | ✅ (post §4.2 verify) |
| NewMoney Builder | $500 | dNZD ERC-20 deployed + transferred + balance-verified on chain | ✅ |
| Lumin Identity | $500 | LuminSignButton → EAS attestation → on-chain UID + Supabase record | 🟢 (needs browser verify) |
| Lumin Payments | $500 | `Invoice.sol` deployed + `createInvoice` + `markPaid` wired | ✅ |
| Binance Skills AI | $1,250 | `checkTokenHealth` tool returns real peg/volume; AI narrates pre-payment | 🟢 (needs browser verify) |
| **Total possible** | **$4,000** | | |
