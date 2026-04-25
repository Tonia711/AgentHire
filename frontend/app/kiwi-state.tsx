"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export type ContractorStatus = "INVITED" | "KYC_DONE" | "AGREEMENT_SIGNED" | "ACTIVE";
export type InvoiceStatus = "DRAFT" | "SENT_TO_CLIENT" | "READY_FOR_FUJI_PAYMENT" | "PAID";

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
  id: string;
  contractorId: string;
  requestId?: string;
  description?: string;
  hours: string;
  notes?: string;
  subtotal: number;
  gst: number;
  total: number;
  status: InvoiceStatus;
  txHash: string;
  paymentMethod: "FUJI_WALLET_BLUEPRINT";
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
  contractorResponses: Record<string, ContractorResponse>;
  acceptedContractorId?: string;
};

export type ContractorResponse =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ACCEPTED_ELSEWHERE";

export type DummyContractorAccount = {
  id: string;
  name: string;
  expertise: string;
  position: string;
  hourlyRate: number;
  email: string;
};

export const dummyContractorAccounts: DummyContractorAccount[] = [
  {
    id: "mia-thompson",
    name: "Mia Thompson",
    expertise: "Commercial window cleaning",
    position: "Wellington CBD",
    hourlyRate: 55,
    email: "mia@kiwicontract.test",
  },
  {
    id: "liam-patel",
    name: "Liam Patel",
    expertise: "Exterior glass and shopfronts",
    position: "Petone",
    hourlyRate: 72,
    email: "liam@kiwicontract.test",
  },
  {
    id: "ava-williams",
    name: "Ava Williams",
    expertise: "Residential window cleaning",
    position: "Paraparaumu",
    hourlyRate: 38,
    email: "ava@kiwicontract.test",
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
      contractor.hourlyRate >= requestPrice.min &&
      contractor.hourlyRate <= requestPrice.max;
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
      Record<string, ContractorResponse>
    >((responses, contractorId) => {
      responses[contractorId] = contractorResponses[contractorId] ?? "PENDING";
      return responses;
    }, {}),
  };
}

const taskRequestStorageKey = "kiwicontract-task-requests";
const taskRequestChangeEvent = "kiwicontract-task-requests-changed";
const demoResetChangeEvent = "kiwicontract-demo-reset";

function getTaskRequestSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(taskRequestStorageKey) ?? "[]";
}

