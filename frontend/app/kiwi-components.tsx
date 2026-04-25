"use client";

import { FormEvent, useState } from "react";
import {
  ChatMessage,
  Contractor,
  ContractorStatus,
  DummyContractorAccount,
  Invoice,
  InvoiceStatus,
  TaskRequest,
} from "./kiwi-state";

export function ContractorStatusBadge({ status }: { status: ContractorStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        status === "INVITED"
          ? "bg-[#fff4d5] text-[#7a5b00]"
          : status === "ACTIVE"
            ? "bg-[#e7f2ee] text-[#155b49]"
            : "bg-[#eef2ff] text-[#243b7a]"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        status === "PAID" ? "bg-[#e7f2ee] text-[#155b49]" : "bg-[#f6c64f] text-[#17211d]"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function WalletPanel({
  connected,
  onConnect,
}: {
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-[#17211d] p-5 text-white shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a8cbbf]">
        Fuji wallet
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        {connected ? "Wallet connected" : "Connect wallet"}
      </h2>
      <p className="mt-2 text-sm text-[#c7d8d2]">
        RainbowKit + wagmi will replace this stub when dependencies are installed.
      </p>
      <button
        className="mt-5 rounded-md bg-[#f6c64f] px-4 py-3 text-sm font-bold text-[#17211d] disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="connect-fuji-wallet-button"
        disabled={connected}
        onClick={onConnect}
        type="button"
      >
        {connected ? "Connected to Fuji" : "Connect Fuji wallet"}
      </button>
    </article>
  );
}

export function SendTaskRequestBox({
  onSendRequest,
}: {
  onSendRequest: (input: {
    task: string;
    priceRange: string;
    location: string;
  }) => void;
}) {
  const [task, setTask] = useState("Install two new office power outlets");
  const [minPrice, setMinPrice] = useState("300");
  const [maxPrice, setMaxPrice] = useState("600");
  const [location, setLocation] = useState("Wellington CBD");
  const [status, setStatus] = useState("Send a task request to store it locally.");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const min = Number(minPrice || 0);
    const max = Number(maxPrice || min);
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    const formattedPriceRange = `$${low}-$${high}`;

    onSendRequest({ task, priceRange: formattedPriceRange, location });
    setMinPrice(String(low));
    setMaxPrice(String(high));
    setStatus(`Request sent with price range ${formattedPriceRange}.`);
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Send request</h2>
      <p className="mt-2 text-sm text-[#607066]" aria-live="polite">
        {status}
      </p>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="task-request">
          Task
          <textarea className="min-h-24 rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-request-input" id="task-request" onChange={(event) => setTask(event.target.value)} required value={task} />
        </label>
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.75fr)_minmax(260px,1fr)]">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Price range</legend>
            <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold" htmlFor="task-min-price">
              Low
              <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-min-price-input" id="task-min-price" min="0" onChange={(event) => setMinPrice(event.target.value)} required type="number" value={minPrice} />
            </label>
            <label className="grid gap-2 text-sm font-semibold" htmlFor="task-max-price">
              High
              <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-max-price-input" id="task-max-price" min="0" onChange={(event) => setMaxPrice(event.target.value)} required type="number" value={maxPrice} />
            </label>
            </div>
          </fieldset>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="task-location">
            Location
            <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-location-input" id="task-location" onChange={(event) => setLocation(event.target.value)} required value={location} />
          </label>
        </div>
        <button className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white sm:w-fit" data-testid="send-task-request-button" type="submit">
          Send Request
        </button>
      </form>
    </article>
  );
}

