"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "../../../kiwi-components";
import { dummyContractorAccounts, useKiwiState } from "../../../kiwi-state";

export default function ContractorHistoryPage() {
  const params = useParams<{ contractorId: string }>();
  const contractor = dummyContractorAccounts.find(
    (account) => account.id === params.contractorId,
  );
  const { connectWallet, taskRequests, walletConnected } = useKiwiState();

  if (!contractor) {
    return (
      <main className="min-h-screen bg-[#f7f8f4] p-8 text-[#17211d]">
        <h1 className="text-3xl font-bold">Contractor not found</h1>
        <Link className="mt-4 inline-block rounded-md border border-[#b9c2b2] px-4 py-2 text-sm font-semibold" href="/business">
          Back to workspace
        </Link>
      </main>
    );
  }

  const acceptedRequests = taskRequests.filter(
    (request) => request.contractorResponses?.[contractor.id] === "ACCEPTED",
  );

  return (
    <AppShell
      eyebrow={`${contractor.expertise} | ${contractor.position} | $${contractor.hourlyRate}/hr`}
      onWalletClick={connectWallet}
      role="contractor"
      title={`${contractor.name} History`}
      walletConnected={walletConnected}
    >
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Job history</h2>
              <p className="mt-1 text-sm text-[#607066]">
                Accepted jobs for this contractor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
                {acceptedRequests.length} accepted
              </span>
              <Link className="rounded-md border border-[#b9c2b2] px-3 py-2 text-sm font-bold" href={`/contractors/${contractor.id}`}>
                View requests
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {acceptedRequests.length === 0 ? (
              <p className="text-sm text-[#607066]">
                Accepted jobs will appear here.
              </p>
            ) : (
              acceptedRequests.map((request) => (
                <div className="rounded-md border border-[#dde4d8] bg-[#fbfcf8] px-3 py-3 text-sm" key={`history-${request.id}`}>
                  <p className="font-bold text-[#17211d]">{request.task}</p>
                  <p className="mt-1 text-[#607066]">
                    {request.clientId === "client-2" ? "Client 2" : "Client 1"} | {request.location} | {request.priceRange} | {request.createdAt}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
