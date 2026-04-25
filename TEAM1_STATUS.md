# Team 1 — Status & Next Steps

Snapshot as of 2026-04-25. Tracks what's wired in `AgentHire/` against the original `hackathon-project-plan.md`, calls out pivots, and orders the remaining work.

---

## 1. What's Done

### Repo / tooling
- AgentHire repo cloned to `C:\Users\Anuj0\AgentHire`, latest `main` pulled (Tonia711 collaborator access).
- Frontend stack confirmed: **Next.js 16.2.4 + React 19.2 + Tailwind v4 + Turbopack**.
- TypeScript target bumped to ES2020 (BigInt literals required by EAS SDK).
- `frontend/next.config.ts` sets `turbopack.root` to repo root so workspace-hoisted `next` resolves.
- Dev server runs cleanly: `npm run dev` from repo root → http://localhost:3000.

### Dependencies installed (`frontend/package.json`)
- `@rainbow-me/rainbowkit`, `wagmi`, `viem`, `ethers` — wallet + EVM
- `@tanstack/react-query` — wagmi peer
- `@supabase/supabase-js` — backend
- `ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/anthropic` — AI agent
- `@ethereum-attestation-service/eas-sdk` — Lumin/Civic anchoring
- `zod` — tool input validation

### Env scaffolding
- `frontend/.env.example` — placeholder template, committed.
- `frontend/.env.local` — local-only, **gitignored, untracked**, holds real credentials.
- `frontend/.gitignore` patched: `.env*` plus `!.env.example` exception.
- Confirmed: `frontend/.env.local.example` was previously tracked → `git rm --cached` to untrack.
- Global memory rule saved: never read any `.env*` file.

### Helper libs (`frontend/lib/`)
| File | Purpose |
|---|---|
| `contracts.ts` | Team 3 ABIs + `createOnChainInvoice`, `payContractor`, `getDNZDBalance`, `markInvoicePaid` |
| `attestations.ts` | `createContractorAttestation`, `hashDocument` (EAS SDK) |
| `binance-tools.ts` | Read-only `checkMarketHealth`, `checkSocialSentiment` |
| `ethers-adapter.ts` | wagmi v2 → ethers v6 `JsonRpcSigner` bridge (Pothole 7) |
| `snowtrace.ts` | `txUrl`, `addressUrl`, `shortenHash` for Fuji explorer |
| `supabase.ts` | Lazy browser client (returns `null` if env missing) |
| `supabase-queries.ts` | `fetchDemoContractor`, `upsertContractor`, `updateContractorStatus`, `insertInvoice`, `markLatestInvoicePaid`, `recordAttestation` |

### Providers / layout
- `frontend/app/providers.tsx` — `WagmiProvider` + `QueryClientProvider` + `RainbowKitProvider` (kiwi-themed dark) on `avalancheFuji` (chain 43113).
- `frontend/app/layout.tsx` wraps `<Providers>` around the existing `JobStateProvider` + `KiwiStateProvider`.

### Components
- `frontend/components/CivicStub.tsx` — verified/pending pill with check / clock SVG (no emojis).
- `frontend/components/AIChatLive.tsx` — uses `useChat()` from `@ai-sdk/react` v3, talks to `/api/chat`, suggestion chips, streaming status indicator.
- `frontend/components/LuminSignButton.tsx` — opens Lumin web flow, then on confirm calls `hashDocument()` + `createContractorAttestation()` against the connected Fuji wallet, persists via `recordAttestation()`.

### State (`frontend/app/kiwi-state.tsx`)
- Reads `useAccount` + `useWalletClient` from wagmi; exposes `walletConnected`, `walletAddress`.
- `inviteContractor` / `simulateVerification` / `createInvoice` / `payInvoice` write best-effort to Supabase (no-op when env missing).
- `createInvoice` and `payInvoice` call real `createOnChainInvoice` / `payContractor` ethers helpers when wallet is connected. `payInvoice` also runs `checkMarketHealth` first.
- Adds `isCreatingInvoice` / `isPaying` busy flags.
- `setAttestationUid` lifts EAS UID from `LuminSignButton` into shared state.
- On mount, attempts `fetchDemoContractor` to hydrate Sarah from seeded Supabase row.

### Pages
- `/client` — replaces mock chat panel with `<AIChatLive />`. `WalletPanel` now embeds RainbowKit `<ConnectButton>`. `InvoicePanel` shows live Snowtrace links for invoice + payment tx hashes; busy states with `cursor-pointer`, focus rings, hover transitions, ≥4.5:1 contrast. CivicStub badge in Civic + Lumin demo controls panel.
- `/contractor` — onboarding checklist now shows `<LuminSignButton>` (real attestation, requires wallet) + the simulated verification button as a fallback.

