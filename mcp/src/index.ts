import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
let envLoadError: string | null = null;
try {
  const buf = readFileSync(envPath);
  let raw: string;
  if (buf[0] === 0xff && buf[1] === 0xfe) raw = buf.toString("utf16le").slice(1);
  else if (buf[0] === 0xfe && buf[1] === 0xff) raw = buf.swap16().toString("utf16le").slice(1);
  else if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) raw = buf.slice(3).toString("utf8");
  else raw = buf.toString("utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e: any) {
  envLoadError = e?.message ?? String(e);
}

const aliases: Record<string, string[]> = {
  SUPABASE_URL: ["NEXT_PUBLIC_SUPABASE_URL"],
  INVOICE_ADDRESS: ["NEXT_PUBLIC_INVOICE_ADDRESS"],
  MOCK_DNZD_ADDRESS: ["NEXT_PUBLIC_MOCK_DNZD_ADDRESS"],
};
for (const [canonical, alts] of Object.entries(aliases)) {
  if (!process.env[canonical]) {
    for (const alt of alts) {
      if (process.env[alt]) {
        process.env[canonical] = process.env[alt];
        break;
      }
    }
  }
}
process.env.FUJI_RPC_URL ??= "https://api.avax-test.network/ext/bc/C/rpc";
process.env.DEMO_BUSINESS_ID ??= "10000000-0000-0000-0000-000000000001";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  FUJI_RPC_URL,
  DEMO_BUSINESS_ID,
  DEMO_PRIVATE_KEY,
  INVOICE_ADDRESS,
  MOCK_DNZD_ADDRESS,
} = process.env;

const required = {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  FUJI_RPC_URL,
  DEMO_BUSINESS_ID,
  DEMO_PRIVATE_KEY,
  INVOICE_ADDRESS,
  MOCK_DNZD_ADDRESS,
};
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`agenthire-mcp: missing env vars: ${missing.join(", ")}`);
  console.error(`agenthire-mcp: looked in ${envPath}`);
  if (envLoadError) console.error(`agenthire-mcp: .env load error: ${envLoadError}`);
  process.exit(1);
}

