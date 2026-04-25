"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export type ContractorStatus = "INVITED" | "KYC_DONE" | "AGREEMENT_SIGNED" | "ACTIVE";
export type InvoiceStatus = "DRAFT" | "CREATED_ON_CHAIN" | "PAID";

export type Contractor = {
  id: string;
  name: string;
  email: string;
  trade: string;
  hourlyRate: string;
  status: ContractorStatus;
  walletAddress: string;
  civicPassId: string;
  luminDocument: string;
  attestationUid: string;
};

export type Invoice = {
  contractorId: string;
  hours: string;
  subtotal: number;
  gst: number;
  total: number;
  status: InvoiceStatus;
  txHash: string;
};

export type ChatMessage = {
  author: "business" | "agent";
  text: string;
};

export type TaskRequest = {
  id: string;
  task: string;
  priceRange: string;
  location: string;
  status: "OPEN";
  createdAt: string;
  matchedContractorIds: string[];
  contractorResponses: Record<string, "PENDING" | "ACCEPTED" | "REJECTED">;
};

export type DummyContractorAccount = {
  id: string;
  name: string;
  service: string;
  position: string;
  minPrice: number;
  maxPrice: number;
};

export const dummyContractorAccounts: DummyContractorAccount[] = [
  {
    id: "clearview-central",
    name: "ClearView Central",
    service: "Window cleaning",
    position: "Wellington CBD",
    minPrice: 250,
    maxPrice: 550,
  },
  {
    id: "harbour-shine",
    name: "Harbour Shine",
    service: "Window cleaning",
    position: "Petone",
    minPrice: 400,
    maxPrice: 850,
  },
  {
    id: "kapiti-glass-care",
    name: "Kapiti Glass Care",
    service: "Window cleaning",
    position: "Paraparaumu",
    minPrice: 180,
    maxPrice: 420,
  },
];

export function formatPriceRange(priceRange: string) {
  const numbers = priceRange.match(/\d+/g)?.map(Number) ?? [];
  const normalized = priceRange.toLowerCase();

  if (numbers.length === 0) {
    return "$0";
  }

  if (numbers.length === 1) {
    const [value] = numbers;

    if (normalized.includes("under") || normalized.includes("below") || normalized.includes("max")) {
      return `$0-$${value}`;
    }

    if (normalized.includes("over") || normalized.includes("above") || normalized.includes("min")) {
      return `$${value}+`;
    }

    return `$${value}`;
  }

  const [first, second] = numbers;
  const min = Math.min(first, second);
  const max = Math.max(first, second);

  return `$${min}-$${max}`;
}

