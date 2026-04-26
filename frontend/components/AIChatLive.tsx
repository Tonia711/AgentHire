"use client";

import { useChat } from "@ai-sdk/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useKiwiState } from "../app/kiwi-state";

const SUGGESTIONS = [
  "Invite Sarah the electrician, sarah@email.co.nz, $80/hour",
  "Create an invoice for Sarah for 10 hours of electrical maintenance",
  "Check dNZD market health before payment",
  "Pay Sarah's invoice in dNZD",
];

type ToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
};

function MessageBubble({ role, text }: { role: "user" | "assistant" | "system"; text: string }) {
  const isUser = role === "user";
  return (
    <div
      className={`rounded-lg p-3 text-sm ${
        isUser ? "bg-[#e7f2ee] ml-8" : "bg-[#fbfcf8] mr-8"
      }`}
    >
      <p className="font-bold">{isUser ? "Business Owner" : "KiwiContract AI"}</p>
      <p className="mt-1 whitespace-pre-wrap text-[#435149]">{text}</p>
    </div>
  );
}

export function AIChatLive() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const isStreaming = status === "submitted" || status === "streaming";
  const { inviteContractor, createInvoice, payInvoice } = useKiwiState();
  const processedToolCalls = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const rawPart of message.parts) {
        const part = rawPart as ToolPart;
        if (typeof part.type !== "string" || !part.type.startsWith("tool-")) continue;
        if (part.state !== "output-available") continue;
        const id = part.toolCallId;
        if (!id || processedToolCalls.current.has(id)) continue;
        processedToolCalls.current.add(id);

        const toolName = part.type.slice("tool-".length);
        const input = part.input ?? {};

        try {
          if (toolName === "inviteContractor") {
            inviteContractor({
              name: String(input.name ?? "Contractor"),
              email: String(input.email ?? ""),
              trade: String(input.trade ?? "Electrician"),
              hourlyRate: String(input.hourlyRate ?? "0"),
            });
          } else if (toolName === "createInvoice") {
            void createInvoice(String(input.hours ?? "0"));
          } else if (toolName === "processPayment") {
            void payInvoice();
          }
        } catch (err) {
          console.error(`AIChatLive: ${toolName} dispatch failed`, err);
        }
      }
    }
  }, [messages, inviteContractor, createInvoice, payInvoice]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    void sendMessage({ text });
    setInput("");
  }

  function handleSuggestion(suggestion: string) {
    if (isStreaming) return;
    void sendMessage({ text: suggestion });
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">AI agent chat</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isStreaming
              ? "bg-[#fff4d5] text-[#7a5b00]"
              : "bg-[#e7f2ee] text-[#155b49]"
          }`}
        >
          {isStreaming ? "Thinking..." : "Live"}
        </span>
      </div>

      <div className="mt-5 grid max-h-96 gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="rounded-lg bg-[#fbfcf8] p-3 text-sm">
            <p className="font-bold">KiwiContract AI</p>
            <p className="mt-1 text-[#435149]">
              Kia ora. Ask me to invite a contractor, create an invoice, check dNZD market
              health, or process a payment.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const text = message.parts
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join("");

            return (
              <MessageBubble
                key={message.id}
                role={message.role as "user" | "assistant" | "system"}
                text={text || "(tool call in progress)"}
              />
            );
          })
        )}

        {error && (
          <div className="rounded-lg border border-[#e0b6b1] bg-[#fbeae7] p-3 text-sm">
            <p className="font-bold text-[#7a2e25]">Chat error</p>
            <p className="mt-1 text-[#5a2218]">{error.message}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            className="cursor-pointer rounded-full border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-1.5 text-xs font-semibold text-[#435149] transition-colors duration-200 hover:bg-[#e7f2ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isStreaming}
            onClick={() => handleSuggestion(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <input
          className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49]"
          disabled={isStreaming}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the AI agent..."
          value={input}
        />
        <button
          className="cursor-pointer rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#0f4536] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={isStreaming || !input.trim()}
          type="submit"
        >
          Send
        </button>
      </form>
    </article>
  );
}
