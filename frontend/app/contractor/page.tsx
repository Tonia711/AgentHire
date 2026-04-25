"use client";

import Link from "next/link";
import { CivicStub } from "../../components/CivicStub";
import { LuminSignButton } from "../../components/LuminSignButton";
import { ContractorStatusBadge, WalletPanel } from "../kiwi-components";
import { useKiwiState } from "../kiwi-state";
import TempNav from "../temp-nav";

export default function ContractorPage() {
  const {
    contractor,
    setAttestationUid,
    simulateVerification,
    walletConnected,
  } = useKiwiState();

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <TempNav />
      <header className="border-b border-[#d9ded2] bg-[#fffdf7]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
              Contractor onboarding
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Civic KYC, Lumin Sign, and wallet readiness
            </h1>
          </div>
          <Link className="rounded-md border border-[#b9c2b2] px-4 py-2 text-sm font-semibold" href="/">
            Back to sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <aside className="space-y-6">
          <WalletPanel connected={walletConnected} />
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Invite details</h2>
            {contractor ? (
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Name</dt><dd>{contractor.name}</dd></div>
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Email</dt><dd>{contractor.email}</dd></div>
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Trade</dt><dd>{contractor.trade}</dd></div>
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Rate</dt><dd>${contractor.hourlyRate}/hr</dd></div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-[#607066]">
                No invite yet. Use the business dashboard to invite Sarah.
              </p>
            )}
          </article>
        </aside>

        <section className="space-y-6" aria-label="Contractor onboarding checklist">
          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Onboarding checklist</h2>
                <p className="mt-2 text-sm text-[#607066]">
                  These are demo stubs that match the plan’s Civic and Lumin potholes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CivicStub
                  verified={Boolean(contractor && contractor.civicPassId !== "pending")}
                />
                {contractor && <ContractorStatusBadge status={contractor.status} />}
              </div>
            </div>
            <ol className="mt-5 grid gap-3 text-sm">
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">1. Accept invite from business owner</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">2. Complete Civic Pass KYC stub</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">3. Sign contractor agreement via Lumin Sign web flow</li>
              <li className="rounded-md bg-[#fbfcf8] px-3 py-3 font-semibold">4. Anchor document hash with EAS on Fuji</li>
            </ol>
            <div className="mt-5 grid gap-3">
              {contractor && walletConnected ? (
                <LuminSignButton
                  civicPassId={contractor.civicPassId}
                  contractorAddress={contractor.walletAddress}
                  contractorId={contractor.id}
                  documentTitle={contractor.luminDocument}
                  onAttested={setAttestationUid}
                />
              ) : null}
              <button
                className="cursor-pointer rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold text-[#17211d] transition-colors duration-200 hover:bg-[#fbfcf8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!contractor}
                onClick={simulateVerification}
                type="button"
              >
                Simulate KYC + signature (offline demo)
              </button>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Contract vault preview</h2>
            {contractor?.attestationUid ? (
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Civic Pass ID</dt><dd>{contractor.civicPassId}</dd></div>
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Lumin document</dt><dd>{contractor.luminDocument}</dd></div>
                <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">EAS UID</dt><dd>{contractor.attestationUid}</dd></div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-[#607066]">
                Complete the demo checklist to reveal the vault evidence.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
