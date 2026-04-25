"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export type JobStatus = "OPEN" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "COMPLETED";
export type RequestStatus = "DRAFT" | "OPEN";

export type Offer = {
  id: string;
  contractorName: string;
  trade: string;
  area: string;
  price: string;
  match: string;
};

export type JobDetails = {
  service: string;
  location: string;
  budget: string;
  timing: string;
};

export type ServiceRequest = {
  serviceType: string;
  jobDescription: string;
  budget: string;
  location: string;
  urgency: string;
  contactPreference: string;
  notes: string;
};

const initialOffers: Offer[] = [
  {
    id: "auckland-build-co",
    contractorName: "Auckland Build Co.",
    trade: "Renovation and fit-out",
    area: "Auckland Central",
    price: "$85/hr",
    match: "96%",
  },
  {
    id: "north-shore-electrical",
    contractorName: "North Shore Electrical",
    trade: "Electrical repairs",
    area: "Takapuna",
    price: "$72/hr",
    match: "91%",
  },
  {
    id: "rapid-plumbing-crew",
    contractorName: "Rapid Plumbing Crew",
    trade: "Plumbing callouts",
    area: "Manukau",
    price: "$68/hr",
    match: "88%",
  },
];

type JobStateContextValue = {
  offers: Offer[];
  job: JobDetails;
  jobStatus: JobStatus;
  selectedContractor: Offer | null;
  paymentStatus: string;
  requestStatus: RequestStatus;
  serviceRequest: ServiceRequest | null;
  setJob: (job: JobDetails) => void;
  submitServiceRequest: (request: ServiceRequest) => void;
  hireContractor: (offer: Offer) => void;
  markComplete: () => void;
  approvePayment: () => void;
  saveQuote: () => void;
};

const JobStateContext = createContext<JobStateContextValue | null>(null);

export function JobStateProvider({ children }: { children: ReactNode }) {
  const [offers] = useState(initialOffers);
  const [job, setJob] = useState<JobDetails>({
    service: "Emergency plumbing repair",
    location: "Auckland, NZ",
    budget: "500",
    timing: "Urgent, today",
  });
  const [jobStatus, setJobStatus] = useState<JobStatus>("OPEN");
  const [selectedContractor, setSelectedContractor] = useState<Offer | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Wallet payment not started");
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("DRAFT");

  function submitServiceRequest(request: ServiceRequest) {
    // Later: insert the request into Supabase/database here before updating UI state.
    setServiceRequest(request);
    setRequestStatus("OPEN");
    setJob({
      service: request.serviceType,
      location: request.location,
      budget: request.budget,
      timing: request.urgency,
    });
  }

  function hireContractor(offer: Offer) {
    // State transition: client hires one offer, so the job leaves OPEN and begins active work.
    setSelectedContractor(offer);
    setJobStatus("IN_PROGRESS");
    setPaymentStatus("Wallet escrow authorized");
  }

  function markComplete() {
    // State transition: contractor finishes work, so the client must approve before payment releases.
    setJobStatus("AWAITING_APPROVAL");
    setPaymentStatus("Waiting for client approval");
  }

  function approvePayment() {
    // State transition: client approves completed work, so escrow can release and the job is done.
    setJobStatus("COMPLETED");
    setPaymentStatus("Payment released to contractor");
  }

  function saveQuote() {
    setPaymentStatus("Quote saved");
  }

  return (
    <JobStateContext.Provider
      value={{
        offers,
        job,
        jobStatus,
        selectedContractor,
        paymentStatus,
        requestStatus,
        serviceRequest,
        setJob,
        submitServiceRequest,
        hireContractor,
        markComplete,
        approvePayment,
        saveQuote,
      }}
    >
      {children}
    </JobStateContext.Provider>
  );
}

export function useJobState() {
  const context = useContext(JobStateContext);

  if (!context) {
    throw new Error("useJobState must be used inside JobStateProvider");
  }

  return context;
}
