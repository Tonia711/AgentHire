"use client";

import { AppShell } from "../../kiwi-components";
import { useKiwiState } from "../../kiwi-state";

export default function ContractorSettingsPage() {
  const { connectWallet, walletConnected } = useKiwiState();

  return (
    <AppShell
      eyebrow="Contractor"
      onWalletClick={connectWallet}
      role="contractor"
      title="Settings"
      walletConnected={walletConnected}
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold">Profile and notifications</h2>
          <p className="mt-2 text-sm text-[#607066]">
            Profile, tax, notification, and security settings will live here.
          </p>
          <button className="mt-5 rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white" type="button">
            Save
          </button>
        </article>
      </div>
    </AppShell>
  );
}
