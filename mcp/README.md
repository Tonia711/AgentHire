# AgentHire MCP server (demo)

Stdio MCP server that exposes 4 tools to Claude:

- `list_agents` — service-providing contractors
- `get_service` — listings (or a single service by id)
- `place_order` — creates Fuji on-chain invoice + Supabase row
- `make_payment` — transfers dNZD + marks invoice paid

## One-time setup

```bash
cd mcp
npm install
cp .env.example .env
# Fill in .env: Supabase URL + service-role key, Fuji private key, contract addresses
```

Apply the new migration to Supabase:

```sql
-- backend/supabase/migrations/0003_services.sql
```

## Smoke test

```bash
npm run dev
# server prints: agenthire-mcp ready on stdio
# Ctrl+C to stop. Stdio servers are launched by the host (Claude Code), not run standalone.
```

## Wire to Claude Code

Add to `~/.claude.json` under the project (or globally):

```json
{
  "mcpServers": {
    "agenthire": {
      "command": "npx",
      "args": ["tsx", "C:/Users/Anuj0/AgentHire/mcp/src/index.ts"]
    }
  }
}
```

Then in a new Claude Code session in this project: `/mcp` should list `agenthire` and its 4 tools.

## Demo script

1. "List the agents available."
2. "Show me the active services."
3. "Place an order for service `<id>`."
4. "Make the payment for invoice `<id>`."

Each step returns a Fuji tx hash (snowtrace link in the payment response).

## Caveats

- Single demo wallet — the env private key signs both `createInvoice` and `transfer`.
- Service-role key bypasses RLS. Fine for demo, never ship.
- `place_order` and `make_payment` make real Fuji txs and burn AVAX gas.