### AI route (`frontend/app/api/chat/route.ts`)
- Vercel AI SDK v6 streaming route, OpenAI provider via `createOpenAI({ apiKey: process.env.ANTHROPIC_API_KEY })` (env var name kept; value is an OpenAI key per user direction).
- Model: `gpt-4.1-mini`.
- Tools: `inviteContractor`, `createInvoice`, `checkTokenHealth` (calls real `checkMarketHealth`), `processPayment`. Tools currently return data; the LLM streams a summary back to the UI.

---

## 2. What's Left (in order)

### Manual steps (only the user can do)
| # | Step | Owner | Why |
|---|---|---|---|
| M1 | Apply migration `backend/supabase/migrations/0001_init.sql` in the Supabase SQL editor | User | Without this, all `supabase-queries` will quietly no-op or 404. Seeded Sarah row appears on `/client` once applied. |
| M2 | Get test AVAX + dNZD into the demo wallet currently connected (the address with `0.049 AVAX`) | User + Team 3 | "Pay it" reverts without dNZD balance. Either swap the demo wallet for Team 3's deployer key (holds ~1.099M dNZD) or have Team 3 mint dNZD to the connected address. |
| M3 | Fund deployer wallet with more AVAX if running low | Team 3 | Invoice + EAS attestation tx use deployer-signed gas if you switch to it. |

### Code work I can keep doing (priority order)
| # | Task | Status |
|---|---|---|
| C1 | Wire AI agent **tool calls** back to `kiwi-state` mutations (so when the LLM calls `inviteContractor`, the dashboard actually populates) | Pending. Today the tools just return data → LLM speaks; UI doesn't react. Use `addToolResult` from `useChat` plus a custom client-side handler. |
| C2 | Replace `setMessages` initial seed in `AIChatLive` with persisted server history (Supabase or local) so refresh doesn't lose context | Pending. Optional polish. |
| C3 | Real dashboard hydration: replace `dummyContractorAccounts` array with Supabase `contractors` query (not just Sarah) | Pending. Currently the 3 window-cleaning rows are still hard-coded. |
| C4 | Add **Snowtrace footer** linking the deployed Invoice + dNZD addresses (judges can verify mid-pitch) | Pending. Quick win for credibility. |
| C5 | NZ touches: better NZD formatting (`Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' })`), GST toggle on the contractor invite form, IR330C upload placeholder | Pending. |
| C6 | Make `WalletPanel` show an explicit **Switch to Fuji** prompt if connected to the wrong chain | Pending. Currently it relies on RainbowKit modal hint. |
| C7 | Final demo rehearsal pass: run end-to-end (invite → attest → invoice → health check → pay), capture 5 Snowtrace tx links live | Pending. Needs M1 + M2. |

### Cross-team
| # | Step | Owner |
|---|---|---|
| X1 | Confirm Team 2's Supabase Edge Functions exist or aren't required (Team 1 currently writes via direct table queries from the browser) | Team 1 ↔ Team 2 |
| X2 | Confirm Team 3 will pre-fund the demo address Team 1 connects on demo day | Team 1 ↔ Team 3 |
| X3 | Submit `contractor-compliance` Binance Skill PR to Skills Hub | Team 3 (post-hackathon) |

---

## 3. Pivots vs `hackathon-project-plan.md`