export function TaskRequestList({
  contractors,
  requests,
}: {
  contractors: DummyContractorAccount[];
  requests: TaskRequest[];
}) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Local request database</h2>
        <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
          {requests.length} stored
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {requests.length === 0 ? (
          <p className="text-sm text-[#607066]">
            No requests stored yet. Submitted requests will persist in this browser.
          </p>
        ) : (
          requests.map((request) => (
            <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" data-testid="stored-task-request-card" key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{request.task}</h3>
                  <p className="mt-1 text-sm text-[#607066]">
                    {request.location} | {request.priceRange} | {request.createdAt}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#155b49]">
                  {request.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#607066]">
                  Sent to
                </p>
                {(request.matchedContractorIds ?? []).length === 0 ? (
                  <p className="text-sm text-[#607066]">No contractor matched the current budget and location.</p>
                ) : (
                  (request.matchedContractorIds ?? []).map((contractorId) => {
                    const contractor = contractors.find((item) => item.id === contractorId);

                    if (!contractor) {
                      return null;
                    }

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm" key={contractorId}>
                        <span>{contractor.name} | {contractor.position} | ${contractor.minPrice}-${contractor.maxPrice}</span>
                        <span className="font-bold text-[#155b49]">{request.contractorResponses?.[contractorId] ?? "PENDING"}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}

export function DummyContractorDashboard({
  contractors,
  requests,
}: {
  contractors: DummyContractorAccount[];
  requests: TaskRequest[];
}) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Contractor dashboard</h2>
        <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
          Live responses
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {contractors.map((contractor) => {
          const assignedRequests = requests.filter((request) =>
            (request.matchedContractorIds ?? []).includes(contractor.id),
          );
          const acceptedRequests = assignedRequests.filter(
            (request) => request.contractorResponses?.[contractor.id] === "ACCEPTED",
          );

          return (
            <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" key={contractor.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{contractor.name}</h3>
                  <p className="mt-1 text-sm text-[#607066]">
                    {contractor.service} | {contractor.position} | ${contractor.minPrice}-${contractor.maxPrice}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#155b49]">
                  {acceptedRequests.length} accepted
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {assignedRequests.length === 0 ? (
                  <p className="text-sm text-[#607066]">No matching requests sent yet.</p>
                ) : (
                  assignedRequests.map((request) => {
                    const response = request.contractorResponses?.[contractor.id] ?? "PENDING";

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm" key={request.id}>
                        <span>{request.task}</span>
                        <span
                          className={`font-bold ${
                            response === "ACCEPTED"
                              ? "text-[#155b49]"
                              : response === "REJECTED"
                                ? "text-[#8a342d]"
                                : "text-[#7a5b00]"
                          }`}
                        >
                          {response}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}

export function InviteContractorForm({
  onInvite,
}: {
  onInvite: (input: {
    name: string;
    email: string;
    trade: string;
    hourlyRate: string;
  }) => void;
}) {
  const [name, setName] = useState("Sarah");
  const [email, setEmail] = useState("sarah@email.co.nz");
  const [trade, setTrade] = useState("Electrician");
  const [hourlyRate, setHourlyRate] = useState("80");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onInvite({ name, email, trade, hourlyRate });
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Invite contractor</h2>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="contractor-name">
          Contractor name
          <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" id="contractor-name" onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="contractor-email">
          Email
          <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" id="contractor-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="contractor-trade">
          Trade
          <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" id="contractor-trade" onChange={(event) => setTrade(event.target.value)} required value={trade} />
        </label>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="hourly-rate">
          Hourly rate NZD
          <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" id="hourly-rate" min="1" onChange={(event) => setHourlyRate(event.target.value)} required type="number" value={hourlyRate} />
        </label>
        <button className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white md:w-fit" type="submit">
          Send invite
        </button>
      </form>
    </article>
  );
}

export function AIChatPanel({
  messages,
  onPrompt,
}: {
  messages: ChatMessage[];
  onPrompt: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("Invite Sarah the electrician, sarah@email.co.nz, $80/hour");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onPrompt(prompt);
    setPrompt("");
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">AI agent chat</h2>
      <div className="mt-5 grid max-h-80 gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.author === "agent" ? "bg-[#fbfcf8]" : "bg-[#e7f2ee]"
            }`}
            key={`${message.author}-${index}`}
          >
            <p className="font-bold">{message.author === "agent" ? "AI Agent" : "Business Owner"}</p>
            <p className="mt-1 text-[#435149]">{message.text}</p>
          </div>
        ))}
      </div>
      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 text-sm" onChange={(event) => setPrompt(event.target.value)} placeholder="Ask the agent..." required value={prompt} />
        <button className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white" type="submit">
          Send
        </button>
      </form>
    </article>
  );
}

export function ContractorList({ contractor }: { contractor: Contractor | null }) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Contractor dashboard</h2>
      {contractor ? (
        <div className="mt-5 rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{contractor.name}</h3>
              <p className="mt-1 text-sm text-[#607066]">
                {contractor.trade} | {contractor.email} | ${contractor.hourlyRate}/hr
              </p>
            </div>
            <ContractorStatusBadge status={contractor.status} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#607066]">No contractor invited yet.</p>
      )}
    </article>
  );
}

export function VaultViewer({ contractor }: { contractor: Contractor | null }) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Vault viewer</h2>
      {contractor?.attestationUid ? (
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Civic Pass</dt><dd>{contractor.civicPassId}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Lumin document</dt><dd>{contractor.luminDocument}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">EAS UID</dt><dd>{contractor.attestationUid}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Snowtrace</dt><dd>Fuji link placeholder</dd></div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-[#607066]">
          Civic, Lumin, and EAS records appear here after verification.
        </p>
      )}
    </article>
  );
}

export function InviteLinkCard({ contractor }: { contractor: Contractor | null }) {
  const [status, setStatus] = useState("No invite link generated yet.");

  async function copyInviteLink() {
    if (!contractor?.inviteLink) {
      setStatus("No invite link available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(contractor.inviteLink);
      setStatus("Invite link copied. Share it with the contractor.");
    } catch {
      setStatus("Clipboard blocked. Copy the link manually.");
    }
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Invite link</h2>
      <p className="mt-2 text-sm text-[#607066]" aria-live="polite">
        {status}
      </p>
      {contractor?.inviteLink ? (
        <>
          <p className="mt-3 break-all rounded-md bg-[#fbfcf8] p-3 text-sm">
            {contractor.inviteLink}
          </p>
          <button
            className="mt-4 rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold"
            onClick={copyInviteLink}
            type="button"
          >
            Copy invite link
          </button>
        </>
      ) : (
        <p className="mt-3 text-sm text-[#607066]">
          Ask the AI agent to invite a contractor and the onboarding link will appear here.
        </p>
      )}
    </article>
  );
}

export function InvoicePanel({
  invoice,
  onCreateInvoice,
  onPayInvoice,
}: {
  invoice: Invoice | null;
  onCreateInvoice: (hours: string) => void;
  onPayInvoice: () => void;
}) {
  const [hours, setHours] = useState("10");

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Invoice and dNZD payment</h2>
        {invoice && <InvoiceStatusBadge status={invoice.status} />}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-semibold" htmlFor="invoice-hours">
          Hours worked
          <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" id="invoice-hours" min="1" onChange={(event) => setHours(event.target.value)} type="number" value={hours} />
        </label>
        <button className="self-end rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold" onClick={() => onCreateInvoice(hours)} type="button">
          Create invoice
        </button>
      </div>
      {invoice && (
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Subtotal</dt><dd>${invoice.subtotal.toFixed(2)}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">GST 15%</dt><dd>${invoice.gst.toFixed(2)}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Total dNZD</dt><dd>{invoice.total.toFixed(2)}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Tx</dt><dd>{invoice.txHash}</dd></div>
        </dl>
      )}
      <button
        className="mt-5 rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!invoice || invoice.status === "PAID"}
        onClick={onPayInvoice}
        type="button"
      >
        Pay in dNZD
      </button>
    </article>
  );
}
