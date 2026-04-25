import Link from "next/link";

const links = [
  ["Home", "/"],
  ["Business", "/client"],
  ["ClearView", "/contractors/clearview-central"],
  ["Harbour", "/contractors/harbour-shine"],
  ["Kapiti", "/contractors/kapiti-glass-care"],
];

export default function TempNav() {
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
    </nav>
  );
}
