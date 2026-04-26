"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TempNav from "./temp-nav";
import {
  ChatMessage,
  Contractor,
  ContractorResponse,
  ContractorStatus,
  DummyContractorAccount,
  Invoice,
  InvoiceStatus,
  TaskRequest,
} from "./kiwi-state";

function getResponseLabel(response: ContractorResponse) {
  return response === "ACCEPTED_ELSEWHERE" ? "ACCEPTED ELSEWHERE" : response;
}

export function AppShell({
  alertCount = 0,
  alertLabel,
  children,
  eyebrow,
  onWalletClick,
  role,
  title,
  walletConnected,
}: {
  alertCount?: number;
  alertLabel?: string;
  children: ReactNode;
  eyebrow: string;
  onWalletClick?: () => void;
  role: "business" | "contractor";
  title: string;
  walletConnected: boolean;
}) {
  const pathname = usePathname();
  const isClientTwo = pathname.startsWith("/business2");
  const businessRoot = isClientTwo ? "/business2" : "/business";
  const businessNavItems = [
    ["Home", businessRoot],
    ["Posted Jobs", `${businessRoot}/jobs`],
    ["Money", `${businessRoot}/money`],
  ];
  const contractorMatch = pathname.match(/^\/contractors\/([^/]+)/);
  const contractorId = contractorMatch?.[1] ?? "mia-thompson";
  const contractorNavItems = contractorMatch
    ? [
        ["Requests", `/contractors/${contractorId}`],
        ["History", `/contractors/${contractorId}/history`],
      ]
    : [
        ["Get Ready", "/contractor"],
        ["My Work", "/contractor/work"],
        ["My Records", "/contractor/records"],
        ["Wallet", "/contractor/wallet"],
        ["Settings", "/contractor/settings"],
      ];
  const navItems = role === "business" ? businessNavItems : contractorNavItems;

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[#d9ded2] bg-[#fffdf7] p-5 lg:border-b-0 lg:border-r">
          <Link className="block text-xl font-bold" href="/">
            KiwiContract
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#587064]">
            {role === "business" ? "Business" : "Contractor"}
          </p>
          <nav className="mt-6 flex gap-2 overflow-x-auto lg:grid lg:overflow-visible" aria-label={`${role} navigation`}>
            {navItems.map(([label, href]) => {
              const baseHref = href.split("#")[0];
              const isActive =
                (role === "contractor" && label === "Requests" && pathname === baseHref) ||
                (role === "contractor" && label !== "Requests" && pathname === baseHref) ||
                (href === "/business" && pathname === "/client") ||
                (role === "business" && pathname === baseHref);

              return (
                <Link
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold ${
                    isActive ? "bg-[#e7f2ee] text-[#155b49]" : "text-[#435149] hover:bg-[#f2f5ee]"
                  }`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section>
          <header className="border-b border-[#d9ded2] bg-[#fffdf7]">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-bold">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {role === "business" && (
                  <label className="hidden min-w-64 rounded-md border border-[#cfd8ca] bg-white px-3 py-2 text-sm text-[#607066] md:block">
                    Search jobs, bills, contractors
                  </label>
                )}
                <button
                  className={`rounded-full border px-3 py-2 text-sm font-bold ${
                    alertCount > 0
                      ? "border-[#f6c64f] bg-[#fff4d5] text-[#7a5b00]"
                      : "border-[#d9ded2] bg-white text-[#17211d]"
                  }`}
                  type="button"
                >
                  {alertCount > 0 ? alertLabel ?? `Alerts (${alertCount})` : "Alerts"}
                </button>
                <button
                  className="rounded-full border border-[#b9c2b2] bg-white px-3 py-2 text-sm font-bold text-[#17211d]"
                  onClick={onWalletClick}
                  type="button"
                >
                  {walletConnected ? "Wallet connected" : "Wallet disconnected"}
                </button>
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
      <TempNav />
    </main>
  );
}

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
        status === "PAID"
          ? "bg-[#e7f2ee] text-[#155b49]"
          : status === "SENT_TO_CLIENT"
            ? "bg-[#fff4d5] text-[#7a5b00]"
            : "bg-[#eef2ff] text-[#243b7a]"
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
        Wallet
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        {connected ? "Wallet connected" : "Connect wallet"}
      </h2>
      <p className="mt-2 text-sm text-[#c7d8d2]">
        Wallet connection will be wired into the real payment flow later.
      </p>
      <button
        className="mt-5 rounded-md bg-[#f6c64f] px-4 py-3 text-sm font-bold text-[#17211d] disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="connect-fuji-wallet-button"
        disabled={connected}
        onClick={onConnect}
        type="button"
      >
        {connected ? "Connected" : "Connect wallet"}
      </button>
    </article>
  );
}

export function ResetDemoPanel({ onReset }: { onReset: () => void }) {
  const [status, setStatus] = useState("Clear local demo data when you want to test from scratch.");

  function handleReset() {
    onReset();
    setStatus("Local requests and contractor responses have been reset.");
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Demo reset</h2>
      <p className="mt-2 text-sm text-[#607066]" aria-live="polite">
        {status}
      </p>
      <button
        className="mt-5 rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold text-[#17211d]"
        data-testid="reset-local-demo-button"
        onClick={handleReset}
        type="button"
      >
        Reset local demo
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
  const [task, setTask] = useState("Window cleaning for a small office frontage");
  const [minPrice, setMinPrice] = useState("40");
  const [maxPrice, setMaxPrice] = useState("80");
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
      <h2 className="text-2xl font-bold">Post a job</h2>
      <p className="mt-2 text-sm text-[#607066]" aria-live="polite">
        {status}
      </p>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="task-request">
          Task
          <textarea className="min-h-24 rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-request-input" id="task-request" onChange={(event) => setTask(event.target.value)} required value={task} />
        </label>
        <div className="grid gap-4">
          <fieldset className="grid max-w-[440px] gap-2">
            <legend className="text-sm font-semibold">Hourly rate range</legend>
            <div className="grid grid-cols-2 gap-8">
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
          <label className="grid max-w-[420px] gap-2 text-sm font-semibold" htmlFor="task-location">
            Location
            <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="task-location-input" id="task-location" onChange={(event) => setLocation(event.target.value)} required value={location} />
          </label>
        </div>
        <button className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white sm:w-fit" data-testid="send-task-request-button" type="submit">
          Post Job
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
        <h2 className="text-2xl font-bold">Jobs</h2>
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
              {(() => {
                const acceptedContractor = contractors.find(
                  (contractor) =>
                    request.contractorResponses?.[contractor.id] === "ACCEPTED",
                );

                return acceptedContractor ? (
                  <div className="mb-4 rounded-md border border-[#b9d8c8] bg-[#e7f2ee] px-3 py-3 text-sm">
                    <p className="font-bold text-[#155b49]">
                      Accepted by {acceptedContractor.name}
                    </p>
                    <p className="mt-1 text-[#435149]">
                      {acceptedContractor.expertise} | {acceptedContractor.position} | ${acceptedContractor.hourlyRate}/hr
                    </p>
                  </div>
                ) : null;
              })()}
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
                        <span>{contractor.name} | {contractor.expertise} | {contractor.position} | ${contractor.hourlyRate}/hr</span>
                        <span
                          className={`font-bold ${
                            request.contractorResponses?.[contractorId] === "ACCEPTED"
                              ? "text-[#155b49]"
                              : request.contractorResponses?.[contractorId] === "REJECTED"
                                ? "text-[#8a342d]"
                                : "text-[#7a5b00]"
                          }`}
                        >
                          {getResponseLabel(request.contractorResponses?.[contractorId] ?? "PENDING")}
                        </span>
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
  const matchedContractors = contractors
    .map((contractor) => ({
      contractor,
      assignedRequests: requests.filter((request) =>
        (request.matchedContractorIds ?? []).includes(contractor.id),
      ),
    }))
    .filter(({ assignedRequests }) => assignedRequests.length > 0);

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Matched contractors</h2>
        <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
          {matchedContractors.length} shown
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {requests.length === 0 ? (
          <p className="text-sm text-[#607066]">
            No request has been sent yet. Matching contractors will appear here after the AI filter runs.
          </p>
        ) : matchedContractors.length === 0 ? (
          <p className="text-sm text-[#607066]">
            No contractors matched the current request budget and location.
          </p>
        ) : (
          matchedContractors.map(({ contractor, assignedRequests }) => {
          const acceptedRequests = assignedRequests.filter(
            (request) => request.contractorResponses?.[contractor.id] === "ACCEPTED",
          );
          const latestAcceptedRequest = acceptedRequests[0];

          return (
            <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" key={contractor.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{contractor.name}</h3>
                  <p className="mt-1 text-sm text-[#607066]">
                    {contractor.expertise} | {contractor.position} | ${contractor.hourlyRate}/hr
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#155b49]">
                  {acceptedRequests.length} accepted
                </span>
              </div>

              {latestAcceptedRequest && (
                <div className="mt-4 rounded-md border border-[#b9d8c8] bg-[#e7f2ee] px-3 py-3 text-sm">
                  <p className="font-bold text-[#155b49]">
                    Current accepted job
                  </p>
                  <p className="mt-1 text-[#435149]">
                    {latestAcceptedRequest.task} | {latestAcceptedRequest.location} | {latestAcceptedRequest.priceRange}
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {assignedRequests.map((request) => {
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
                          {getResponseLabel(response)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </article>
          );
        }))}
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
      <h2 className="text-2xl font-bold">Trust Vault</h2>
      {contractor?.attestationUid ? (
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Identity Check</dt><dd>{contractor.civicPassId}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Signed Agreement</dt><dd>{contractor.luminDocument}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Trust Record</dt><dd>{contractor.attestationUid}</dd></div>
          <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Snowtrace</dt><dd>Fuji link placeholder</dd></div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-[#607066]">
          Identity, agreement, and payment records appear here after verification.
        </p>
      )}
    </article>
  );
}

export function InvoicePanel({
  contractors,
  invoices,
  onPayInvoice,
}: {
  contractors: DummyContractorAccount[];
  invoices: Invoice[];
  onPayInvoice: (invoiceId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Bills received</h2>
        <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
          {invoices.length} bill{invoices.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#607066]">
        Accepted contractors automatically send bills here. Fuji wallet payment will be wired in later.
      </p>
      <div className="mt-5 grid gap-3">
        {invoices.length === 0 ? (
          <p className="rounded-md bg-[#fbfcf8] p-3 text-sm text-[#607066]">
            No bills yet. A bill will appear after a contractor accepts a request.
          </p>
        ) : (
          invoices.map((invoice) => {
            const billingContractor = contractors.find(
              (contractor) => contractor.id === invoice.contractorId,
            );

            return (
              <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" key={invoice.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">
                      {invoice.description ?? "Contractor bill"}
                    </h3>
                    <p className="mt-1 text-sm text-[#607066]">
                      {billingContractor?.name ?? "Contractor"} | {invoice.hours} hours | {invoice.requestId}
                    </p>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-md bg-white p-3"><dt className="font-semibold">Subtotal</dt><dd>${invoice.subtotal.toFixed(2)}</dd></div>
                  <div className="rounded-md bg-white p-3"><dt className="font-semibold">GST 15%</dt><dd>${invoice.gst.toFixed(2)}</dd></div>
                  <div className="rounded-md bg-white p-3"><dt className="font-semibold">Total dNZD</dt><dd>{invoice.total.toFixed(2)}</dd></div>
                </dl>
                {invoice.notes && (
                  <p className="mt-3 text-sm text-[#607066]">{invoice.notes}</p>
                )}
                <button
                  className="mt-4 rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={invoice.status === "PAID"}
                  onClick={() => onPayInvoice(invoice.id)}
                  type="button"
                >
                  {invoice.status === "PAID" ? "Paid" : "Pay with Fuji wallet"}
                </button>
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}