function parsePriceRange(priceRange: string) {
  const numbers = priceRange.match(/\d+/g)?.map(Number) ?? [];
  const normalized = priceRange.toLowerCase();

  if (numbers.length === 0) {
    return { min: 0, max: 0 };
  }

  if (numbers.length === 1) {
    const [value] = numbers;

    if (normalized.includes("under") || normalized.includes("below") || normalized.includes("max")) {
      return { min: 0, max: value };
    }

    if (normalized.includes("over") || normalized.includes("above") || normalized.includes("min")) {
      return { min: value, max: Number.POSITIVE_INFINITY };
    }

    return { min: value, max: value };
  }

  const [first, second] = numbers;

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

function getLocationScore(requestLocation: string, contractorLocation: string) {
  const request = requestLocation.toLowerCase();
  const contractor = contractorLocation.toLowerCase();

  if (request === contractor) {
    return 0;
  }

  if (
    request.includes("wellington") &&
    (contractor.includes("wellington") || contractor.includes("petone"))
  ) {
    return 1;
  }

  if (
    request.includes("petone") &&
    (contractor.includes("wellington") || contractor.includes("petone"))
  ) {
    return 1;
  }

  if (
    request.includes("kapiti") ||
    request.includes("paraparaumu") ||
    contractor.includes("kapiti") ||
    contractor.includes("paraparaumu")
  ) {
    return request.includes("kapiti") || request.includes("paraparaumu") ? 1 : 3;
  }

  return 2;
}

function matchContractors(input: {
  task: string;
  priceRange: string;
  location: string;
}) {
  const requestPrice = parsePriceRange(input.priceRange);

  return dummyContractorAccounts.filter((contractor) => {
    const priceMatches =
      requestPrice.max >= contractor.minPrice && requestPrice.min <= contractor.maxPrice;
    const locationCloseEnough =
      getLocationScore(input.location, contractor.position) <= 1;
    const serviceMatches = input.task.toLowerCase().includes("window");

    return serviceMatches && priceMatches && locationCloseEnough;
  });
}

function normalizeTaskRequest(request: TaskRequest): TaskRequest {
  const matchedContractorIds = request.matchedContractorIds ?? [];
  const contractorResponses = request.contractorResponses ?? {};

  return {
    ...request,
    matchedContractorIds,
    contractorResponses: matchedContractorIds.reduce<
      Record<string, "PENDING" | "ACCEPTED" | "REJECTED">
    >((responses, contractorId) => {
      responses[contractorId] = contractorResponses[contractorId] ?? "PENDING";
      return responses;
    }, {}),
  };
}

type KiwiStateContextValue = {
  contractor: Contractor | null;
  invoice: Invoice | null;
  taskRequests: TaskRequest[];
  dummyContractors: DummyContractorAccount[];
  walletConnected: boolean;
  chatMessages: ChatMessage[];
  connectWallet: () => void;
  sendTaskRequest: (input: {
    task: string;
    priceRange: string;
    location: string;
  }) => void;
  respondToTaskRequest: (
    requestId: string,
    contractorId: string,
    response: "ACCEPTED" | "REJECTED",
  ) => void;
  inviteContractor: (input: {
    name: string;
    email: string;
    trade: string;
    hourlyRate: string;
  }) => void;
  simulateVerification: () => void;
  createInvoice: (hours: string) => void;
  payInvoice: () => void;
  sendAgentPrompt: (prompt: string) => void;
};

const KiwiStateContext = createContext<KiwiStateContextValue | null>(null);

export function KiwiStateProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const storedRequests = window.localStorage.getItem("kiwicontract-task-requests");

    if (!storedRequests) {
      return [];
    }

    try {
      return (JSON.parse(storedRequests) as TaskRequest[]).map(normalizeTaskRequest);
    } catch {
      return [];
    }
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      author: "agent",
      text: "Kia ora. Send a task request, connect a Fuji wallet, or ask me to create an invoice.",
    },
  ]);

  function addAgentMessage(text: string) {
    setChatMessages((messages) => [...messages, { author: "agent", text }]);
  }

  function storeTaskRequests(nextRequests: TaskRequest[]) {
    setTaskRequests(nextRequests);
    window.localStorage.setItem(
      "kiwicontract-task-requests",
      JSON.stringify(nextRequests),
    );
  }

  function connectWallet() {
    setWalletConnected(true);
    addAgentMessage("Wallet connected to Avalanche Fuji. Ready for dNZD demo actions.");
  }

  function sendTaskRequest(input: {
    task: string;
    priceRange: string;
    location: string;
  }) {
    const matchedContractors = matchContractors(input);
    const contractorResponses = matchedContractors.reduce<
      Record<string, "PENDING" | "ACCEPTED" | "REJECTED">
    >((responses, contractor) => {
      responses[contractor.id] = "PENDING";
      return responses;
    }, {});

    const request: TaskRequest = {
      id: `REQ-${Date.now()}`,
      task: input.task,
      priceRange: formatPriceRange(input.priceRange),
      location: input.location,
      status: "OPEN",
      createdAt: new Date().toLocaleString(),
      matchedContractorIds: matchedContractors.map((contractor) => contractor.id),
      contractorResponses,
    };

    // Local database for now: persist requests in localStorage until Supabase is connected.
    storeTaskRequests([request, ...taskRequests]);
    addAgentMessage(`Request ${request.id} stored locally and sent to ${matchedContractors.length} matching window cleaning contractor(s).`);
  }

  function respondToTaskRequest(
    requestId: string,
    contractorId: string,
    response: "ACCEPTED" | "REJECTED",
  ) {
    const nextRequests = taskRequests.map((request) => {
      if (request.id !== requestId) {
        return request;
      }

      return {
        ...request,
        contractorResponses: {
          ...request.contractorResponses,
          [contractorId]: response,
        },
      };
    });

    storeTaskRequests(nextRequests);
  }

  function inviteContractor(input: {
    name: string;
    email: string;
    trade: string;
    hourlyRate: string;
  }) {
    // Later: insert contractor invite into Supabase and trigger the Edge Function email invite here.
    const invitedContractor: Contractor = {
      id: "sarah-electrician",
      name: input.name,
      email: input.email,
      trade: input.trade,
      hourlyRate: input.hourlyRate,
      status: "INVITED",
      walletAddress: "0x7A1f...42d9",
      civicPassId: "pending",
      luminDocument: "Standard contractor agreement",
      attestationUid: "",
    };

    setContractor(invitedContractor);
    setInvoice(null);
    addAgentMessage(`Done. Sent ${input.name} an invite at ${input.email}. I will let you know when verification is complete.`);
  }

  function simulateVerification() {
    if (!contractor) {
      return;
    }

    // Later: replace this stub with Civic Pass status + Lumin Sign webhook + EAS attestation read.
    setContractor({
      ...contractor,
      status: "AGREEMENT_SIGNED",
      civicPassId: "civic-demo-pass-43113",
      attestationUid: "0x9f3a...eas",
    });
    addAgentMessage(`${contractor.name} completed Civic KYC and signed via Lumin. EAS attestation recorded on Fuji.`);
  }

  function createInvoice(hours: string) {
    if (!contractor) {
      addAgentMessage("Invite and verify a contractor before creating an invoice.");
      return;
    }

    const hourCount = Number(hours || 0);
    const rate = Number(contractor.hourlyRate || 0);
    const subtotal = hourCount * rate;
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    // Later: call Invoice.sol createInvoice() with ethers.js once Team 3 shares addresses.
    setInvoice({
      contractorId: contractor.id,
      hours,
      subtotal,
      gst,
      total,
      status: "CREATED_ON_CHAIN",
      txHash: "0xinvoice...fuji",
    });
    addAgentMessage(`Invoice created: $${subtotal.toFixed(2)} + $${gst.toFixed(2)} GST = $${total.toFixed(2)} dNZD.`);
  }

  function payInvoice() {
    if (!invoice || !contractor) {
      return;
    }

    // Later: run Binance Skills market checks, then transfer MockDNZD on Fuji with ethers.js.
    setInvoice({
      ...invoice,
      status: "PAID",
      txHash: "0xpaid...dnzd",
    });
    setContractor({
      ...contractor,
      status: "ACTIVE",
    });
    addAgentMessage(`Binance market check passed. Sent ${invoice.total.toFixed(2)} dNZD to ${contractor.name}.`);
  }

  function sendAgentPrompt(prompt: string) {
    setChatMessages((messages) => [...messages, { author: "business", text: prompt }]);

    const normalized = prompt.toLowerCase();

    if (normalized.includes("invoice")) {
      createInvoice("10");
      return;
    }

    if (normalized.includes("pay")) {
      payInvoice();
      return;
    }

    if (normalized.includes("invite")) {
      inviteContractor({
        name: "Sarah",
        email: "sarah@email.co.nz",
        trade: "Electrician",
        hourlyRate: "80",
      });
      return;
    }

    addAgentMessage("I can help track task requests, create invoices, and prepare dNZD payments for the demo.");
  }

  return (
    <KiwiStateContext.Provider
      value={{
        contractor,
        invoice,
        taskRequests,
        dummyContractors: dummyContractorAccounts,
        walletConnected,
        chatMessages,
        connectWallet,
        sendTaskRequest,
        respondToTaskRequest,
        inviteContractor,
        simulateVerification,
        createInvoice,
        payInvoice,
        sendAgentPrompt,
      }}
    >
      {children}
    </KiwiStateContext.Provider>
  );
}

export function useKiwiState() {
  const context = useContext(KiwiStateContext);

  if (!context) {
    throw new Error("useKiwiState must be used inside KiwiStateProvider");
  }

  return context;
}
