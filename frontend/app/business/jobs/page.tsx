"use client";

import { usePathname } from "next/navigation";
import {
  AppShell,
  DummyContractorDashboard,
  TaskRequestList,
} from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function BusinessJobsPage() {
  const pathname = usePathname();
  const {
    connectWallet,
    dummyContractors,
    invoices,
    taskRequests,
    walletConnected,
  } = useKiwiState();
  const clientId = pathname.startsWith("/business2") ? "client-2" : "client-1";
  const clientName = clientId === "client-2" ? "Client 2" : "Client 1";
  const clientRequests = taskRequests.filter((request) => request.clientId === clientId);
  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.clientId === clientId && invoice.status !== "PAID",
  );

  return (
    <AppShell
      alertCount={unpaidInvoices.length}
      alertLabel={`${unpaidInvoices.length} bill${unpaidInvoices.length === 1 ? "" : "s"} to pay`}
      eyebrow={clientName}
      onWalletClick={connectWallet}
      role="business"
      title="Posted Jobs"
      walletConnected={walletConnected}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-2 lg:items-start lg:px-10">
        <TaskRequestList contractors={dummyContractors} requests={clientRequests} />
        <DummyContractorDashboard
          contractors={dummyContractors}
          requests={clientRequests}
        />
      </div>
    </AppShell>
  );
}
