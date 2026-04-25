"use client";

import { FormEvent, useState } from "react";
import { RequestStatus, ServiceRequest } from "./job-state";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        status === "OPEN" ? "bg-[#e7f2ee] text-[#155b49]" : "bg-white text-[#435149]"
      }`}
      data-testid="request-status-badge"
    >
      {status}
    </span>
  );
}

export function ClientRequestForm({
  disabled,
  onSubmitRequest,
}: {
  disabled: boolean;
  onSubmitRequest: (request: ServiceRequest) => void;
}) {
  const [serviceType, setServiceType] = useState("Emergency plumbing repair");
  const [jobDescription, setJobDescription] = useState(
    "Pipe under the vanity is leaking and needs same-day attention.",
  );
  const [budget, setBudget] = useState("300-500");
  const [location, setLocation] = useState("Auckland, NZ");
  const [urgency, setUrgency] = useState("Urgent, today");
  const [contactPreference, setContactPreference] = useState("Email");
  const [notes, setNotes] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmitRequest({
      serviceType,
      jobDescription,
      budget,
      location,
      urgency,
      contactPreference,
      notes,
    });
  }

  return (
    <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="service-type">
        Service type
        <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-service-type-input" disabled={disabled} id="service-type" onChange={(event) => setServiceType(event.target.value)} required value={serviceType} />
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="request-location">
        Location
        <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-location-input" disabled={disabled} id="request-location" onChange={(event) => setLocation(event.target.value)} required value={location} />
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="request-budget">
        Price range / budget
        <input className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-budget-input" disabled={disabled} id="request-budget" onChange={(event) => setBudget(event.target.value)} required value={budget} />
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="request-urgency">
        Preferred date or urgency
        <select className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-urgency-select" disabled={disabled} id="request-urgency" onChange={(event) => setUrgency(event.target.value)} value={urgency}>
          <option>Urgent, today</option>
          <option>Tomorrow</option>
          <option>This week</option>
          <option>Flexible</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="contact-preference">
        Contact preference
        <select className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-contact-preference-select" disabled={disabled} id="contact-preference" onChange={(event) => setContactPreference(event.target.value)} value={contactPreference}>
          <option>Email</option>
          <option>Phone</option>
          <option>Text message</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold md:col-span-2" htmlFor="job-description">
        Job description
        <textarea className="min-h-28 rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-job-description-input" disabled={disabled} id="job-description" onChange={(event) => setJobDescription(event.target.value)} required value={jobDescription} />
      </label>
      <label className="grid gap-2 text-sm font-semibold md:col-span-2" htmlFor="request-notes">
        Optional notes
        <textarea className="min-h-24 rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal" data-testid="request-notes-input" disabled={disabled} id="request-notes" onChange={(event) => setNotes(event.target.value)} value={notes} />
      </label>
      <button className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 md:w-fit" data-testid="submit-service-request-button" disabled={disabled} type="submit">
        Submit Request
      </button>
    </form>
  );
}

export function RequestSummaryCard({
  request,
  status,
}: {
  request: ServiceRequest | null;
  status: RequestStatus;
}) {
  if (!request) {
    return (
      <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Request Summary</h2>
          <RequestStatusBadge status={status} />
        </div>
        <p className="mt-3 text-sm text-[#607066]">
          No request has been submitted yet.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm" data-testid="request-summary-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Request Summary</h2>
        <RequestStatusBadge status={status} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Service type</dt><dd>{request.serviceType}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Budget</dt><dd>{request.budget}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Location</dt><dd>{request.location}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Urgency</dt><dd>{request.urgency}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3"><dt className="font-semibold">Contact</dt><dd>{request.contactPreference}</dd></div>
        <div className="rounded-md bg-[#fbfcf8] p-3 md:col-span-2"><dt className="font-semibold">Description</dt><dd>{request.jobDescription}</dd></div>
        {request.notes && (
          <div className="rounded-md bg-[#fbfcf8] p-3 md:col-span-2"><dt className="font-semibold">Notes</dt><dd>{request.notes}</dd></div>
        )}
      </dl>
    </article>
  );
}
