"use client";

import Link from "next/link";
import { AIChatLive } from "../../components/AIChatLive";
import { CivicStub } from "../../components/CivicStub";
import {
  DummyContractorDashboard,
  InvoicePanel,
  SendTaskRequestBox,
  TaskRequestList,
  VaultViewer,
  WalletPanel,
} from "../kiwi-components";
import { useKiwiState } from "../kiwi-state";
import TempNav from "../temp-nav";

export default function ClientPage() {
  const {
    contractor,
    createInvoice,
    dummyContractors,
    invoice,
    isCreatingInvoice,
    isPaying,
    payInvoice,
    sendTaskRequest,
    simulateVerification,
    taskRequests,
    walletConnected,
  } = useKiwiState();

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <TempNav />
      <header className="border-b border-[#d9ded2] bg-[#fffdf7]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
              KiwiContract business dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Invite, verify, invoice, and pay contractors in dNZD
            </h1>
          </div>
          <Link className="rounded-md border border-[#b9c2b2] px-4 py-2 text-sm font-semibold" href="/">
            Back to sign in
          </Link>
        </div>
      </header>

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
          <VaultViewer contractor={contractor} />
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Bounty alignment</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">Avalanche Fuji transaction placeholders</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">Mock dNZD payment flow</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">Civic + Lumin verification stubs</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">Binance market check copy before payment</li>
            </ul>
          </article>
        </aside>
      </div>
    </main>
  );
}
