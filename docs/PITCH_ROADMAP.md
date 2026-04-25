# KiwiContract — Pitch & Post-Hackathon Roadmap

## Bounty checklist (live, on Fuji)

| Track | Prize | Evidence |
|---|---|---|
| Avalanche C-Chain | $1,000 | Every transaction in `DEPLOYED_ADDRESSES.md` runs on Fuji (chain 43113) |
| Local Systems | $250 | NZ-native flow: GST 15%, IR330C placeholder, dNZD settlement |
| NewMoney Builder | $500 | Payments settle in dNZD ERC-20 — same interface as production |
| Lumin Identity | $500 | Lumin Sign verifies identity → keccak256 hash anchored on-chain via EAS |
| Lumin Payments | $500 | On-chain `Invoice.sol` with status tracking, settled in dNZD |
| Binance Skills AI | $1,250 | AI agent calls `checkMarketHealth` skill before every payment |

## What works today (live demo claims, all verifiable on Snowtrace)

1. AI agent in chat invites a contractor, creates an invoice with GST, runs a market-health check via Binance, and triggers a dNZD payment.
2. Every step writes to Avalanche Fuji — no centralised database for the audit trail.
3. Contractor identity is anchored via EAS attestation; attestation UID is queryable on-chain forever.
4. The whole flow is one sentence in chat instead of five forms in a SaaS.

## What we'd ship next (pitch-deck roadmap)

1. **Real dNZD** — swap MockDNZD for NewMoney's production contract when they ship Avalanche C-Chain. One-line address change in `lib/contracts.ts`.
2. **Real Civic Pass** — replace `CivicStub` with `<GatewayProvider>` and the production NZ gatekeeper network. Wallet-gating already wired in the UI.
3. **Lumin Sign API** — webhook on `signature_request_approved` automates the manual sign-in-browser step (today's hackathon constraint is the free-tier API limit).
4. **Request Network upgrade** — replace `Invoice.sol` with Request's full suite for escrow, currency conversion, and dispute resolution once they redeploy on Fuji.
5. **IR330C automation** — OCR the IRD tax form on contractor onboarding, auto-set withholding rate per contractor, surface to the AI agent so it can answer "how much tax did Sarah pay this quarter?"
6. **Fiat off-ramp** — partner with PIN Network to let contractors cash dNZD into their NZ bank account without leaving the app.
7. **Multi-chain** — Base support for contractors who prefer it; chain-toggle in `lib/contracts.ts` already structured for this.
8. **Skill submission** — PR `skills/contractor-compliance/SKILL.md` to the official Binance Skills Hub repo so other builders can reuse the compliance pattern.

## Talking points for judges

**"Why not Deel or Remote?"**
> They don't support NZD stablecoins, don't put records on-chain, and don't automate compliance with AI. We're the NZ-native version with verifiable proofs and instant dNZD settlement.

**"Why Avalanche C-Chain?"**
> Two-second finality, sub-cent gas, EVM-native. NewMoney has announced C-Chain support for dNZD — we're ready for the day they ship.

**"Is the dNZD real?"**
> Testnet mock that mirrors the real ERC-20 interface byte-for-byte. When NewMoney ships their production contract, we change one address and everything works.

**"How is the AI agent useful?"**
> Replaces five manual steps with one sentence. And it does something humans skip — checks stablecoin peg health via Binance market data before every payment. That's the difference between a chatbot and an agent.

## Numbers we can point to live

- 4 contracts deployed (MockDNZD, Invoice, SchemaRegistry, EAS)
- 1 EAS schema registered (UID `0xc50bb9...07d96`)
- 5 end-to-end transactions verified (mint, invoice, pay, mark-paid, attest) — all linked in `DEPLOYED_ADDRESSES.md`
- 920 dNZD currently held by demo contractor `0x635B5c...7Aff` as proof of settlement
- ~0.4 AVAX remaining on deployer wallet for live demo redos