function subscribeToTaskRequests(onStoreChange: () => void) {
  window.addEventListener(taskRequestChangeEvent, onStoreChange);
  window.addEventListener(demoResetChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(taskRequestChangeEvent, onStoreChange);
    window.removeEventListener(demoResetChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function parseTaskRequests(snapshot: string) {
  try {
    return (JSON.parse(snapshot) as TaskRequest[]).map(normalizeTaskRequest);
  } catch {
    return [];
  }
}

function buildBillForAcceptedRequest(input: {
  contractor: DummyContractorAccount;
  request: TaskRequest;
  hours?: string;
  notes?: string;
}): Invoice {
  const hours = input.hours ?? "2";
  const hourCount = Number(hours || 0);
  const subtotal = hourCount * input.contractor.hourlyRate;
  const gst = subtotal * 0.15;
  const total = subtotal + gst;

  // Later: insert this bill into Supabase, then create a Fuji wallet payment intent.
  return {
    id: `BILL-${Date.now()}-${input.contractor.id}`,
    contractorId: input.contractor.id,
    requestId: input.request.id,
    description: input.request.task,
    hours,
    notes:
      input.notes ??
      "Auto-generated bill after contractor accepted the request.",
    subtotal,
    gst,
    total,
    status: "SENT_TO_CLIENT",
    txHash: "Awaiting Fuji wallet payment",
    paymentMethod: "FUJI_WALLET_BLUEPRINT",
  };
}

type KiwiStateContextValue = {
  contractor: Contractor | null;
  invoices: Invoice[];
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
  resetLocalDemo: () => void;
  respondToTaskRequest: (
    requestId: string,
    contractorId: string,
    response: "ACCEPTED" | "REJECTED" | "ACCEPTED_ELSEWHERE",
  ) => void;
  inviteContractor: (input: {
    name: string;
    email: string;
    trade: string;
    hourlyRate: string;
  }) => void;
  simulateVerification: () => void;
  createInvoice: (hours: string) => void;
  sendBillToClient: (input: {
    requestId: string;
    contractorId: string;
    hours: string;
    notes: string;
  }) => void;
  payInvoice: (invoiceId: string) => void;
  sendAgentPrompt: (prompt: string) => void;
};

const KiwiStateContext = createContext<KiwiStateContextValue | null>(null);

export function KiwiStateProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const taskRequestSnapshot = useSyncExternalStore(
    subscribeToTaskRequests,
    getTaskRequestSnapshot,
    () => "[]",
  );
  const taskRequests = useMemo(
    () => parseTaskRequests(taskRequestSnapshot),
    [taskRequestSnapshot],
  );
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
    window.localStorage.setItem(
      taskRequestStorageKey,
      JSON.stringify(nextRequests),
    );
    window.dispatchEvent(new Event(taskRequestChangeEvent));
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
      Record<string, ContractorResponse>
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

  function resetLocalDemo() {
    setContractor(null);
    setInvoices([]);
    window.localStorage.removeItem(taskRequestStorageKey);
    window.dispatchEvent(new Event(taskRequestChangeEvent));
    window.dispatchEvent(new Event(demoResetChangeEvent));
    addAgentMessage("Local demo reset. Requests, contractor responses, and accepted jobs were cleared.");
  }

  function respondToTaskRequest(
    requestId: string,
    contractorId: string,
    response: "ACCEPTED" | "REJECTED" | "ACCEPTED_ELSEWHERE",
  ) {
    const nextRequests = taskRequests.map((request) => {
      if (request.id !== requestId) {
        return request;
      }

      if (response === "ACCEPTED") {
        const acceptedContractor = dummyContractorAccounts.find(
          (account) => account.id === contractorId,
        );
        const contractorResponses = request.matchedContractorIds.reduce<
          Record<string, ContractorResponse>
        >((responses, matchedContractorId) => {
          responses[matchedContractorId] =
            matchedContractorId === contractorId ? "ACCEPTED" : "ACCEPTED_ELSEWHERE";
          return responses;
        }, {});

        if (acceptedContractor) {
          setContractor({
            id: acceptedContractor.id,
            name: acceptedContractor.name,
            email: acceptedContractor.email,
            trade: acceptedContractor.expertise,
            hourlyRate: String(acceptedContractor.hourlyRate),
            status: "ACTIVE",
            walletAddress: "0xDemo...contractor",
            civicPassId: "demo-profile",
            luminDocument: "Service agreement pending",
            attestationUid: "",
          });
          const bill = buildBillForAcceptedRequest({
            contractor: acceptedContractor,
            request,
          });

          setInvoices((currentBills) => [
            bill,
            ...currentBills.filter((currentBill) => currentBill.requestId !== request.id),
          ]);
          addAgentMessage(`${acceptedContractor.name} accepted ${request.task}. A bill was automatically sent to the client at $${acceptedContractor.hourlyRate}/hr.`);
        }

        return {
          ...request,
          acceptedContractorId: contractorId,
          contractorResponses,
        };
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
    setInvoices([]);
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
    setInvoices((currentBills) => [{
      id: `BILL-${Date.now()}`,
      contractorId: contractor.id,
      hours,
      subtotal,
      gst,
      total,
      status: "READY_FOR_FUJI_PAYMENT",
      txHash: "Fuji wallet payment not submitted yet",
      paymentMethod: "FUJI_WALLET_BLUEPRINT",
    }, ...currentBills]);
    addAgentMessage(`Invoice prepared for Fuji wallet payment: $${subtotal.toFixed(2)} + $${gst.toFixed(2)} GST = $${total.toFixed(2)} dNZD.`);
  }

  function sendBillToClient(input: {
    requestId: string;
    contractorId: string;
    hours: string;
    notes: string;
  }) {
    const billingContractor = dummyContractorAccounts.find(
      (account) => account.id === input.contractorId,
    );
    const request = taskRequests.find((item) => item.id === input.requestId);

    if (!billingContractor || !request) {
      addAgentMessage("Could not send the bill because the contractor or request was not found.");
      return;
    }

    const bill = buildBillForAcceptedRequest({
      contractor: billingContractor,
      request,
      hours: input.hours,
      notes: input.notes,
    });

    setInvoices((currentBills) => [
      bill,
      ...currentBills.filter((currentBill) => currentBill.requestId !== request.id),
    ]);
    setContractor({
      id: billingContractor.id,
      name: billingContractor.name,
      email: billingContractor.email,
      trade: billingContractor.expertise,
      hourlyRate: String(billingContractor.hourlyRate),
      status: "ACTIVE",
      walletAddress: "0xDemo...contractor",
      civicPassId: "demo-profile",
      luminDocument: "Service agreement pending",
      attestationUid: "",
    });
    addAgentMessage(`${billingContractor.name} sent a bill to the client for ${request.task}. Total due is $${bill.total.toFixed(2)} dNZD.`);
  }

  function payInvoice(invoiceId: string) {
    const invoiceToPay = invoices.find((invoice) => invoice.id === invoiceId);
    const billingContractor = invoiceToPay
      ? dummyContractorAccounts.find((account) => account.id === invoiceToPay.contractorId)
      : null;

    if (!invoiceToPay || !billingContractor) {
      return;
    }

    // Later: hand this off to Fuji wallet, then transfer MockDNZD on Avalanche Fuji.
    setInvoices((currentBills) =>
      currentBills.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              status: "PAID",
              txHash: "0xfuji-wallet-payment-demo",
            }
          : invoice,
      ),
    );
    setContractor({
      id: billingContractor.id,
      name: billingContractor.name,
      email: billingContractor.email,
      trade: billingContractor.expertise,
      hourlyRate: String(billingContractor.hourlyRate),
      status: "ACTIVE",
      walletAddress: "0xDemo...contractor",
      civicPassId: "demo-profile",
      luminDocument: "Service agreement pending",
      attestationUid: "",
    });
    addAgentMessage(`Fuji wallet blueprint complete. Marked ${invoiceToPay.total.toFixed(2)} dNZD as paid to ${billingContractor.name}.`);
  }

  function sendAgentPrompt(prompt: string) {
    setChatMessages((messages) => [...messages, { author: "business", text: prompt }]);

    const normalized = prompt.toLowerCase();

    if (normalized.includes("invoice")) {
      createInvoice("10");
      return;
    }

    if (normalized.includes("pay")) {
      const unpaidInvoice = invoices.find((item) => item.status !== "PAID");

      if (unpaidInvoice) {
        payInvoice(unpaidInvoice.id);
      }
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
        invoices,
        taskRequests,
        dummyContractors: dummyContractorAccounts,
        walletConnected,
        chatMessages,
        connectWallet,
        sendTaskRequest,
        resetLocalDemo,
        respondToTaskRequest,
        inviteContractor,
        simulateVerification,
        createInvoice,
        sendBillToClient,
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
