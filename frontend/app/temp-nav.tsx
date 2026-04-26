"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useKiwiState } from "./kiwi-state";

const links = [
  ["Home", "/"],
  ["Client 1", "/business"],
  ["Client 2", "/business2"],
  ["Jobs", "/business/jobs"],
  ["Money", "/business/money"],
  ["Mia", "/contractors/mia-thompson"],
  ["Liam", "/contractors/liam-patel"],
  ["Ava", "/contractors/ava-williams"],
];

export default function TempNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { resetLocalDemo, seedDemoRequests } = useKiwiState();

  function handleDemo() {
    const clientId = pathname.startsWith("/business2") ? "client-2" : "client-1";

    seedDemoRequests(clientId);

    if (!pathname.startsWith("/business") && pathname !== "/client") {
      router.push("/business");
    }
  }

  return (
    <nav
      aria-label="Temporary page navigation"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-lg border border-[#cfd8ca] bg-white/95 p-2 shadow-lg backdrop-blur"
      data-testid="temporary-navigation"
    >
      {links.map(([label, href]) => (
        <Link
          className="rounded-md border border-[#d9ded2] px-3 py-2 text-sm font-bold text-[#17211d] hover:bg-[#e7f2ee]"
          data-testid={`temp-nav-${label.toLowerCase()}-link`}
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
      <button
        className="rounded-md border border-[#d9ded2] px-3 py-2 text-sm font-bold text-[#17211d] hover:bg-[#e7f2ee]"
        data-testid="temp-nav-reset-button"
        onClick={resetLocalDemo}
        type="button"
      >
        Reset
      </button>
      <button
        className="rounded-md border border-[#d9ded2] px-3 py-2 text-sm font-bold text-[#17211d] hover:bg-[#e7f2ee]"
        data-testid="temp-nav-demo-button"
        onClick={handleDemo}
        type="button"
      >
        Demo
      </button>
    </nav>
  );
}