const ZERO = "0x0000000000000000000000000000000000000000";
for (const [name, val] of [
  ["INVOICE_ADDRESS", INVOICE_ADDRESS!],
  ["MOCK_DNZD_ADDRESS", MOCK_DNZD_ADDRESS!],
]) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(val) || val.toLowerCase() === ZERO) {
    console.error(`agenthire-mcp: ${name} is not a valid deployed address (got ${val}). Deploy contracts first.`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const provider = new ethers.JsonRpcProvider(FUJI_RPC_URL);
const signer = new ethers.Wallet(DEMO_PRIVATE_KEY, provider);

const INVOICE_ABI = [
  "function createInvoice(address contractor, uint256 amount, uint256 gstAmount, string desc) returns (uint256)",
  "function markPaid(uint256 id)",
  "function nextId() view returns (uint256)",
  "event InvoiceCreated(uint256 id, address business, address contractor, uint256 total)",
];
const MOCK_DNZD_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

const invoiceContract = new ethers.Contract(INVOICE_ADDRESS, INVOICE_ABI, signer);
const dnzdContract = new ethers.Contract(MOCK_DNZD_ADDRESS, MOCK_DNZD_ABI, signer);

const server = new Server(
  { name: "agenthire-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const tools = [
  {
    name: "list_agents",
    description:
      "List service-providing agents (contractors). Optional filter by status (e.g. 'active', 'agreement_signed').",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Optional contractor status filter" },
        limit: { type: "number", default: 20 },
      },
    },
  },
  {
    name: "get_service",
    description:
      "Get a service listing by id, including the providing agent. If no id, lists active services.",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string", description: "UUID of the service" },
        limit: { type: "number", default: 20 },
      },
    },
  },
  {
    name: "place_order",
    description:
      "Place an order against a service. Creates an on-chain invoice on Fuji + a Supabase invoice row. Returns invoice id, on-chain id, and tx hash.",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string" },
      },
      required: ["service_id"],
    },
  },
  {
    name: "make_payment",
    description:
      "Pay an open invoice. Transfers dNZD on Fuji to the contractor, marks the on-chain invoice paid, records a payment row, and flips invoice status to 'paid'. Returns transfer tx hash + mark-paid tx hash.",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: { type: "string", description: "Supabase invoice UUID" },
      },
      required: ["invoice_id"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

function ok(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function fail(message: string) {
  return { isError: true, content: [{ type: "text", text: message }] };
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  if (name === "list_agents") {
    const status = (args as any).status as string | undefined;
    const limit = ((args as any).limit as number) ?? 20;
    let q = supabase
      .from("contractors")
      .select("id,name,email,hourly_rate,wallet_address,status,preferred_token,preferred_chain_id")
      .eq("business_id", DEMO_BUSINESS_ID)
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return fail(error.message);
    return ok(data);
  }

  if (name === "get_service") {
    const serviceId = (args as any).service_id as string | undefined;
    const limit = ((args as any).limit as number) ?? 20;
    if (serviceId) {
      const { data, error } = await supabase
        .from("services")
        .select("*, contractor:contractors(id,name,wallet_address,status)")
        .eq("id", serviceId)
        .single();
      if (error) return fail(error.message);
      return ok(data);
    }
    const { data, error } = await supabase
      .from("services")
      .select("id,title,category,price_nzd,gst_nzd,token_symbol,active,contractor_id")
      .eq("active", true)
      .limit(limit);
    if (error) return fail(error.message);
    return ok(data);
  }

  if (name === "place_order") {
    const serviceId = (args as any).service_id as string;
    const { data: service, error: sErr } = await supabase
      .from("services")
      .select("*, contractor:contractors(id,name,wallet_address)")
      .eq("id", serviceId)
      .single();
    if (sErr || !service) return fail(sErr?.message ?? "service not found");
    const contractor = (service as any).contractor;
    if (!contractor?.wallet_address) return fail("contractor has no wallet_address");

    const amountWei = ethers.parseEther(String(service.price_nzd));
    const gstWei = ethers.parseEther(String(service.gst_nzd));
    const tx = await invoiceContract.createInvoice(
      contractor.wallet_address,
      amountWei,
      gstWei,
      service.title,
    );
    const receipt = await tx.wait();
    let onchainId: number | null = null;
    for (const log of receipt.logs) {
      try {
        const parsed = invoiceContract.interface.parseLog(log);
        if (parsed?.name === "InvoiceCreated") {
          onchainId = Number(parsed.args[0]);
          break;
        }
      } catch {}
    }

    const { data: inv, error: iErr } = await supabase
      .from("invoices")
      .insert({
        onchain_id: onchainId,
        business_id: DEMO_BUSINESS_ID,
        contractor_id: contractor.id,
        service_id: service.id,
        amount: service.price_nzd,
        gst_amount: service.gst_nzd,
        token_symbol: service.token_symbol,
        chain_id: service.chain_id,
        description: service.title,
        status: "created",
        invoice_tx_hash: receipt.hash,
      })
      .select()
      .single();
    if (iErr) return fail(iErr.message);

    return ok({
      invoice_id: inv.id,
      onchain_id: onchainId,
      tx_hash: receipt.hash,
      contractor: contractor.name,
      total_nzd: Number(service.price_nzd) + Number(service.gst_nzd),
      token: service.token_symbol,
    });
  }

  if (name === "make_payment") {
    const invoiceId = (args as any).invoice_id as string;
    const { data: inv, error: iErr } = await supabase
      .from("invoices")
      .select("*, contractor:contractors(id,name,wallet_address)")
      .eq("id", invoiceId)
      .single();
    if (iErr || !inv) return fail(iErr?.message ?? "invoice not found");
    if (inv.status === "paid") return fail("invoice already paid");
    const contractor = (inv as any).contractor;
    if (!contractor?.wallet_address) return fail("contractor has no wallet_address");

    const total = Number(inv.amount) + Number(inv.gst_amount);
    const totalWei = ethers.parseEther(String(total));

    const transferTx = await dnzdContract.transfer(contractor.wallet_address, totalWei);
    const transferReceipt = await transferTx.wait();

    let markPaidHash: string | null = null;
    if (inv.onchain_id != null) {
      const mp = await invoiceContract.markPaid(inv.onchain_id);
      const mpReceipt = await mp.wait();
      markPaidHash = mpReceipt.hash;
    }

    const { error: pErr } = await supabase.from("payments").insert({
      invoice_id: inv.id,
      business_id: inv.business_id,
      contractor_id: inv.contractor_id,
      chain_id: inv.chain_id,
      token_symbol: inv.token_symbol,
      amount: total,
      tx_hash: transferReceipt.hash,
    });
    if (pErr) return fail(pErr.message);

    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString(), tx_hash: transferReceipt.hash })
      .eq("id", inv.id);

    return ok({
      invoice_id: inv.id,
      paid_to: contractor.name,
      total_nzd: total,
      transfer_tx_hash: transferReceipt.hash,
      mark_paid_tx_hash: markPaidHash,
      explorer: `https://testnet.snowtrace.io/tx/${transferReceipt.hash}`,
    });
  }

  return fail(`unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("agenthire-mcp ready on stdio");
