"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ContractorResponse,
  dummyContractorAccounts,
  useKiwiState,
} from "../../kiwi-state";
import { AppShell } from "../../kiwi-components";

function getResponseLabel(response: ContractorResponse) {
  return response === "ACCEPTED_ELSEWHERE" ? "ACCEPTED ELSEWHERE" : response;
}

export default function DummyContractorPage() {
  const params = useParams<{ contractorId: string }>();
  const contractor = dummyContractorAccounts.find(
    (account) => account.id === params.contractorId,
  );
  const {
    connectWallet,
    invoices,
    respondToTaskRequest,
    taskRequests,
    walletConnected,
  } = useKiwiState();

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

  const assignedRequests = taskRequests.filter((request) =>
    (request.matchedContractorIds ?? []).includes(contractor.id),
  );

  return (
    <AppShell
      eyebrow={`${contractor.expertise} | ${contractor.position} | $${contractor.hourlyRate}/hr`}
      onWalletClick={connectWallet}
      role="contractor"
      title={contractor.name}
      walletConnected={walletConnected}
    >
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Requests</h2>
              <p className="mt-1 text-sm text-[#607066]">
                Matching jobs sent to this contractor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
                {assignedRequests.length} matched
              </span>
              <Link className="rounded-md border border-[#b9c2b2] px-3 py-2 text-sm font-bold" href={`/contractors/${contractor.id}/history`}>
                View history
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {assignedRequests.length === 0 ? (
              <p className="text-sm text-[#607066]">
                No requests have matched this contractor yet. Send a window cleaning request from the business dashboard.
              </p>
            ) : (
              assignedRequests.map((request) => {
                const response = request.contractorResponses?.[contractor.id] ?? "PENDING";
                const hasResponded = response !== "PENDING";
                const acceptedByThisContractor = response === "ACCEPTED";
                const acceptedElsewhere = response === "ACCEPTED_ELSEWHERE";
                const clientName = request.clientId === "client-2" ? "Client 2" : "Client 1";
                const invoice = invoices.find(
                  (item) =>
                    item.requestId === request.id &&
                    item.contractorId === contractor.id,
                );

                return (
                  <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" key={request.id}>
                    {acceptedByThisContractor && (
                      <div className="mb-4 rounded-md border border-[#b9d8c8] bg-[#e7f2ee] px-3 py-3 text-sm">
                        <p className="font-bold text-[#155b49]">
                          You accepted this request
                        </p>
                        <p className="mt-1 text-[#435149]">
                          A bill was automatically sent to the client for Fuji wallet payment.
                        </p>
                      </div>
                    )}
                    {acceptedElsewhere && (
                      <div className="mb-4 rounded-md border border-[#ead8aa] bg-[#fff4d5] px-3 py-3 text-sm">
                        <p className="font-bold text-[#7a5b00]">
                          Accepted elsewhere
                        </p>
                        <p className="mt-1 text-[#435149]">
                          Another contractor accepted this request first, so this offer is now closed.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{request.task}</h3>
                        <p className="mt-1 text-sm text-[#607066]">
                          {clientName} | {request.location} | {request.priceRange} | {request.createdAt}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#155b49]">
                        {getResponseLabel(response)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={hasResponded}
                        onClick={() => respondToTaskRequest(request.id, contractor.id, "ACCEPTED")}
                        type="button"
                      >
                        Accept
                      </button>
                      <button
                        className="rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={hasResponded}
                        onClick={() => respondToTaskRequest(request.id, contractor.id, "REJECTED")}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                    {acceptedByThisContractor && invoice?.requestId === request.id && (
                      <div className="mt-4 rounded-md border border-[#b9d8c8] bg-white p-3 text-sm">
                        <p className="font-bold text-[#155b49]">
                          Auto bill sent
                        </p>
                        <p className="mt-1 text-[#435149]">
                          {invoice.hours} hours at ${contractor.hourlyRate}/hr. Total due: ${invoice.total.toFixed(2)} dNZD.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
