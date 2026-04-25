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
  paymentTxHash?: string;
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

// Sarah demo wallet — pre-funded by Team 3 in TEAM3_HANDOFF.md
const SARAH_WALLET = "0x635B5c22889127D976eFeC1160a103f06b5a7Aff";

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
  walletAddress: string | undefined;
  chatMessages: ChatMessage[];
  isPaying: boolean;
  isCreatingInvoice: boolean;
  setAttestationUid: (uid: string) => void;
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
    setTaskRequests(nextRequests);
    window.localStorage.setItem(
      "kiwicontract-task-requests",
      JSON.stringify(nextRequests),
    );
  }

  function connectWallet() {
    addAgentMessage("Use the Connect Wallet button to choose a wallet provider on Fuji.");
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

    storeTaskRequests([request, ...taskRequests]);
    addAgentMessage(
      `Request ${request.id} stored locally and sent to ${matchedContractors.length} matching window cleaning contractor(s).`,
    );
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
    const invitedContractor: Contractor = {
      id: "sarah-electrician",
      name: input.name,
      email: input.email,
      trade: input.trade,
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
      `Done. Sent ${input.name} an invite at ${input.email}. I will let you know when verification is complete.`,
    );
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
    setContractor({
      ...contractor,
      status: "ACTIVE",
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
      inviteContractor({
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
        invoice,
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
