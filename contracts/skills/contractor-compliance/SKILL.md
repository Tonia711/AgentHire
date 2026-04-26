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
