"use client";

import { AppShell, VaultViewer } from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function ContractorRecordsPage() {
  const { connectWallet, contractor, walletConnected } = useKiwiState();

  return (
    <AppShell
      eyebrow="Contractor"
      onWalletClick={connectWallet}
      role="contractor"
      title="My Records"
      walletConnected={walletConnected}
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <VaultViewer contractor={contractor} />
      </div>
    </AppShell>
  );
}
