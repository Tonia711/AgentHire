"use client";

import Link from "next/link";
import { AIChatLive } from "../../components/AIChatLive";
import { CivicStub } from "../../components/CivicStub";
import {
  DummyContractorDashboard,
  InviteLinkCard,
  InvoicePanel,
  SendTaskRequestBox,
} from "../kiwi-components";
import { useKiwiState } from "../kiwi-state";

export default function ClientPage() {
  const pathname = usePathname();
  const {
    contractor,
    createInvoice,
    dummyContractors,
    invoice,
    isCreatingInvoice,
    isPaying,
    payInvoice,
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
          <SendTaskRequestBox onSendRequest={sendTaskRequest} />
          <TaskRequestList contractors={dummyContractors} requests={taskRequests} />
          <DummyContractorDashboard
            contractors={dummyContractors}
            requests={taskRequests}
          />
          <AIChatLive />
          <InvoicePanel
            invoice={invoice}
            isCreating={isCreatingInvoice}
            isPaying={isPaying}
            onCreateInvoice={createInvoice}
            onPayInvoice={payInvoice}
          />
        </section>

        <aside className="space-y-6" aria-label="Wallet and verification">
          <WalletPanel connected={walletConnected} />
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Civic + Lumin demo controls</h2>
              <CivicStub
                verified={Boolean(contractor && contractor.civicPassId !== "pending")}
              />
            </div>
            <p className="mt-2 text-sm text-[#607066]">
              For the hackathon demo, this simulates Civic KYC, Lumin Sign, and EAS attestation completion.
            </p>
            <button
              className="mt-5 cursor-pointer rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#0f4536] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!contractor}
              onClick={simulateVerification}
              type="button"
            >
              Simulate Sarah verification
            </button>
          </article>
          <InviteLinkCard contractor={contractor} />
          <VaultViewer contractor={contractor} />
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
