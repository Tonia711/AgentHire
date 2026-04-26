"use client";

import { usePathname } from "next/navigation";
import {
  AppShell,
  InvoicePanel,
  VaultViewer,
  WalletPanel,
} from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function BusinessMoneyPage() {
  const pathname = usePathname();
  const {
    connectWallet,
    contractor,
    dummyContractors,
    invoices,
    payInvoice,
    simulateVerification,
    walletConnected,
  } = useKiwiState();
  const clientId = pathname.startsWith("/business2") ? "client-2" : "client-1";
  const clientName = clientId === "client-2" ? "Client 2" : "Client 1";
  const clientInvoices = invoices.filter((invoice) => invoice.clientId === clientId);

  return (
    <AppShell
      alertCount={clientInvoices.filter((invoice) => invoice.status !== "PAID").length}
      alertLabel={`${clientInvoices.filter((invoice) => invoice.status !== "PAID").length} bill${clientInvoices.filter((invoice) => invoice.status !== "PAID").length === 1 ? "" : "s"} to pay`}
      eyebrow={clientName}
      onWalletClick={connectWallet}
      role="business"
      title="Money"
      walletConnected={walletConnected}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="space-y-6" aria-label="Bills and payments">
          <InvoicePanel
            contractors={dummyContractors}
            invoices={clientInvoices}
            onPayInvoice={payInvoice}
          />
        </section>

        <aside className="space-y-6" aria-label="Wallet and trust records">
          <WalletPanel connected={walletConnected} onConnect={connectWallet} />
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Trust setup demo</h2>
            <p className="mt-2 text-sm text-[#607066]">
              For the hackathon demo, this simulates identity check, agreement signing, and Trust Vault record creation.
            </p>
            <button
              className="mt-5 rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!contractor}
              onClick={simulateVerification}
              type="button"
            >
              Complete identity + agreement demo
            </button>
          </article>
          <VaultViewer contractor={contractor} />
        </aside>
      </div>
    </AppShell>
  );
}
