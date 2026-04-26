"use client";

import { useState } from "react";
import { useWalletClient } from "wagmi";
import { createContractorAttestation, hashDocument } from "../lib/attestations";
import { ADDRESSES } from "../lib/contracts";
import { walletClientToSigner } from "../lib/ethers-adapter";
import { recordAttestation } from "../lib/supabase-queries";

const LUMIN_DEMO_URL = "https://luminpdf.com/sign";

type Props = {
  contractorId: string;
  contractorAddress: string;
  documentTitle: string;
  civicPassId: string;
  onAttested: (uid: string) => void;
};

export function LuminSignButton({
  contractorId,
  contractorAddress,
  documentTitle,
  civicPassId,
  onAttested,
}: Props) {
  const { data: walletClient } = useWalletClient();
  const [phase, setPhase] = useState<"idle" | "signing" | "attesting" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  async function handleClick() {
    setMessage("");
    if (phase === "signing" || phase === "attesting") return;

    setPhase("signing");
    setMessage("Open Lumin Sign in a new tab. Confirm here once the document is signed.");
    window.open(LUMIN_DEMO_URL, "_blank", "noopener,noreferrer");

    if (
      !walletClient ||
      ADDRESSES.EAS === "0x0000000000000000000000000000000000000000"
    ) {
      setPhase("error");
      setMessage("Connect your wallet on Fuji and confirm contract addresses are loaded.");
      return;
    }

    setPhase("attesting");
    try {
      const signer = walletClientToSigner(walletClient);
      const docHash = hashDocument(`${documentTitle}|${contractorAddress}|${Date.now()}`);
      const uid = await createContractorAttestation(
        signer,
        contractorAddress,
        docHash,
        civicPassId,
      );
      const uidString = typeof uid === "string" ? uid : String(uid);
      void recordAttestation({
        contractorId,
        attestationUid: uidString,
        documentHash: docHash,
      });
      onAttested(uidString);
      setPhase("done");
      setMessage("EAS attestation recorded on Fuji.");
    } catch (error) {
      console.error(error);
      setPhase("error");
      setMessage(
        error instanceof Error ? error.message : "Attestation failed. Try again.",
      );
    }
  }

  const label =
    phase === "signing"
      ? "Awaiting Lumin signature..."
      : phase === "attesting"
        ? "Anchoring on Fuji..."
        : phase === "done"
          ? "Attested ✓"
          : "Sign with Lumin + anchor on Fuji";

  return (
    <div className="grid gap-2">
      <button
        className="cursor-pointer rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#0f4536] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155b49] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={phase === "signing" || phase === "attesting" || phase === "done"}
        onClick={handleClick}
        type="button"
      >
        {label}
      </button>
      {message && (
        <p
          aria-live="polite"
          className={`text-sm ${
            phase === "error" ? "text-[#7a2e25]" : "text-[#607066]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
