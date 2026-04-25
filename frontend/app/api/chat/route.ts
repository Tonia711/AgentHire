import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { checkMarketHealth } from "@/lib/binance-tools";

export const maxDuration = 30;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are KiwiContract AI, a contractor management assistant for NZ businesses on Avalanche Fuji.

Responsibilities:
- Invite contractors, track their onboarding status, and explain what's left.
- Create invoices in NZD with mandatory 15% GST when the contractor is GST-registered.
- Before processing any payment, ALWAYS call checkTokenHealth first and report the result.
- Settle payments in dNZD on Avalanche Fuji.

Style:
- Concise. Conversational. Plain English. Use NZ spelling.
- Always confirm destructive or paid actions before executing.
- Never use em-dashes or en-dashes in chat copy.

Compliance reminders:
- GST is 15% and mandatory for contractors earning over $60,000/year.
- IR330C withholding may apply; flag if missing.
- Always show the dNZD recipient address before confirming a transfer.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      inviteContractor: tool({
        description: "Invite a new contractor by email and basic terms.",
        inputSchema: z.object({
          name: z.string().describe("Contractor's full name"),
          email: z.string().email(),
          hourlyRate: z.number().positive().describe("Hourly rate in NZD"),
          trade: z.string().optional().describe("e.g. Electrician, Plumber"),
          terms: z.string().default("standard"),
        }),
        execute: async (input) => ({
          status: "invite_drafted",
          message: `Invite drafted for ${input.name} at ${input.email} on $${input.hourlyRate}/hour.`,
          contractor: input,
        }),
      }),

      createInvoice: tool({
        description:
          "Create an invoice for a contractor. Computes 15% GST when applicable.",
        inputSchema: z.object({
          contractorName: z.string(),
          hours: z.number().positive(),
          hourlyRate: z.number().positive(),
          description: z.string().default("Hours worked"),
          gstRegistered: z.boolean().default(true),
        }),
        execute: async (input) => {
          const subtotal = input.hours * input.hourlyRate;
          const gst = input.gstRegistered ? subtotal * 0.15 : 0;
          const total = subtotal + gst;
          return {
            status: "invoice_drafted",
            subtotal,
            gst,
            total,
            currency: "NZD",
            description: input.description,
            contractor: input.contractorName,
          };
        },
      }),

      checkTokenHealth: tool({
        description:
          "Check dNZD market health using Binance public market data. Run before any payment.",
        inputSchema: z.object({
          tokenSymbol: z.string().default("dNZD"),
        }),
        execute: async () => {
          const health = await checkMarketHealth();
          return {
            ...health,
            note: "Read-only Binance market check; no API key required.",
          };
        },
      }),

      processPayment: tool({
        description:
          "Confirm a dNZD payment to a contractor. Must follow a checkTokenHealth call.",
        inputSchema: z.object({
          contractorName: z.string(),
          contractorAddress: z
            .string()
            .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
          totalNZD: z.number().positive(),
          invoiceId: z.string().optional(),
        }),
        execute: async (input) => ({
          status: "payment_prepared",
          message: `Ready to send ${input.totalNZD.toFixed(2)} dNZD to ${input.contractorName} at ${input.contractorAddress}. Awaiting wallet signature.`,
          ...input,
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
