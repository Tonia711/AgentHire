"use client";

import { usePathname } from "next/navigation";
import {
  AppShell,
  SendTaskRequestBox,
} from "../kiwi-components";
import { useKiwiState } from "../kiwi-state";

export default function ClientPage() {
  const pathname = usePathname();
  const {
    connectWallet,
    invoices,
    sendTaskRequest,
    taskRequests,
    walletConnected,
  } = useKiwiState();
  const clientId = pathname.startsWith("/business2") ? "client-2" : "client-1";
  const clientName = clientId === "client-2" ? "Client 2" : "Client 1";
  const clientRequests = taskRequests.filter((request) => request.clientId === clientId);
  const clientInvoices = invoices.filter((invoice) => invoice.clientId === clientId);
  const acceptedJobs = clientRequests.filter((request) => request.acceptedContractorId);
  const unpaidInvoices = clientInvoices.filter((invoice) => invoice.status !== "PAID");
  const moneyPath = clientId === "client-2" ? "/business2/money" : "/business/money";

  return (
    <AppShell
      alertCount={unpaidInvoices.length}
      alertLabel={`${unpaidInvoices.length} bill${unpaidInvoices.length === 1 ? "" : "s"} to pay`}
      eyebrow={clientName}
      onWalletClick={connectWallet}
      role="business"
      title="Business Home"
      walletConnected={walletConnected}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="space-y-6" aria-label="Business owner workflow">
          <SendTaskRequestBox
            onSendRequest={(input) => sendTaskRequest({ ...input, clientId })}
          />
        </section>

        <aside className="space-y-6" aria-label="Business snapshot">
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Today</h2>
              <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
                Snapshot
              </span>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-md bg-[#fbfcf8] p-3">
                <p className="font-bold">Active contractors</p>
                <p className="mt-1 text-[#607066]">{acceptedJobs.length} accepted job{acceptedJobs.length === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-md bg-[#fbfcf8] p-3">
                <p className="font-bold">Awaiting your action</p>
                <p className="mt-1 text-[#607066]">{unpaidInvoices.length} bill{unpaidInvoices.length === 1 ? "" : "s"} ready to pay</p>
              </div>
              <div className="rounded-md bg-[#fbfcf8] p-3">
                <p className="font-bold">Recent activity</p>
                <p className="mt-1 text-[#607066]">
                  {clientRequests[0] ? `${clientRequests[0].task} posted` : "Post a job to start the activity feed."}
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Money</h2>
            <p className="mt-2 text-sm text-[#607066]">
              Bills, wallet connection, payment actions, and Trust Vault records are now on the Money page.
            </p>
            <a className="mt-5 inline-block rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white" href={moneyPath}>
              Open Money
            </a>
          </article>
        </aside>
      </div>
    </AppShell>
  );
}
