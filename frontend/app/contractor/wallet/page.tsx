"use client";

import { AppShell, WalletPanel } from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function ContractorWalletPage() {
  const { connectWallet, walletConnected } = useKiwiState();

  return (
    <AppShell
      eyebrow="Contractor"
      onWalletClick={connectWallet}
      role="contractor"
      title="Wallet"
      walletConnected={walletConnected}
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <WalletPanel connected={walletConnected} onConnect={connectWallet} />
      </div>
    </AppShell>
  );
}
