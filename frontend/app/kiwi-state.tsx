"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  ADDRESSES,
  createOnChainInvoice,
  payContractor as payContractorTx,
} from "../lib/contracts";
import { walletClientToSigner } from "../lib/ethers-adapter";
import { checkMarketHealth } from "../lib/binance-tools";
import {
  fetchDemoContractor,
  insertInvoice,
  markLatestInvoicePaid,
  updateContractorStatus,
  upsertContractor,
} from "../lib/supabase-queries";

export type ContractorStatus = "INVITED" | "KYC_DONE" | "AGREEMENT_SIGNED" | "ACTIVE";
export type InvoiceStatus = "DRAFT" | "SENT_TO_CLIENT" | "READY_FOR_FUJI_PAYMENT" | "PAID";

export type Contractor = {
  id: string;
  name: string;
  email: string;
  trade: string;
  inviteLink: string;
  hourlyRate: string;
  status: ContractorStatus;
  walletAddress: string;
  civicPassId: string;
  luminDocument: string;
  attestationUid: string;
};

export type Invoice = {
  id: string;
  clientId: string;
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
  paymentTxHash?: string;
};

export type ChatMessage = {
  author: "business" | "agent";
  text: string;
};

export type TaskRequest = {
  id: string;
  clientId: string;
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

// Sarah demo wallet — pre-funded by Team 3 in TEAM3_HANDOFF.md
const SARAH_WALLET = "0x635B5c22889127D976eFeC1160a103f06b5a7Aff";

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
    clientId: request.clientId ?? "client-1",
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

type TaskRequestInput = {
  clientId?: string;
  task: string;
  priceRange: string;
  location: string;
};

function buildTaskRequest(input: TaskRequestInput, index = 0): TaskRequest {
  const matchedContractors = matchContractors(input);
  const contractorResponses = matchedContractors.reduce<
    Record<string, ContractorResponse>
  >((responses, contractor) => {
    responses[contractor.id] = "PENDING";
    return responses;
  }, {});

  return {
    id: `REQ-${Date.now()}-${index}`,
    clientId: input.clientId ?? "client-1",
    task: input.task,
    priceRange: formatPriceRange(input.priceRange),
    location: input.location,
    status: "OPEN",
    createdAt: new Date().toLocaleString(),
    matchedContractorIds: matchedContractors.map((contractor) => contractor.id),
    contractorResponses,
  };
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
    clientId: input.request.clientId,
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
  walletAddress: string | undefined;
  chatMessages: ChatMessage[];
  isPaying: boolean;
  isCreatingInvoice: boolean;
  setAttestationUid: (uid: string) => void;
  connectWallet: () => void;
  sendTaskRequest: (input: {
    clientId?: string;
    task: string;
    priceRange: string;
    location: string;
  }) => void;
  seedDemoRequests: (clientId?: string) => void;
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
  const demoBusinessId =
    process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ??
    "10000000-0000-0000-0000-000000000001";
  const [walletConnected, setWalletConnected] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
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

  const addAgentMessage = useCallback((text: string) => {
    setChatMessages((messages) => [...messages, { author: "agent", text }]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchDemoContractor().then((row) => {
      if (cancelled || !row) return;
      setContractor((prev) =>
        prev
          ? prev
          : {
              id: row.id,
              name: row.name,
              email: row.email,
              trade: "Electrician",
              hourlyRate: String(row.hourly_rate),
              status:
                row.status === "active"
                  ? "ACTIVE"
                  : row.status === "agreement_signed"
                    ? "AGREEMENT_SIGNED"
                    : row.status === "kyc_complete"
                      ? "KYC_DONE"
                      : "INVITED",
              walletAddress: row.wallet_address || SARAH_WALLET,
              civicPassId: row.civic_pass_id || "pending",
              luminDocument: "Standard contractor agreement",
              attestationUid: "",
            },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function storeTaskRequests(nextRequests: TaskRequest[]) {
    window.localStorage.setItem(
      taskRequestStorageKey,
      JSON.stringify(nextRequests),
    );
    window.dispatchEvent(new Event(taskRequestChangeEvent));
  }

  function connectWallet() {
    addAgentMessage("Use the Connect Wallet button to choose a wallet provider on Fuji.");
  }

  function sendTaskRequest(input: {
    clientId?: string;
    task: string;
    priceRange: string;
    location: string;
  }) {
    const request = buildTaskRequest(input);

    storeTaskRequests([request, ...taskRequests]);
    addAgentMessage(
      `Request ${request.id} stored locally and sent to ${matchedContractors.length} matching window cleaning contractor(s).`,
    );
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
    void (async () => {
      try {
        const response = await fetch("/api/contractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: demoBusinessId,
            name: input.name,
            email: input.email,
            hourlyRate: Number(input.hourlyRate),
            terms: "standard",
            preferredChainId: 43113,
            preferredToken: "dNZD",
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Invite request failed");
        }

        const invitedContractor: Contractor = {
          id: payload?.contractor?.id ?? "contractor-from-api",
          name: payload?.contractor?.name ?? input.name,
          email: payload?.contractor?.email ?? input.email,
          trade: input.trade,
          inviteLink:
            payload?.inviteLink ??
            `http://localhost:3000/onboard/${payload?.contractor?.invite_token ?? crypto.randomUUID()}`,
          hourlyRate: String(payload?.contractor?.hourly_rate ?? input.hourlyRate),
          status: "INVITED",
          walletAddress: SARAH_WALLET,
          civicPassId: "pending",
          luminDocument: "Standard contractor agreement",
          attestationUid: "",
        };

        setContractor(invitedContractor);
        setInvoice(null);
        addAgentMessage(
          `Done. Invite ready for ${invitedContractor.name}. Share this onboarding link: ${invitedContractor.inviteLink}`,
        );
      } catch (error) {
        const fallbackInviteLink = `http://localhost:3000/onboard/${crypto.randomUUID()}`;
        const invitedContractor: Contractor = {
          id: "sarah-electrician",
          name: input.name,
          email: input.email,
          trade: input.trade,
          inviteLink: fallbackInviteLink,
          hourlyRate: input.hourlyRate,
          status: "INVITED",
          walletAddress: SARAH_WALLET,
          civicPassId: "pending",
          luminDocument: "Standard contractor agreement",
          attestationUid: "",
        };
        setContractor(invitedContractor);
        setInvoice(null);
        void upsertContractor({
          id: invitedContractor.id,
          name: invitedContractor.name,
          email: invitedContractor.email,
          hourlyRate: Number(invitedContractor.hourlyRate),
          walletAddress: invitedContractor.walletAddress,
          status: "invited",
        });
        addAgentMessage(
          `Invite API failed (${error instanceof Error ? error.message : "unknown error"}). Using local demo link: ${fallbackInviteLink}`,
        );
      }
    })();
  }

  function simulateVerification() {
    if (!contractor) {
      return;
    }

    setContractor({
      ...contractor,
      status: "AGREEMENT_SIGNED",
      civicPassId: "civic-demo-pass-43113",
      attestationUid: "0x9f3a...eas",
    });
    void updateContractorStatus(contractor.id, "agreement_signed", "civic-demo-pass-43113");
    addAgentMessage(
      `${contractor.name} completed Civic KYC and signed via Lumin. EAS attestation recorded on Fuji.`,
    );
  }

  async function createInvoice(hours: string) {
    if (!contractor) {
      addAgentMessage("Invite and verify a contractor before creating an invoice.");
      return;
    }

    const hourCount = Number(hours || 0);
    const rate = Number(contractor.hourlyRate || 0);
    const subtotal = hourCount * rate;
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    setIsCreatingInvoice(true);
    let txHash = "0xinvoice...fuji-mock";

    try {
      if (
        isConnected &&
        walletClient &&
        ADDRESSES.INVOICE !== "0x0000000000000000000000000000000000000000"
      ) {
        addAgentMessage("Submitting invoice to Invoice.sol on Fuji. Approve in your wallet.");
        const signer = walletClientToSigner(walletClient);
        const result = await createOnChainInvoice(
          signer,
          contractor.walletAddress,
          subtotal,
          gst,
          `${hours} hours: ${contractor.trade}`,
        );
        txHash = result.txHash;
      }
    } catch (error) {
      console.error(error);
      addAgentMessage(
        `Invoice transaction failed: ${error instanceof Error ? error.message : "unknown error"}. Falling back to mock invoice.`,
      );
    }

    setInvoice({
      contractorId: contractor.id,
      hours,
      subtotal,
      gst,
      total,
      status: "CREATED_ON_CHAIN",
      txHash,
    });
    void insertInvoice({
      contractorId: contractor.id,
      amount: subtotal,
      gstAmount: gst,
      description: `${hours} hours: ${contractor.trade}`,
      invoiceTxHash: txHash,
    });
    addAgentMessage(
      `Invoice created: $${subtotal.toFixed(2)} + $${gst.toFixed(2)} GST = $${total.toFixed(2)} dNZD.`,
    );
    setIsCreatingInvoice(false);
  }

  async function payInvoice() {
    if (!invoice || !contractor) {
      return;
    }

    setIsPaying(true);

    try {
      const health = await checkMarketHealth();
      addAgentMessage(
        health.status === "healthy"
          ? "Binance market check: dNZD peg stable, volume healthy. Safe to proceed."
          : "Binance market check: could not verify. Proceeding with caution.",
      );
    } catch {
      addAgentMessage("Binance market check skipped (network error).");
    }

    let txHash = "0xpaid...dnzd-mock";

    try {
      if (
        isConnected &&
        walletClient &&
        ADDRESSES.MOCK_DNZD !== "0x0000000000000000000000000000000000000000"
      ) {
        addAgentMessage("Submitting dNZD transfer on Fuji. Approve in your wallet.");
        const signer = walletClientToSigner(walletClient);
        const result = await payContractorTx(
          signer,
          contractor.walletAddress,
          invoice.total,
        );
        txHash = result.txHash;
      }
    } catch (error) {
      console.error(error);
      addAgentMessage(
        `Payment failed: ${error instanceof Error ? error.message : "unknown error"}.`,
      );
      setIsPaying(false);
      return;
    }

    setInvoice({
      ...invoice,
      status: "PAID",
      paymentTxHash: txHash,
      txHash: invoice.txHash,
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
    void markLatestInvoicePaid(contractor.id, txHash);
    void updateContractorStatus(contractor.id, "active");
    addAgentMessage(`Sent ${invoice.total.toFixed(2)} dNZD to ${contractor.name}.`);
    setIsPaying(false);
  }

  function sendAgentPrompt(prompt: string) {
    setChatMessages((messages) => [...messages, { author: "business", text: prompt }]);

    const normalized = prompt.toLowerCase();

    if (normalized.includes("invoice")) {
      void createInvoice("10");
      return;
    }

    if (normalized.includes("pay")) {
      void payInvoice();
      return;
    }

    if (normalized.includes("invite")) {
      void inviteContractor({
        name: "Sarah",
        email: "sarah@email.co.nz",
        trade: "Electrician",
        hourlyRate: "80",
      });
      return;
    }

    addAgentMessage(
      "I can help track task requests, create invoices, and prepare dNZD payments for the demo.",
    );
  }

  function setAttestationUid(uid: string) {
    setContractor((prev) =>
      prev ? { ...prev, attestationUid: uid, status: "AGREEMENT_SIGNED" } : prev,
    );
    addAgentMessage(`EAS attestation anchored on Fuji: ${uid.slice(0, 10)}...`);
  }

  return (
    <KiwiStateContext.Provider
      value={{
        contractor,
        invoices,
        taskRequests,
        dummyContractors: dummyContractorAccounts,
        walletConnected: isConnected,
        walletAddress: address,
        chatMessages,
        isPaying,
        isCreatingInvoice,
        setAttestationUid,
        connectWallet,
        sendTaskRequest,
        seedDemoRequests,
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