| Plan said | We did | Why |
|---|---|---|
| Next.js **14** App Router | **Next.js 16.2.4 + React 19 + Turbopack** | Repo was already scaffolded on 16. Forced minor fixes: `tsconfig` target ES2020, `turbopack.root` set explicitly. No functional regressions. |
| `@ai-sdk/anthropic` + `claude-sonnet-4-20250514` for the agent | `@ai-sdk/openai` + `gpt-4.1-mini`, key read from `ANTHROPIC_API_KEY` env var | User's available API key is OpenAI-compatible. Kept env var name to avoid file edits. Provider configured via `createOpenAI({ apiKey: process.env.ANTHROPIC_API_KEY })`. |
| Vercel AI SDK v3.x examples (`useChat({ messages, input, handleInputChange })`) | AI SDK **v6** (`useChat({ sendMessage, status, parts })`) | v6 changed the hook contract. Wrote `AIChatLive.tsx` against v6 directly; `parts[]` rendering, suggestion chips, streaming status pill. |
| Tailwind **v3** with PostCSS-style config | Tailwind **v4** (`@tailwindcss/postcss`) — already in repo | No config rewrite needed; existing classes work. |
| Hardhat + contract deploy script lives in `contracts/` | Lives in `C:\Users\Anuj0\KiwiContract\contracts` (Team 3's separate workspace, deployed) | We didn't touch contracts; Team 3 owns redeploys. AgentHire pulls addresses via env. |
| Civic Pass real gatekeeper integration | `CivicStub` component + `CivicStub` badge in UI; wallet still does real connect | Pothole 1 — gatekeeper network ID isn't public; planned fallback. |
| Lumin Sign API + webhook | `LuminSignButton` opens Lumin web URL in new tab, then user clicks confirm in app → real EAS attestation fires | Pothole 6 — free tier is web-only, paid API access not arranged. |
| Request Network for invoicing | Custom `Invoice.sol` deployed by Team 3 | Pothole 2 — Request not on Fuji testnet. |
| NewMoney dNZD live API | `MockDNZD.sol` ERC-20 deployed by Team 3 (`0x781A1Df1…`) | Pothole 4 — undocumented API. |
| Binance Web3 Wallet skill for AVAX ops | Read-only Binance market endpoints (`unified/rank/list`) for `checkMarketHealth` | Pothole 3 — Binance wallet skill doesn't support Avalanche; we use it strictly for market intelligence. |
| Supabase tables created via migration that runs as part of `supabase start` | Migration file `backend/supabase/migrations/0001_init.sql` exists; user applies it manually in dashboard | Faster for hackathon; same SQL, just no `supabase start` step. |
| `bg-[#fff4d5]` etc. inline color literals | Kept the existing palette (kiwi green `#155b49`, cream `#f7f8f4`, ink `#17211d`, accent yellow `#f6c64f`) | Repo had a finished design language already; layered new components on top of it. Applied accessibility checklist: cursor-pointer, focus-visible rings, ≥4.5:1 contrast, 44×44 touch targets, SVG icons (no emojis). |
| `git rm --cached` on real-credential files was not in the plan | Done after `.env.local.example` was committed with a real Project ID | One-shot cleanup; new `.env.example` template is sanitized. Previous commits may still contain the value if pushed — flagged for user. |

---

## 4. Files at a Glance

```
AgentHire/
├── TEAM1_STATUS.md                  ← this doc
├── frontend/
│   ├── .env.example                 ← committed template (placeholders)
│   ├── .env.local                   ← gitignored, real values
│   ├── .gitignore                   ← `.env*` + `!.env.example`
│   ├── next.config.ts               ← turbopack.root → repo root
│   ├── tsconfig.json                ← target ES2020
│   ├── app/
│   │   ├── api/chat/route.ts        ← AI SDK v6 + OpenAI
│   │   ├── client/page.tsx          ← uses AIChatLive, ConnectButton, Snowtrace links
│   │   ├── contractor/page.tsx      ← LuminSignButton + simulate fallback
│   │   ├── kiwi-state.tsx           ← wagmi hooks + Supabase + ethers helpers
│   │   ├── kiwi-components.tsx      ← WalletPanel uses RainbowKit, InvoicePanel busy states
│   │   ├── layout.tsx               ← wraps Providers
│   │   └── providers.tsx            ← Wagmi + RainbowKit + React Query
│   ├── components/
│   │   ├── AIChatLive.tsx
│   │   ├── CivicStub.tsx
│   │   └── LuminSignButton.tsx
│   └── lib/
│       ├── attestations.ts
│       ├── binance-tools.ts
│       ├── contracts.ts
│       ├── ethers-adapter.ts
│       ├── snowtrace.ts
│       ├── supabase.ts
│       └── supabase-queries.ts
└── backend/supabase/migrations/0001_init.sql  ← user applies manually
```

---

## 5. Recommended Sequence to Demo-Ready

1. **M1** — apply the SQL migration. (User, ~2 min.)
2. **M2** — fund the demo wallet with dNZD via Team 3. (User + Team 3, ~5 min.)
3. **C1** — wire AI agent tool results back to UI mutations. (Team 1, ~30 min.)
4. **C4** — Snowtrace footer for credibility. (Team 1, ~10 min.)
5. **C5** — NZ formatting + GST toggle polish. (Team 1, ~20 min.)
6. **C7** — full e2e rehearsal, capture 5 Snowtrace links. (All, ~30 min.)
7. **X2** — confirm Team 3 standby for any redeploys/mints during demo.

Steps **C2, C3, C6** are nice-to-have polish; skip if time runs short.
