"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  dummyContractorAccounts,
  useKiwiState,
} from "../../kiwi-state";
import TempNav from "../../temp-nav";

export default function DummyContractorPage() {
  const params = useParams<{ contractorId: string }>();
  const contractor = dummyContractorAccounts.find(
    (account) => account.id === params.contractorId,
  );
  const { respondToTaskRequest, taskRequests } = useKiwiState();

  if (!contractor) {
    return (
      <main className="min-h-screen bg-[#f7f8f4] p-8 text-[#17211d]">
        <TempNav />
        <h1 className="text-3xl font-bold">Contractor not found</h1>
        <Link className="mt-4 inline-block rounded-md border border-[#b9c2b2] px-4 py-2 text-sm font-semibold" href="/client">
          Back to business dashboard
        </Link>
      </main>
    );
  }

  const assignedRequests = taskRequests.filter((request) =>
    (request.matchedContractorIds ?? []).includes(contractor.id),
  );

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <TempNav />
      <header className="border-b border-[#d9ded2] bg-[#fffdf7]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
              Dummy contractor account
            </p>
            <h1 className="mt-1 text-3xl font-bold">{contractor.name}</h1>
            <p className="mt-2 text-sm text-[#607066]">
              {contractor.service} | {contractor.position} | ${contractor.minPrice}-${contractor.maxPrice}
            </p>
          </div>
          <Link className="rounded-md border border-[#b9c2b2] px-4 py-2 text-sm font-semibold" href="/client">
            Business dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Requests sent by AI filter</h2>
            <span className="rounded-full bg-[#e7f2ee] px-3 py-1 text-xs font-bold text-[#155b49]">
              {assignedRequests.length} matched
            </span>
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

                return (
                  <article className="rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4" key={request.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{request.task}</h3>
                        <p className="mt-1 text-sm text-[#607066]">
                          {request.location} | {request.priceRange} | {request.createdAt}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#155b49]">
                        {response}
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
                  </article>
                );
              })
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
