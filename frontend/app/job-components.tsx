"use client";

import { JobDetails, JobStatus, Offer } from "./job-state";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        status === "OPEN"
          ? "bg-white text-[#435149]"
          : status === "IN_PROGRESS"
            ? "bg-[#f6c64f] text-[#17211d]"
            : status === "AWAITING_APPROVAL"
              ? "bg-[#fff4d5] text-[#7a5b00]"
              : "bg-[#e7f2ee] text-[#155b49]"
      }`}
      data-testid="job-status-badge"
    >
      {status}
    </span>
  );
}

export function OfferCard({
  disabled,
  isSelected,
  offer,
  onHire,
}: {
  disabled: boolean;
  isSelected: boolean;
  offer: Offer;
  onHire: (offer: Offer) => void;
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-[#dde4d8] bg-[#fbfcf8] p-4 md:grid-cols-[1fr_auto]">
      <div>
        <h3 className="text-lg font-bold">{offer.contractorName}</h3>
        <p className="mt-1 text-sm text-[#607066]">
          {offer.trade} | {offer.area} | {offer.price}
        </p>
      </div>
      <div className="flex items-center gap-3 md:justify-end">
        <span className="text-2xl font-bold text-[#155b49]">{offer.match}</span>
        <button
          aria-pressed={isSelected}
          className="rounded-md border border-[#b9c2b2] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          data-testid={`client-hire-${offer.id}`}
          disabled={disabled}
          onClick={() => onHire(offer)}
          type="button"
        >
          {isSelected ? "Hired" : "Hire Contractor"}
        </button>
      </div>
    </article>
  );
}

export function ClientActionsPanel({
  budget,
  canApprove,
  onApprove,
  onSaveQuote,
  paymentStatus,
  selectedContractor,
}: {
  budget: string;
  canApprove: boolean;
  onApprove: () => void;
  onSaveQuote: () => void;
  paymentStatus: string;
  selectedContractor: Offer | null;
}) {
  return (
    <article className="rounded-lg border border-[#d9ded2] bg-[#17211d] p-5 text-white shadow-sm">
      <h2 className="text-2xl font-bold">YouMoney wallet</h2>
      <p className="mt-2 text-sm text-[#c7d8d2]" aria-live="polite">
        {paymentStatus}
      </p>
      <div className="mt-5 rounded-lg bg-white/10 p-4">
        <p className="text-sm text-[#c7d8d2]">Escrow amount</p>
        <p className="mt-2 text-4xl font-bold">${Number(budget || 0).toFixed(2)}</p>
        <p className="mt-2 text-sm text-[#c7d8d2]">
          Selected contractor: {selectedContractor?.contractorName ?? "None yet"}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="rounded-md bg-[#f6c64f] px-4 py-3 text-sm font-bold text-[#17211d] disabled:cursor-not-allowed disabled:opacity-45"
          data-testid="client-approve-release-payment-button"
          disabled={!canApprove}
          onClick={onApprove}
          type="button"
        >
          Approve & Release Payment
        </button>
        <button
          className="rounded-md border border-white/30 px-4 py-3 text-sm font-bold"
          data-testid="client-save-quote-button"
          onClick={onSaveQuote}
          type="button"
        >
          Save quote
        </button>
      </div>
    </article>
  );
}

export function ContractorActionsPanel({
  canMarkComplete,
  job,
  onMarkComplete,
  selectedContractor,
  status,
}: {
  canMarkComplete: boolean;
  job: JobDetails;
  onMarkComplete: () => void;
  selectedContractor: Offer | null;
  status: JobStatus;
}) {
  if (!selectedContractor) {
    return (
      <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold">Assigned contractor</h2>
        <p className="mt-2 text-sm text-[#607066]">
          No contractor has been hired for the current job yet.
        </p>
      </article>
    );
  }

  return (
    <article
      className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm"
      data-testid="assigned-contractor-section"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
            Assigned contractor
          </p>
          <h2 className="mt-1 text-2xl font-bold">{selectedContractor.contractorName}</h2>
          <p className="mt-2 text-sm text-[#607066]">
            Assigned to {job.service} in {job.location}.
          </p>
        </div>
        <JobStatusBadge status={status} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Job</dt><dd>{job.service}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Budget</dt><dd>${job.budget}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Contractor area</dt><dd>{selectedContractor.area}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Rate</dt><dd>{selectedContractor.price}</dd></div>
      </dl>
      <button
        className="mt-5 rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        data-testid="contractor-mark-complete-button"
        disabled={!canMarkComplete}
        onClick={onMarkComplete}
        type="button"
      >
        Mark as Complete
      </button>
    </article>
  );
}
