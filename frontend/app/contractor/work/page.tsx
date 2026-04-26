"use client";

import { AppShell, InvoicePanel } from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function ContractorWorkPage() {
  const {
    connectWallet,
    invoices,
    payInvoice,
    taskRequests,
    walletConnected,
  } = useKiwiState();
  const activeJobs = taskRequests.filter((request) => request.acceptedContractorId);
  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "PAID");

  return (
    <AppShell
      eyebrow="Contractor"
      onWalletClick={connectWallet}
      role="contractor"
      title="My Work"
      walletConnected={walletConnected}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <section className="grid gap-3 md:grid-cols-3" aria-label="At a glance">
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#607066]">Active jobs</p>
            <p className="mt-2 text-3xl font-bold">{activeJobs.length}</p>
          </article>
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#607066]">Bills awaiting payment</p>
            <p className="mt-2 text-3xl font-bold">{unpaidInvoices.length}</p>
          </article>
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#607066]">Paid this month</p>
            <p className="mt-2 text-3xl font-bold">
              ${invoices.filter((invoice) => invoice.status === "PAID").reduce((total, invoice) => total + invoice.total, 0).toFixed(2)}
            </p>
          </article>
        </section>
        <InvoicePanel
          invoices={invoices}
          onPayInvoice={payInvoice}
        />
      </div>
    </AppShell>
  );
}
